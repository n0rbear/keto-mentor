import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { pinoHttp } from "pino-http";
import { z } from "zod";
import { createMealSchema, editMealSchema, repeatMealSchema, loginSchema, localeUpdateSchema, locales, mealInterpretationSchema, onboardingSchema, registerSchema, type Locale } from "@keto-mentor/shared";
import { env } from "./config.js";
import { createLogger } from "./logger.js";


import { hashPassword, readRefreshToken, requireAuth, setRefreshCookie, signRefreshToken, verifyPassword } from "./auth.js";
import { createSession, rotateSession, revokeActiveSession } from "./session.js";
import { prisma } from "./db.js";
import { searchFoods } from "./catalog/food-search.js";
import { confirmAuthoritativeFood, externalFoodConfirmationSchema, resolveAuthoritativeFood, resolveBarcodeFood } from "./catalog/external-food.js";
import { EXTERNAL_FOOD_CONFIRM_RATE_LIMIT, EXTERNAL_FOOD_RATE_LIMIT, externalFoodRateLimitKey } from "./catalog/external-food-rate-limit.js";
import { UsdaFoodDataCentralLookupAdapter, OpenFoodFactsProductAdapter } from "./catalog/structured-source-adapters.js";
import { validateBarcode } from "./catalog/barcode.js";
import { parseNaturalFoodQuery } from "./catalog/natural-food-query.js";
import { createMeal } from "./meals/create-meal.js";
import { editMeal, deleteMeal, getMeal } from "./meals/edit-meal.js";
import { repeatMeal } from "./meals/repeat-meal.js";
import { resolveDiaryDateRange, resolveWeekRange } from "./meals/diary-date.js";
import { getMealsForDay } from "./meals/diary-query.js";
import { getWeekOverview } from "./meals/week-query.js";
import { recipeRouter } from "./recipes/router.js";
import { interpretMealInput } from "./meal-input/interpret.js";
import { attachRecipeDiscoveryFallback } from "./meal-input/recipe-discovery-fallback.js";
import { configuredFoodAiProvider } from "./ai/food-ai-gateway.js";
import { FoodNlpUserRateLimiter, rateLimitedFoodNlpProvider } from "./ai/food-nlp-rate-limit.js";
import { configuredQuantityAiProvider } from "./meal-input/quantity-ai-gateway.js";
import { configuredSearchIntentProvider } from "./catalog/search-intent-gateway.js";
import { configuredCandidateLocalizationProvider } from "./catalog/candidate-localization-gateway.js";
import { DynamicFoodResolutionRateLimiter } from "./catalog/dynamic-food-rate-limit.js";
import { configuredWebKnowledgeSearchProvider } from "./web-knowledge/web-knowledge-gateway.js";
import { WebKnowledgeSearchRateLimiter } from "./web-knowledge/web-knowledge-rate-limit.js";
import { NegativeSearchCache } from "./web-knowledge/negative-search-cache.js";
import { RecipeDiscoveryService } from "./recipes/recipe-discovery.js";
import { configuredRecipeAiProvider } from "./recipes/recipe-ai-gateway.js";

