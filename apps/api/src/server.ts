import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { createMealSchema, loginSchema, mealInterpretationSchema, onboardingSchema, registerSchema } from "@keto-mentor/shared";
import { env } from "./config.js";

import { hashPassword, readRefreshToken, requireAuth, setRefreshCookie, signAccessToken, signRefreshToken, verifyPassword } from "./auth.js";
import { prisma } from "./db.js";
import { serializeMeal } from "./nutrition.js";
import { searchFoods } from "./catalog/food-search.js";
import { parseNaturalFoodQuery } from "./catalog/natural-food-query.js";
import { createMeal } from "./meals/create-meal.js";
import { recipeRouter } from "./recipes/router.js";
import { interpretMealInput } from "./meal-input/interpret.js";

const logger = pino({ level: env.NODE_ENV === "production" ? "info" : "debug" });
const app = express();

if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()), credentials: true }));
app.use(pinoHttp({ logger }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

const healthPayload = { ok: true, service: "keto-mentor-api" };
app.get("/", (_req, res) => res.json(healthPayload));
app.get("/health", (_req, res) => res.json(healthPayload));

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
  // Revoke only the active session so other logged-in devices keep working.
  const payload = readRefreshToken(req);
  if (payload) {
    await prisma.session.updateMany({ where: { id: payload.sessionId, userId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  res.clearCookie("km_refresh");
  res.status(204).end();
});

app.post("/auth/refresh", async (req, res) => {
  const payload = readRefreshToken(req);
  if (!payload) return res.status(401).json({ error: "invalid_token" });
  let session;
  try {
    session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    res.clearCookie("km_refresh");
    return res.status(401).json({ error: "invalid_token" });
  }
  // Validate the refresh token against the stored hash (rotation / replay guard).
  if (!(await verifyPassword(session.refreshHash, payload.sessionId))) {
    res.clearCookie("km_refresh");
    return res.status(401).json({ error: "invalid_token" });
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, username: true, locale: true } });
  if (!user) return res.status(401).json({ error: "invalid_token" });
  // Rotate: revoke the old session and issue a fresh one.
  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  const next = await prisma.session.create({
    data: { userId: user.id, refreshHash: await hashPassword(`${user.id}:${Date.now()}`), expiresAt: new Date(Date.now() + 30 * 86400_000) }
  });
  setRefreshCookie(res, signRefreshToken(next.id));
  res.status(200).json({ accessToken: signAccessToken(user) });
});

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, username: true, locale: true, profile: true, entitlements: true }
  });
  res.json({ user });
});

app.get("/foods", requireAuth, async (req, res, next) => {
  try {
    const parsed = parseNaturalFoodQuery(String(req.query.q ?? ""));
    const foods = await searchFoods(prisma, parsed.foodQuery);
    res.json({ foods, parsedQuery: parsed, resolution: foods.length ? "resolved" : "unresolved" });
  } catch (error) {
    next(error);
  }
});

app.post("/meal-input/interpret", requireAuth, async (req, res, next) => {
  try {
    const input = mealInterpretationSchema.parse(req.body);
    res.json(await interpretMealInput(prisma, input.text));
  } catch (error) {
    next(error);
  }
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
    include: { items: { include: { food: true, recipe: true } } }
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
    const meal = await createMeal(prisma, req.user!.id, input);
    res.status(201).json({ meal });
  } catch (error) {
    next(error);
  }
});

app.use("/recipes", recipeRouter);

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error?.name === "ZodError") return res.status(400).json({ error: "validation_error", issues: error.issues });
  if (error?.status && error?.publicCode) return res.status(error.status).json({ error: error.publicCode });
  logger.error(error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(env.PORT, () => logger.info({ port: env.PORT }, "Keto Mentor API listening"));
