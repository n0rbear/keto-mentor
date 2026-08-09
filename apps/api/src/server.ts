import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { createMealSchema, loginSchema, onboardingSchema, registerSchema } from "@keto-mentor/shared";
import { env } from "./config.js";
import { hashPassword, requireAuth, setRefreshCookie, signAccessToken, signRefreshToken, verifyPassword } from "./auth.js";
import { prisma } from "./db.js";
import { serializeMeal } from "./nutrition.js";

const logger = pino({ level: env.NODE_ENV === "production" ? "info" : "debug" });
const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN.split(","), credentials: true }));
app.use(pinoHttp({ logger }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

app.get("/health", (_req, res) => res.json({ ok: true, service: "keto-mentor-api" }));

app.post("/auth/register", authLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        username: input.username.toLowerCase(),
        passwordHash,
        locale: input.locale,
        profile: { create: { onboardingDone: false } },
        entitlements: { create: { plan: "free", features: ["meal_tracking", "basic_goals"] } }
      },
      select: { id: true, username: true, locale: true }
    });
    const session = await prisma.session.create({
      data: { userId: user.id, refreshHash: await hashPassword(`${user.id}:${Date.now()}`), expiresAt: new Date(Date.now() + 30 * 86400_000) }
    });
    setRefreshCookie(res, signRefreshToken(session.id));
    res.status(201).json({ user, accessToken: signAccessToken(user) });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(409).json({ error: "username_taken" });
    next(error);
  }
});

app.post("/auth/login", authLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const userWithHash = await prisma.user.findUnique({ where: { username: input.username.toLowerCase() } });
    if (!userWithHash || !(await verifyPassword(userWithHash.passwordHash, input.password))) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    const user = { id: userWithHash.id, username: userWithHash.username, locale: userWithHash.locale };
    const session = await prisma.session.create({
      data: { userId: user.id, refreshHash: await hashPassword(`${user.id}:${Date.now()}`), expiresAt: new Date(Date.now() + 30 * 86400_000) }
    });
    setRefreshCookie(res, signRefreshToken(session.id));
    res.json({ user, accessToken: signAccessToken(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/logout", requireAuth, async (req, res) => {
  res.clearCookie("km_refresh");
  await prisma.session.updateMany({ where: { userId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date() } });
  res.status(204).end();
});

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, username: true, locale: true, profile: true, entitlements: true }
  });
  res.json({ user });
});

app.get("/foods", requireAuth, async (req, res) => {
  const query = String(req.query.q ?? "").trim().toLowerCase();
  const foods = await prisma.food.findMany({
    where: { createdById: null },
    take: 50,
    orderBy: { name: "asc" }
  });
  const filtered = foods.filter((food) => {
    if (!query) return true;
    const blob = JSON.stringify([food.name, food.names, food.synonyms]).toLowerCase();
    return blob.includes(query);
  });
  res.json({ foods: filtered });
});

app.put("/me/onboarding", requireAuth, async (req, res, next) => {
  try {
    const input = onboardingSchema.parse(req.body);
    const { locale, ...profileInput } = input;
    await prisma.user.update({ where: { id: req.user!.id }, data: { locale } });
    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.id },
      update: { ...profileInput, onboardingDone: true },
      create: { userId: req.user!.id, ...profileInput, onboardingDone: true }
    });
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

app.get("/meals/today", requireAuth, async (req, res) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const meals = await prisma.meal.findMany({
    where: { userId: req.user!.id, eatenAt: { gte: start, lt: end } },
    orderBy: { eatenAt: "desc" },
    include: { items: { include: { food: true } } }
  });
  const serialized = meals.map(serializeMeal);
  const totals = serialized.reduce((sum, meal) => ({
    kcal: sum.kcal + meal.totals.kcal,
    fat: sum.fat + meal.totals.fat,
    protein: sum.protein + meal.totals.protein,
    carbs: sum.carbs + meal.totals.carbs,
    fiber: sum.fiber + meal.totals.fiber,
    netCarbs: sum.netCarbs + meal.totals.netCarbs
  }), { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });
  res.json({ meals: serialized, totals });
});

app.post("/meals", requireAuth, async (req, res, next) => {
  try {
    const input = createMealSchema.parse(req.body);
    const catalogFoodIds = input.items.filter((item) => "foodId" in item).map((item) => item.foodId);
    const catalogFoods = await prisma.food.findMany({ where: { id: { in: catalogFoodIds } } });
    const byId = new Map(catalogFoods.map((food) => [food.id, food]));
    const meal = await prisma.meal.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        eatenAt: input.eatenAt ? new Date(input.eatenAt) : new Date(),
        items: {
          create: input.items.map((item) => {
            if ("foodId" in item) {
              const food = byId.get(item.foodId);
              if (!food) throw new Error("food_not_found");
              const quantityGrams = item.unit === "serving" ? item.quantity * (food.servingGrams ?? 100) : item.quantity;
              return { quantityGrams, food: { connect: { id: item.foodId } } };
            }
            return {
              quantityGrams: item.quantityGrams,
              food: {
                create: {
                  name: item.foodName,
                  source: item.source,
                  provenance: { createdVia: "manual_fallback", userId: req.user!.id },
                  kcalPer100g: item.kcalPer100g,
                  fatPer100g: item.fatPer100g,
                  proteinPer100g: item.proteinPer100g,
                  carbsPer100g: item.carbsPer100g,
                  fiberPer100g: item.fiberPer100g,
                  createdById: req.user!.id
                }
              }
            };
          })
        }
      },
      include: { items: { include: { food: true } } }
    });
    res.status(201).json({ meal: serializeMeal(meal) });
  } catch (error) {
    next(error);
  }
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error?.name === "ZodError") return res.status(400).json({ error: "validation_error", issues: error.issues });
  logger.error(error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(env.PORT, () => logger.info({ port: env.PORT }, "Keto Mentor API listening"));