const logger = createLogger(env.NODE_ENV === "production" ? "info" : "debug");
const app = express();
const usdaAdapter = env.USDA_FDC_API_KEY ? new UsdaFoodDataCentralLookupAdapter(env.USDA_FDC_API_KEY) : null;
// Open Food Facts needs no API key/config, so it's always constructed.
const openFoodFactsAdapter = new OpenFoodFactsProductAdapter();
// Ordinary text search (resolveAuthoritativeFood) intentionally never
// includes Open Food Facts — its own lookup() is a no-op anyway, but it is
// also kept out of this array so a text search can never even attempt the
// external call. Barcode lookup and confirmation use openFoodFactsAdapter
// directly/via externalFoodConfirmAdapters instead.
const externalFoodAdapters = usdaAdapter ? [usdaAdapter] : [];
const externalFoodConfirmAdapters = usdaAdapter ? [usdaAdapter, openFoodFactsAdapter] : [openFoodFactsAdapter];
const foodNlpProvider = configuredFoodAiProvider(env);
const foodNlpLimiter = new FoodNlpUserRateLimiter();
const quantityProvider = configuredQuantityAiProvider(env);
// Reuses the exact same configured AI gateway credentials as food
// understanding/quantity estimation — no new secret. Dynamic external
// resolution itself is gated separately below on usdaAdapter (env.USDA_FDC_API_KEY)
// so a configured LLM alone can never enable it without a real source adapter.
const searchIntentProvider = configuredSearchIntentProvider(env);
// Same configured AI gateway again — localizes an already-identified
// candidate's display name into the user's UI language, never decides
// identity/nutrition. Independent of USDA_FDC_API_KEY: unused when dynamic
// resolution itself is off, since it is only ever invoked from within that path.
const candidateLocalizationProvider = configuredCandidateLocalizationProvider(env);
const dynamicFoodResolutionLimiter = new DynamicFoodResolutionRateLimiter();
// Web recipe discovery: strictly a fallback layered on top of meal-input
// interpretation (see recipe-discovery-fallback.ts), never wired into
// interpretMealInput itself. Reuses the exact same recipe-extraction AI
// gateway credentials as the manual URL-import flow (recipes/router.ts) — a
// second instance is intentional and cheap (stateless besides id/model), so
// this file never needs to import from recipes/router.ts.
const webKnowledgeSearchProvider = configuredWebKnowledgeSearchProvider(env);
const webKnowledgeSearchRateLimiter = new WebKnowledgeSearchRateLimiter();
const recipeDiscoveryNegativeCache = new NegativeSearchCache();
const recipeDiscoveryAiProvider = configuredRecipeAiProvider(env);
const recipeDiscoveryService = new RecipeDiscoveryService({
  provider: webKnowledgeSearchProvider,
  rateLimiter: webKnowledgeSearchRateLimiter,
  negativeCache: recipeDiscoveryNegativeCache
});

// The authenticated user's own persisted locale (from requireAuth's DB read)
// is the single trusted source of UI language for server-side localization —
// never a client-supplied header/param. Falls back to "hu" only if the
// stored value is somehow not one of the three supported locales.
function trustedLocale(user: { locale: string }): Locale {
  return (locales as readonly string[]).includes(user.locale) ? (user.locale as Locale) : "hu";
}

if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()), credentials: true }));
app.use(pinoHttp({ logger }));


const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

// Refresh verifies a secret and mutates session state, so it gets its own
// limiter. The limit is deliberately generous (per-IP) so that legitimate
// concurrent/exponential-backoff refreshes are not blocked, while still
// blunting brute-force/replay against the refresh endpoint.
const refreshLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
const externalFoodLimiter = rateLimit({
  ...EXTERNAL_FOOD_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: externalFoodRateLimitKey
});
const externalFoodConfirmLimiter = rateLimit({ ...EXTERNAL_FOOD_CONFIRM_RATE_LIMIT, standardHeaders: true, legacyHeaders: false, keyGenerator: externalFoodRateLimitKey });

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

    const session = await createSession(prisma, user);
    setRefreshCookie(res, session.refreshToken);
    res.status(201).json({ user, accessToken: session.accessToken });
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
    const session = await createSession(prisma, user);
    setRefreshCookie(res, session.refreshToken);
    res.json({ user, accessToken: session.accessToken });
  } catch (error) {
    next(error);
  }
});




app.post("/auth/logout", requireAuth, async (req, res, next) => {
  try {
    // Revoke only the active session so other logged-in devices keep working.
    const payload = readRefreshToken(req);
    if (payload) {
      await revokeActiveSession(prisma, payload, req.user!.id);
    }
    res.clearCookie("km_refresh");
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});


app.post("/auth/refresh", refreshLimiter, async (req, res, next) => {
  try {
    const payload = readRefreshToken(req);
    // Genuine invalid/malformed/expired/replayed tokens are normal 401s, not
    // infrastructure failures; the refresh cookie is cleared for them.
    if (!payload) {
      res.clearCookie("km_refresh");
      return res.status(401).json({ error: "invalid_token" });
    }
    const result = await rotateSession(prisma, payload);
    if (!result.ok) {
      res.clearCookie("km_refresh");
      return res.status(401).json({ error: "invalid_token" });
    }
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    // Unexpected Prisma/transaction/Argon2/system failures must reach the
    // centralized error handler (next) rather than becoming unhandled rejections.
    next(error);
  }
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

app.post("/foods/resolve-external", requireAuth, externalFoodLimiter, async (req, res, next) => {
  try {
    const { query } = z.object({ query: z.string().trim().min(2).max(120) }).parse(req.body);
    res.json(await resolveAuthoritativeFood(prisma, query, externalFoodAdapters, { locale: trustedLocale(req.user!), provider: candidateLocalizationProvider }));
  } catch (error) {
    next(error);
  }
});

app.post("/foods/resolve-external/confirm", requireAuth, externalFoodConfirmLimiter, async (req, res, next) => {
  try {
    const input = externalFoodConfirmationSchema.parse(req.body);
    res.json(await confirmAuthoritativeFood(prisma, input.source, input.sourceId, externalFoodConfirmAdapters, { locale: trustedLocale(req.user!), provider: candidateLocalizationProvider }));
  } catch (error) { next(error); }
});

// Local-first barcode lookup: a bounded, purely numeric GTIN with a correct
// check digit is required before any Open Food Facts call is even attempted.
// Never persists anything — a matched external candidate always requires the
// existing /foods/resolve-external/confirm flow (re-fetch + review) to save.
app.get("/foods/resolve-barcode", requireAuth, externalFoodLimiter, async (req, res, next) => {
  try {
    const raw = typeof req.query.barcode === "string" ? req.query.barcode : "";
    const validated = validateBarcode(raw);
    if (!validated.ok) return res.status(400).json({ error: validated.reason === "invalid_checksum" ? "invalid_barcode_checksum" : "invalid_barcode_format" });
    res.json(await resolveBarcodeFood(prisma, validated.barcode, openFoodFactsAdapter));
  } catch (error) { next(error); }
});

app.post("/meal-input/interpret", requireAuth, async (req, res, next) => {
  try {
    const input = mealInterpretationSchema.parse(req.body);
    const requestProvider = rateLimitedFoodNlpProvider(foodNlpProvider, foodNlpLimiter, req.user!.id);
    // A live read of quantityProvider.id, not a value captured once here: when
    // quantityProvider is a failover wrapper, its id can change between this
    // line and the eventual estimate() call below (a fallback to the
    // secondary), so a snapshot taken now would misreport which provider
    // actually served this request in the quantity_ai diagnostic.
    const requestQuantityProvider = { get id() { return quantityProvider.id; }, estimate: (input: Parameters<typeof quantityProvider.estimate>[0]) => quantityProvider.estimate(input, undefined, () => foodNlpLimiter.consume(req.user!.id)) };
    // Only reachable on a genuine local catalog miss (see interpretOne) —
    // never adds a request on a local hit. No adapters configured (e.g. no
    // USDA_FDC_API_KEY) means dynamic resolution is simply not offered.
    const dynamic = externalFoodAdapters.length
      ? { prisma, searchIntentProvider, adapters: externalFoodAdapters, rateLimiter: dynamicFoodResolutionLimiter, userId: req.user!.id, locale: trustedLocale(req.user!), localizationProvider: candidateLocalizationProvider }
      : null;
    const result = await interpretMealInput(prisma, input.text, requestQuantityProvider, requestProvider, dynamic);
    // Fallback layered on top of interpretation, never inside it — only ever
    // reached when interpretMealInput's own local/structured/AI-assisted
    // resolution has already genuinely failed on a composite-dish phrase. A
    // no-op (webKnowledgeSearchProvider.id === "disabled") when
    // WEB_SEARCH_PROVIDER is unset, at zero extra cost.
    res.json(await attachRecipeDiscoveryFallback(result, { discoveryService: recipeDiscoveryService, recipeAiProvider: recipeDiscoveryAiProvider, prisma, userId: req.user!.id, locale: trustedLocale(req.user!) }));
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

// Standalone language-switch endpoint for an already-onboarded user (see
// onboardingSchema above, which always also marks onboarding done and so is
// the wrong shape for "just change my language"). The persisted User.locale
// is the single canonical source of the user's UI language — the frontend
// calls this immediately on every language-selector change so the two never
// diverge beyond one request round-trip, without duplicating locale state
// anywhere else (no localStorage copy).
app.patch("/me/locale", requireAuth, async (req, res, next) => {
  try {
    const input = localeUpdateSchema.parse(req.body);
    await prisma.user.update({ where: { id: req.user!.id }, data: { locale: input.locale } });
    res.json({ locale: input.locale });
  } catch (error) {
    next(error);
  }
});

// Kept at /meals/today for backward compatibility; ?date=YYYY-MM-DD (with an
// optional ?tzOffsetMinutes, per Date.prototype.getTimezoneOffset()) selects
// any calendar day in the caller's own timezone instead of defaulting to today.
app.get("/meals/today", requireAuth, async (req, res, next) => {
  try {
    const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
    const tzOffsetParam = typeof req.query.tzOffsetMinutes === "string" ? req.query.tzOffsetMinutes : undefined;
    const range = resolveDiaryDateRange({ date: dateParam, tzOffsetMinutes: tzOffsetParam });
    const view = req.query.view === "summary" ? "summary" : "detailed";
    const result = await getMealsForDay(prisma, req.user!.id, range, view);
    res.json(result);
  } catch (error) {
    next(error);
  }
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

// Compact 7-day (Monday-Sunday) overview, timezone-aware via the same
// convention as /meals/today. Must stay registered before /meals/:mealId so
// Express never matches "week" as a mealId.
app.get("/meals/week", requireAuth, async (req, res, next) => {
  try {
    const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
    const tzOffsetParam = typeof req.query.tzOffsetMinutes === "string" ? req.query.tzOffsetMinutes : undefined;
    const week = resolveWeekRange({ date: dateParam, tzOffsetMinutes: tzOffsetParam });
    const result = await getWeekOverview(prisma, req.user!.id, week);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Single-meal detail, backing the web edit UI (the dashboard list uses the
// slim ?view=summary shape and intentionally has no per-item data).
app.get("/meals/:mealId", requireAuth, async (req, res, next) => {
  try {
    const meal = await getMeal(prisma, req.user!.id, req.params.mealId);
    res.json({ meal });
  } catch (error) {
    next(error);
  }
});

// Corrects title/eatenAt and/or existing item grams, or removes existing items.
// Never accepts food/recipe identity or nutrition fields from the client.
app.patch("/meals/:mealId", requireAuth, async (req, res, next) => {
  try {
    const input = editMealSchema.parse(req.body);
    const meal = await editMeal(prisma, req.user!.id, req.params.mealId, input);
    res.json({ meal });
  } catch (error) {
    next(error);
  }
});

app.delete("/meals/:mealId", requireAuth, async (req, res, next) => {
  try {
    await deleteMeal(prisma, req.user!.id, req.params.mealId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Quick repeat: logs a new meal reproducing an existing one (same title,
// items, trusted Food/Recipe references, quantities), timestamped at now.
// The body carries nothing — the server loads the trusted source itself.
app.post("/meals/:mealId/repeat", requireAuth, async (req, res, next) => {
  try {
    repeatMealSchema.parse(req.body ?? {});
    const meal = await repeatMeal(prisma, req.user!.id, req.params.mealId);
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
