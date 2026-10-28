import compression from "compression";
import { foodLocaleFor } from "./catalog/food-locale.js";
import { unifiedSearch } from "./meal-input/unified-search.js";
import { sharedFallbackResultCaches } from "./catalog/dynamic-food-resolution.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { pinoHttp } from "pino-http";
import { z } from "zod";
import { createMealSchema, editMealSchema, editPrivateFoodSchema, repeatMealSchema, loginSchema, localeUpdateSchema, locales, mealInterpretationSchema, onboardingSchema, registerSchema, effectiveGoals, weekdayGoalsSchema, fridgeItems, type Locale } from "@keto-mentor/shared";
import { Prisma } from "@prisma/client";
import { env } from "./config.js";
import { createLogger } from "./logger.js";


import { hashPassword, readRefreshToken, rememberFromCookie, requireAuth, setRefreshCookie, signRefreshToken, verifyPassword } from "./auth.js";
import { createSession, rotateSession, revokeActiveSession } from "./session.js";
import { prisma } from "./db.js";
import { searchFoods } from "./catalog/food-search.js";
import { confirmAuthoritativeFood, externalFoodConfirmationSchema, resolveAuthoritativeFood, resolveBarcodeFood } from "./catalog/external-food.js";
import { EXTERNAL_FOOD_CONFIRM_RATE_LIMIT, EXTERNAL_FOOD_RATE_LIMIT, RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT, externalFoodRateLimitKey } from "./catalog/external-food-rate-limit.js";
import { UsdaFoodDataCentralLookupAdapter, OpenFoodFactsProductAdapter, OpenFoodFactsNameAdapter } from "./catalog/structured-source-adapters.js";
import { validateBarcode } from "./catalog/barcode.js";
import { parseNaturalFoodQuery } from "./catalog/natural-food-query.js";
import { createMeal } from "./meals/create-meal.js";
import { editMeal, deleteMeal, getMeal } from "./meals/edit-meal.js";
import { repeatMeal } from "./meals/repeat-meal.js";
import { resolveDiaryDateRange, resolveWeekRange } from "./meals/diary-date.js";
import { getMealsForDay } from "./meals/diary-query.js";
import { normalizeSearch } from "./catalog/normalize.js";
import { DINNER_FEATURE, fridgeKeys, hasPremiumFeature, loadDinnerCandidates, rankDinnerSuggestions, recentlyShown, rememberShown } from "./meals/dinner-suggestions.js";
import { getWeekOverview } from "./meals/week-query.js";
import { recipeRouter } from "./recipes/router.js";
import { interpretMealInput, resolveQuantity } from "./meal-input/interpret.js";
import { tryFromInterpretation, tryReferenceDish, fillUnclearWithReferenceDishes } from "./meal-input/public-try.js";
import { attachRecipeDiscoveryFallback } from "./meal-input/recipe-discovery-fallback.js";
import { timeStage } from "./request-performance.js";
import { buildDiagnostics } from "./meal-input/diagnostics.js";
import { configuredFoodAiProvider } from "./ai/food-ai-gateway.js";
import { FoodNlpUserRateLimiter, rateLimitedFoodNlpProvider } from "./ai/food-nlp-rate-limit.js";
import { configuredQuantityAiProvider } from "./meal-input/quantity-ai-gateway.js";
import { configuredSearchIntentProvider } from "./catalog/search-intent-gateway.js";
import { configuredSemanticRecoveryProvider } from "./catalog/semantic-recovery-gateway.js";
import { configuredCandidateLocalizationProvider } from "./catalog/candidate-localization-gateway.js";
import { backfillFoodNames } from "./catalog/backfill-food-names.js";
import { configuredSemanticCandidateGateProvider } from "./catalog/semantic-candidate-gate-gateway.js";
import { configuredRecipeSemanticGateProvider } from "./catalog/semantic-candidate-gate-batch-gateway.js";
import { configuredRecipeIngredientNormalizationProvider } from "./recipes/recipe-ingredient-normalization-gateway.js";
import { configuredRecipeQuantityEstimationProvider } from "./recipes/recipe-quantity-estimation-gateway.js";
import { DynamicFoodResolutionRateLimiter } from "./catalog/dynamic-food-rate-limit.js";
import { configuredWebKnowledgeSearchProvider } from "./web-knowledge/web-knowledge-gateway.js";
import { WebKnowledgeSearchRateLimiter } from "./web-knowledge/web-knowledge-rate-limit.js";
import { NegativeSearchCache } from "./web-knowledge/negative-search-cache.js";
import { RecipeDiscoveryService } from "./recipes/recipe-discovery.js";
import { configuredRecipeAiProvider } from "./recipes/recipe-ai-gateway.js";
import { configuredNutritionEvidenceExtractionProvider } from "./catalog/nutrition-evidence-extraction-gateway.js";
import { WebEvidenceFallbackRateLimiter } from "./catalog/web-evidence-fallback.js";
import { configuredAiNutritionEstimationProvider } from "./catalog/ai-nutrition-estimation-gateway.js";
import { AiEstimateRateLimiter } from "./catalog/ai-estimate-rate-limit.js";
import { editPrivateFood } from "./catalog/edit-private-food.js";
import { publishProgress, subscribeProgress, closeProgress } from "./meal-input/progress-bus.js";
import { configuredTranscriptionProvider } from "./ai/transcription-gateway.js";
import { TranscriptionProviderError } from "./ai/transcription-provider.js";
import { feedbackRouter } from "./feedback/feedback.js";
import { passwordResetRouter, sendPasswordReset } from "./password-reset/password-reset.js";
import { preferredWebOrigin, resendMailer } from "./mail/mailer.js";
import { accountDeletionRouter, deleteAccount } from "./account/account-deletion.js";
import { startUsageFlusher, usageMiddleware } from "./admin/usage-counters.js";
import { getSettings, loadSettings, startPremiumUsersRefresher } from "./admin/runtime-settings.js";
import { adminEmailList, emailVerificationRouter, isAdminUser, sendVerification } from "./admin/email-verification.js";
import { forbidAdminAccountWrites } from "./admin/admin-only-account.js";
import { keepAwakeUrls, startKeepAwake } from "./keep-awake.js";
import { mealPlanRouter } from "./meals/meal-plan-router.js";
import { progressRouter } from "./stats/progress-router.js";
import { remindersRouter, startReminders } from "./reminders/reminders.js";
import { adminRouter } from "./admin/admin-router.js";
import { betaContestRouter } from "./beta/contest.js";
import { recentProductsRouter } from "./meals/recent-products.js";
import { campaignPublicRouter, countCampaign } from "./campaigns/campaign-links.js";
import { REFERENCE_USERNAME } from "./reference-dishes/seed.js";
import { notifyOwner, registerWithHub, visitorDevice, visitorIp } from "./notify-hub.js";
import { platesRouter } from "./meal-input/plates.js";
import { VOICE_TRANSCRIBE_RATE_LIMIT, voiceTranscribeRateLimitKey } from "./meal-input/voice-rate-limit.js";

const logger = createLogger(env.NODE_ENV === "production" ? "info" : "debug");
const app = express();
const usdaAdapter = env.USDA_FDC_API_KEY ? new UsdaFoodDataCentralLookupAdapter(env.USDA_FDC_API_KEY) : null;
// Open Food Facts needs no API key/config, so it's always constructed.
const openFoodFactsAdapter = new OpenFoodFactsProductAdapter();
// Text search uses the separately budgeted OFF adapter. Barcode lookup and
// confirmation still re-fetch the exact product through the barcode adapter.
const offNameAdapter = new OpenFoodFactsNameAdapter();
const externalFoodAdapters = usdaAdapter ? [usdaAdapter, offNameAdapter] : [offNameAdapter];
const externalFoodConfirmAdapters = usdaAdapter ? [usdaAdapter, openFoodFactsAdapter] : [openFoodFactsAdapter];
const foodNlpProvider = configuredFoodAiProvider(env);
const foodNlpLimiter = new FoodNlpUserRateLimiter();
const quantityProvider = configuredQuantityAiProvider(env);
// Reuses the exact same configured AI gateway credentials as food
// understanding/quantity estimation — no new secret. Dynamic external
// resolution itself is gated separately below on usdaAdapter (env.USDA_FDC_API_KEY)
// so a configured LLM alone can never enable it without a real source adapter.
const searchIntentProvider = configuredSearchIntentProvider(env);
// Second-chance search-term recovery (2026-09-23), tried only after the
// ordinary search-intent-driven attempt already failed — see
// dynamic-food-resolution.ts's attemptSemanticRecovery. Same configured AI
// gateway again, own narrow schema (semantic-recovery.ts); never itself a
// nutrition or identity source.
const semanticRecoveryProvider = configuredSemanticRecoveryProvider(env);
// Same configured AI gateway again — localizes an already-identified
// candidate's display name into the user's UI language, never decides
// identity/nutrition. Independent of USDA_FDC_API_KEY: unused when dynamic
// resolution itself is off, since it is only ever invoked from within that path.
const candidateLocalizationProvider = configuredCandidateLocalizationProvider(env);
// Owner-beta blocker #9 (2026-09-11): independently re-validates every
// external candidate against the ORIGINAL identity the user typed, before
// it can ever be offered for confirmation or auto-resolved — see
// catalog/semantic-candidate-gate.ts. Same configured AI gateway again, but
// a SEPARATE call/schema from searchIntentProvider — never trusted merely
// because the same model generated the search term being validated.
const semanticCandidateGateProvider = configuredSemanticCandidateGateProvider(env);
const recipeSemanticGateProvider = configuredRecipeSemanticGateProvider(env);
// Owner-beta checkpoint (2026-09-13): the whole-recipe-context batch
// ingredient-normalization path (see recipe-ingredient-normalization.ts and
// the ingredient-resolution forensic checkpoint). Same configured AI gateway
// again — a search-key generator, never a source of nutrition or trusted
// identity; only used by recipe-discovery-fallback's own recipe-ingredient
// resolution below, never wired into ordinary (non-recipe) meal-input items.
const recipeIngredientNormalizationProvider = configuredRecipeIngredientNormalizationProvider(env);
const recipeQuantityEstimationProvider = configuredRecipeQuantityEstimationProvider(env);
const dynamicFoodResolutionLimiter = new DynamicFoodResolutionRateLimiter();
// Owner-beta (2026-09-14): a SEPARATE, more generously-sized limiter
// dedicated to recipe-discovery ingredient resolution — see
// RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT. Live reproduction proved a single
// real recipe candidate (8-12 ingredients) exhausts the ordinary per-meal
// budget (dynamicFoodResolutionLimiter, 10/15min) partway through, so later
// ingredients failed with reason="rate_limited" regardless of whether they
// were actually resolvable. Keeps the original limiter's abuse protection
// for ordinary meal-input items completely untouched.
const recipeIngredientDynamicResolutionLimiter = new DynamicFoodResolutionRateLimiter(Date.now, RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT);
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
// DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK (2026-09-16):
// reuses the SAME Tavily web-search gateway instance recipe discovery
// already uses above (no second search credential) plus its own dedicated
// nutrition-extraction AI gateway and its own tighter rate limiter — see
// catalog/web-evidence-fallback.ts. A no-op end-to-end when either
// WEB_SEARCH_PROVIDER is unset or the AI gateway is disabled.
const nutritionEvidenceExtractionProvider = configuredNutritionEvidenceExtractionProvider(env);
const webEvidenceFallbackRateLimiter = new WebEvidenceFallbackRateLimiter();
const webEvidenceFallback = { searchProvider: webKnowledgeSearchProvider, extractionProvider: nutritionEvidenceExtractionProvider, rateLimiter: webEvidenceFallbackRateLimiter };
// FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16) — same configured AI
// gateway credentials as every other capability; its own dedicated, tighter
// rate limiter (see ai-estimate-rate-limit.ts). Tried only after web
// evidence ALSO genuinely fails — see dynamic-food-resolution.ts.
const aiNutritionEstimationProvider = configuredAiNutritionEstimationProvider(env);
const aiEstimateRateLimiter = new AiEstimateRateLimiter();
const aiEstimation = { provider: aiNutritionEstimationProvider, rateLimiter: aiEstimateRateLimiter };
// Voice food entry (2026-09-23): reuses OPENAI_API_KEY — no new secret.
// Degrades to a Disabled provider (voice input unavailable, text entry
// completely unaffected) whenever that key isn't configured for this
// deployment — see ai/transcription-gateway.ts.
const transcriptionProvider = configuredTranscriptionProvider(env);

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
// Anonymous daily usage statistics for the admin screen (admin/usage-counters.ts).
app.use(usageMiddleware());


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
// Voice transcription incurs a real external cost per call — see
// meal-input/voice-rate-limit.ts.
const voiceTranscribeLimiter = rateLimit({
  ...VOICE_TRANSCRIBE_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: voiceTranscribeRateLimitKey
});
const externalFoodConfirmLimiter = rateLimit({ ...EXTERNAL_FOOD_CONFIRM_RATE_LIMIT, standardHeaders: true, legacyHeaders: false, keyGenerator: externalFoodRateLimitKey });

const healthPayload = { ok: true, service: "keto-mentor-api" };
app.get("/", (_req, res) => res.json(healthPayload));
app.get("/health", (_req, res) => res.json(healthPayload));

// Owner-beta staging checkpoint (2026-09-13): safe, non-secret build
// identification so the owner can confirm which branch/commit a deployment
// (staging or production) is actually running — Render sets RENDER_GIT_*
// automatically for every service, never user/secret-derived. `bootedAt` is
// this process's own start time (module load), a reasonable proxy for
// "deployed at" absent a dedicated Render env var for it.
const bootedAt = new Date().toISOString();
const renderServiceName = process.env.RENDER_SERVICE_NAME ?? null;
// Staging deliberately runs with NODE_ENV=production (see database-url.ts's
// assertProductionDatabaseSchema and server.ts's secure-cookie/log-level
// branches, none of which have a bespoke "staging" mode) — so NODE_ENV alone
// cannot tell a human apart staging from production. RENDER_SERVICE_NAME
// can: Render sets it to this exact service's own configured name
// ("keto-mentor-api-staging" vs "keto-mentor-api"), which is what the owner
// actually needs to see to know which deployment he's looking at.
const deploymentEnvironment = renderServiceName?.includes("staging") ? "staging" : env.NODE_ENV === "production" ? "production" : env.NODE_ENV;
app.get("/build-info", (_req, res) => res.json({
  environment: deploymentEnvironment,
  serviceName: renderServiceName,
  branch: process.env.RENDER_GIT_BRANCH ?? null,
  commit: process.env.RENDER_GIT_COMMIT ? process.env.RENDER_GIT_COMMIT.slice(0, 7) : null,
  bootedAt
}));

app.post("/auth/register", authLimiter, async (req, res, next) => {
  try {
    // The admin can close registration (admin/runtime-settings.ts).
    if (!getSettings().registrationOpen) return res.status(403).json({ error: "registration_closed" });
    const input = registerSchema.parse(req.body);
    if (input.healthConsent !== true) return res.status(400).json({ error: "health_consent_required" });
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        username: input.username.toLowerCase(),
        email: input.email,
        passwordHash,
        locale: input.locale,
        healthConsentAt: new Date(),
        profile: { create: { onboardingDone: false } },
        entitlements: { create: { plan: "free", features: ["meal_tracking", "basic_goals"] } }
      },
      select: { id: true, username: true, locale: true }
    });

    const session = await createSession(prisma, user);
    setRefreshCookie(res, session.refreshToken);
    res.status(201).json({ user, accessToken: session.accessToken, refreshToken: session.refreshToken });
    // Campaign link the visitor arrived by (anonymous count only).
    void countCampaign(prisma, "signup", req.body?.ref).catch(() => undefined);
    // Confirmation link for the new address, after answering (best effort).
    void sendVerification(verificationDeps, user.id).catch(() => undefined);
    // Push notification to the owner through the NorbApp hub (switchable there).
    const ref = typeof req.body?.ref === "string" ? req.body.ref.slice(0, 40) : "";
    notifyOwner({ event: "signup", label: "Új regisztráció", on: true, message: `Nyelv: ${user.locale}${ref ? ` · kampány: ${ref}` : ""}`, tags: ["tada"], click: webAppUrl, ip: visitorIp(req.header("cf-connecting-ip"), req.ip) });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(409).json({ error: String(error?.meta?.target ?? "").includes("email") ? "email_taken" : "username_taken" });
    next(error);
  }
});

app.post("/auth/login", authLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    // The same field takes the username or the e-mail address (2026-10-15).
    const login = input.username.toLowerCase();
    const userWithHash = await prisma.user.findUnique({ where: login.includes("@") ? { email: login } : { username: login } });
    if (!userWithHash || !(await verifyPassword(userWithHash.passwordHash, input.password))) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const user = { id: userWithHash.id, username: userWithHash.username, locale: userWithHash.locale };
    const session = await createSession(prisma, user);
    setRefreshCookie(res, session.refreshToken, input.remember !== false);
    res.json({ user, accessToken: session.accessToken, ...(input.remember !== false ? { refreshToken: session.refreshToken } : {}) });
    notifyOwner({ event: "login", label: "Bejelentkezés", on: true, message: "Egy felhasználó belépett", ip: visitorIp(req.header("cf-connecting-ip"), req.ip) });
  } catch (error) {
    next(error);
  }
});




// Password reset by e-mail and attaching an e-mail to an existing account.
const mailer = resendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
const webAppUrl = env.WEB_APP_URL ?? preferredWebOrigin(env.CORS_ORIGIN);
const verificationDeps = {
  prisma, mailer, webAppUrl,
  log: (line: string) => {
    console.log(line);
    if (line === "email_verification outcome=confirmed") notifyOwner({ event: "email_verified", label: "E-mail megerősítve", on: false, message: "Egy felhasználó megerősítette az e-mail címét." });
  }
};
const adminEmails = adminEmailList(env.ADMIN_EMAILS);
// The admin account logs nothing (owner decision 2026-10-15).
const adminOnly = forbidAdminAccountWrites({ prisma, admins: adminEmails });
app.use(passwordResetRouter({
  prisma, mailer, webAppUrl, hashPassword, verifyPassword, requireAuth,
  onEmailChanged: (userId) => sendVerification(verificationDeps, userId)
}));
app.use(emailVerificationRouter({ ...verificationDeps, requireAuth }));
// Public, non-secret runtime settings the web needs before sign-in.
app.get("/config", (_req, res) => {
  const { registrationOpen, announcement } = getSettings();
  res.json({ registrationOpen, announcement: announcement.enabled ? announcement : null });
});
app.use(adminRouter({
  prisma, requireAuth, admins: adminEmails, systemUsername: REFERENCE_USERNAME,
  deleteAccount: (userId) => deleteAccount(prisma as any, userId, REFERENCE_USERNAME),
  sendPasswordReset: (user) => sendPasswordReset({ prisma, mailer, webAppUrl }, user)
}));

app.use(campaignPublicRouter({ prisma }));
// Page views for the owner's push notifications (owner request 2026-10-27):
// the web reports the shown view; nothing is stored, robots are skipped.
const pageViewLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => req.header("cf-connecting-ip") ?? req.ip ?? "unknown" });
app.post("/public/pageview", pageViewLimiter, (req, res) => {
  const view = typeof req.body?.view === "string" ? req.body.view.trim().slice(0, 60) : "";
  const device = visitorDevice(req.header("user-agent"));
  if (view && device) notifyOwner({ event: "pageview", label: "Oldalmegtekintés", on: true, message: `${view} · ${device}`, tags: ["eyes"], ip: visitorIp(req.header("cf-connecting-ip"), req.ip) });
  res.status(204).end();
});
app.use(betaContestRouter({ prisma, requireAuth, admins: adminEmails, systemUsername: REFERENCE_USERNAME }));
app.use(recentProductsRouter({ prisma, requireAuth }));
app.use(accountDeletionRouter({
  prisma, requireAuth, verifyPassword, systemUsername: REFERENCE_USERNAME,
  log: (line) => {
    console.log(line);
    if (line.startsWith("account_deleted")) notifyOwner({ event: "account_deleted", label: "Fiók törölve", on: true, message: "Egy felhasználó törölte a fiókját.", tags: ["wave"] });
  }
}));

app.post("/auth/logout", requireAuth, async (req, res, next) => {
  try {
    // Revoke only the active session so other logged-in devices keep working.
    const payload = readRefreshToken(req);
    if (payload) {
      await revokeActiveSession(prisma, payload, req.user!.id);
    }
    res.clearCookie("km_refresh"); res.clearCookie("km_remember");
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
      res.clearCookie("km_refresh"); res.clearCookie("km_remember");
      return res.status(401).json({ error: "invalid_token" });
    }
    const result = await rotateSession(prisma, payload);
    if (!result.ok) {
      res.clearCookie("km_refresh"); res.clearCookie("km_remember");
      return res.status(401).json({ error: "invalid_token" });
    }
    // A token sent in the body comes from a device that chose to stay signed in.
    const viaBody = typeof req.body?.refreshToken === "string";
    setRefreshCookie(res, result.refreshToken, viaBody || rememberFromCookie(req));
    res.status(200).json({ accessToken: result.accessToken, ...(viaBody || rememberFromCookie(req) ? { refreshToken: result.refreshToken } : {}) });
  } catch (error) {
    // Unexpected Prisma/transaction/Argon2/system failures must reach the
    // centralized error handler (next) rather than becoming unhandled rejections.
    next(error);
  }
});

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    // _count.plates: the web shows the one-time plate question only while the
    // user has no saved plate and never answered it (profile.plateSetup).
    select: { id: true, username: true, email: true, emailVerifiedAt: true, healthConsentAt: true, locale: true, profile: true, entitlements: true, _count: { select: { plates: true } } }
  });
  res.json({ user: user && { ...user, emailVerified: !!user.emailVerifiedAt, healthConsent: !!user.healthConsentAt, isAdmin: isAdminUser(user, adminEmails) } });
});

// Explicit consent to health data for accounts created before the sign-up box (2026-10-28).
app.post("/me/health-consent", requireAuth, async (req, res, next) => {
  try {
    if (req.body?.consent !== true) return res.status(400).json({ error: "health_consent_required" });
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { healthConsentAt: new Date() }, select: { healthConsentAt: true } });
    res.json({ healthConsent: true, at: user.healthConsentAt });
  } catch (error) {
    next(error);
  }
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

// One search field (roadmap G1 + E4): barcode, ingredient, own recipe and
// reference dish in one list. Typing is AI-free; "meaning=1" (sent once
// after a lexical miss) adds a search-intent retry, budgeted per user.
const meaningSearchLimiter = new DynamicFoodResolutionRateLimiter(Date.now, { windowMs: 15 * 60 * 1000, limit: 30 });
app.get("/search", requireAuth, async (req, res, next) => {
  try {
    const { q, meaning } = z.object({ q: z.string().max(200).default(""), meaning: z.enum(["0", "1"]).default("0") }).parse(req.query);
    res.json(await timeStage("unified_search", () => unifiedSearch(prisma, q, meaning === "1", {
      userId: req.user!.id, foodLocale: foodLocaleFor(trustedLocale(req.user!)), searchIntentProvider, meaningLimiter: meaningSearchLimiter
    })));
  } catch (error) {
    next(error);
  }
});

// Part P (2026-09-16): correcting a PRIVATE Food's own macros by hand — see
// catalog/edit-private-food.ts for the ownership/editability enforcement.
app.patch("/foods/:foodId", requireAuth, async (req, res, next) => {
  try {
    const input = editPrivateFoodSchema.parse(req.body);
    const food = await editPrivateFood(prisma, req.user!.id, req.params.foodId, input);
    res.json({ food });
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

// Voice food entry (2026-09-23): produces TEXT ONLY, fed by the client into
// the exact same POST /meal-input/interpret text pipeline as typed input —
// this endpoint has no concept of food identity/nutrition and never writes
// anything. Bounded (short conservative size limit, own rate limiter,
// bounded upstream timeout inside transcriptionProvider itself) since a real
// external cost is incurred per call. Raw audio bytes are parsed by a
// route-scoped express.raw (the app-wide express.json() above only ever
// parses application/json and leaves a non-matching Content-Type
// untouched) and are held in memory only for the duration of this one
// request — never persisted to disk or the database, never logged.
const VOICE_MAX_AUDIO_BYTES = 5 * 1024 * 1024; // ~a few minutes of compressed speech; food entry, not dictation
const VOICE_ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/m4a", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"];
app.post(
  "/meal-input/transcribe",
  requireAuth,
  voiceTranscribeLimiter,
  express.raw({ type: VOICE_ALLOWED_AUDIO_TYPES, limit: VOICE_MAX_AUDIO_BYTES }),
  async (req, res, next) => {
    try {
      const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
      if (!Buffer.isBuffer(req.body) || !contentType || !VOICE_ALLOWED_AUDIO_TYPES.includes(contentType)) {
        return res.status(415).json({ error: "unsupported_audio_format" });
      }
      if (!req.body.byteLength) return res.status(400).json({ error: "empty_audio" });
      // The client sends the page's current UI language; only a supported
      // locale is accepted, otherwise the profile locale is used.
      const requestedLang = typeof req.query.lang === "string" && (locales as readonly string[]).includes(req.query.lang) ? req.query.lang as Locale : undefined;
      const result = await transcriptionProvider.transcribe({ audio: req.body, mimeType: contentType, language: requestedLang ?? trustedLocale(req.user!) });
      res.json({ text: result.text, language: result.language ?? null });
    } catch (error) {
      if (error instanceof TranscriptionProviderError) {
        const status = error.code === "timeout" ? 504 : error.code === "empty_audio" ? 400 : error.code === "response_too_large" ? 502 : 502;
        return res.status(status).json({ error: `transcription_${error.code}` });
      }
      next(error);
    }
  }
);
// A route-scoped handler for express.raw's own payload-too-large rejection
// (thrown before the route handler above ever runs) — kept as a normal JSON
// error response rather than Express's default HTML error page.
app.use(platesRouter(prisma, requireAuth));
// In-app bug reports: one searchable `user_feedback` log line each — see feedback/feedback.ts.
app.use(feedbackRouter(requireAuth, console.log, async (record) => {
  notifyOwner({
    event: "feedback", label: "Visszajelzés", on: true,
    title: record.kind === "idea" ? "Új ötlet" : "Új hibajelentés",
    message: [record.view ? `nézet: ${record.view}` : null, `#${record.id} – a szöveg az admin felületen`].filter(Boolean).join("\n"),
    tags: [record.kind === "idea" ? "bulb" : "bug"], click: webAppUrl
  });
  return prisma.feedback.create({ data: {
    id: record.id, userId: record.userId, kind: record.kind, message: record.message, view: record.view, lang: record.lang, build: record.build,
    lastInput: record.lastInput, operationId: record.operationId, clientTime: record.clientTime
  } });
}));
app.use("/meal-input/transcribe", (error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "audio_too_large" });
  next(error);
});

// Owner-beta (2026-09-12): a truthful, real-stage progress stream for the UI
// during long interpretation operations — see meal-input/progress-bus.ts.
// operationId is client-generated and validated by mealInterpretationSchema;
// this endpoint is purely additive and never required — a client that never
// opens it loses nothing but the progress display. Category-only stage
// names only, never user text, prompts, or provider identity.
app.get("/meal-input/progress/:operationId", requireAuth, (req, res) => {
  const operationId = req.params.operationId;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(operationId)) return res.status(400).end();
  res.writeHead(200, {
    "content-type": "application/x-ndjson; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    "x-accel-buffering": "no"
  });
  const unsubscribe = subscribeProgress(operationId, (stage) => {
    res.write(`${JSON.stringify({ stage })}\n`);
  });
  req.on("close", unsubscribe);
});

// "Próbáld ki regisztráció nélkül" (tier decision 2026-10-15): no account,
// nothing stored, nothing tied to anyone. Local catalog and reference dishes
// only (no external lookups); AI interpretation shares one small global
// anonymous budget, and each visitor is rate limited by IP.
const publicTryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.header("cf-connecting-ip") ?? req.ip ?? "unknown"
});
const anonymousAiLimiter = new FoodNlpUserRateLimiter();
const publicTrySchema = z.object({ text: z.string().trim().min(2).max(200), lang: z.enum(["hu", "de", "en"]).default("hu") });
app.post("/public/try", publicTryLimiter, async (req, res, next) => {
  try {
    const input = publicTrySchema.parse(req.body);
    notifyOwner({ event: "public_try", label: "Kipróbálás regisztráció nélkül", on: false, message: `Nyelv: ${input.lang}`, ip: visitorIp(req.header("cf-connecting-ip"), req.ip) });
    // Like the signed-in flow: the interpreter first; a reference dish only
    // when it could not resolve the phrase ("2 pár virsli" is 4 frankfurters,
    // not 4 portions of "virsli mustárral").
    const anonAi = rateLimitedFoodNlpProvider(foodNlpProvider, anonymousAiLimiter, "anonymous");
    const anonQuantity = { get id() { return quantityProvider.id; }, estimate: (estimateInput: Parameters<typeof quantityProvider.estimate>[0]) => quantityProvider.estimate(estimateInput, undefined, () => anonymousAiLimiter.consume("anonymous")) };
    const result = await interpretMealInput(prisma, input.text, anonQuantity, anonAi, null);
    const foods = tryFromInterpretation(result, input.lang);
    const resolved = (result.items ?? [result]).every((row) => row.foodResolution === "resolved" && row.selectedFood);
    if (!resolved) {
      const dish = await tryReferenceDish(prisma, input.text, input.lang);
      if (dish) return res.json(dish);
      return res.json(await fillUnclearWithReferenceDishes(prisma, foods, input.lang));
    }
    res.json(foods);
  } catch (error) {
    next(error);
  }
});

// "2 pár virsli" (owner tickets c289ec, 5d5e3f): when the user picks another
// candidate in the preview, the stated amount is converted for THAT food the
// same way the interpreter does (its own serving, the typical unit weight,
// then the AI estimate) instead of asking for grams.
const candidateQuantitySchema = z.object({
  foodId: z.string().min(1).max(100),
  parsed: z.object({ quantity: z.number().positive().max(10000), quantityUpper: z.number().positive().max(10000).optional(), unit: z.string().min(1).max(30), size: z.enum(["small", "medium", "large"]).optional(), foodQuery: z.string().max(200), preparation: z.string().max(60).optional() })
});
app.post("/meal-input/quantity", requireAuth, async (req, res, next) => {
  try {
    const input = candidateQuantitySchema.parse(req.body);
    const food = await prisma.food.findFirst({ where: { id: input.foodId, OR: [{ createdById: null }, { createdById: req.user!.id }] }, include: { servings: true } });
    if (!food) return res.status(404).json({ error: "food_not_found" });
    const requestQuantityProvider = { get id() { return quantityProvider.id; }, estimate: (estimateInput: Parameters<typeof quantityProvider.estimate>[0]) => quantityProvider.estimate(estimateInput, undefined, () => foodNlpLimiter.consume(req.user!.id)) };
    const quantity = await resolveQuantity(input.parsed as any, food as any, requestQuantityProvider);
    res.json({ quantity });
  } catch (error) {
    next(error);
  }
});

app.post("/meal-input/interpret", requireAuth, async (req, res, next) => {
  const requestStartedAt = performance.now();
  let operationId: string | undefined;
  try {
    const input = mealInterpretationSchema.parse(req.body);
    operationId = input.operationId;
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
      ? { prisma, searchIntentProvider, semanticRecoveryProvider, adapters: externalFoodAdapters, rateLimiter: dynamicFoodResolutionLimiter, userId: req.user!.id, locale: trustedLocale(req.user!), localizationProvider: candidateLocalizationProvider, semanticCandidateGateProvider, recipeSemanticGateProvider, webEvidenceFallback, aiEstimation, fallbackCaches: sharedFallbackResultCaches }
      : null;
    // Same deps, but with recipeIngredientDynamicResolutionLimiter in place
    // of dynamicFoodResolutionLimiter — see that limiter's own comment.
    const recipeIngredientDynamic = dynamic ? { ...dynamic, rateLimiter: recipeIngredientDynamicResolutionLimiter } : null;
    const onProgress = (stage: Parameters<typeof publishProgress>[1]) => publishProgress(input.operationId, stage);
    const result = await interpretMealInput(prisma, input.text, requestQuantityProvider, requestProvider, dynamic, onProgress);
    // Fallback layered on top of interpretation, never inside it — only ever
    // reached when interpretMealInput's own local/structured/AI-assisted
    // resolution has already genuinely failed on a composite-dish phrase. A
    // no-op (webKnowledgeSearchProvider.id === "disabled") when
    // WEB_SEARCH_PROVIDER is unset, at zero extra cost.
    // Owner-beta (2026-09-13): `dynamic` (the same authoritative USDA/BLS
    // resolution deps used for ordinary meal-input items) is passed through
    // here too — proven by live reproduction to be required for discovered
    // recipes' own ingredients to reach trusted Food identities at all: a
    // real 7-ingredient recipe (halászlé) resolved 0/7 without it, since
    // per-ingredient resolution otherwise has only the sparse local catalog
    // to match against. Still `null` whenever no external adapters are
    // configured, matching ordinary meal-input's own behavior exactly.
    const withDiscovery = await timeStage("recipe_discovery_fallback", () => attachRecipeDiscoveryFallback(result, { discoveryService: recipeDiscoveryService, recipeAiProvider: recipeDiscoveryAiProvider, prisma, userId: req.user!.id, locale: trustedLocale(req.user!), onProgress, dynamic: recipeIngredientDynamic, recipeIngredientNormalizationProvider, recipeQuantityEstimationProvider }));
    onProgress("finalizing");
    // Owner-beta diagnostics checkpoint (2026-09-13): derived entirely from
    // the already-computed, already-response-bound result above — see
    // diagnostics.ts. Never a second AI/network call, never data the client
    // couldn't already see elsewhere in this same JSON body.
    const diagnosticsStartedAt = performance.now();
    const diagnostics = buildDiagnostics(withDiscovery, trustedLocale(req.user!));
    console.log(`timing_stage stage=build_diagnostics ms=${Math.round(performance.now() - diagnosticsStartedAt)}`);
    res.json({ ...withDiscovery, diagnostics });
    console.log(`timing_stage stage=REQUEST_TOTAL ms=${Math.round(performance.now() - requestStartedAt)}`);
  } catch (error) {
    next(error);
  } finally {
    closeProgress(operationId);
  }
});

app.put("/me/onboarding", requireAuth, adminOnly, async (req, res, next) => {
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
// Rugalmas célok (premium, in beta for everyone): per-weekday overrides of
// the daily targets; an empty object goes back to the same goal every day.
app.put("/me/weekday-goals", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { entitlements: true } });
    if (!hasPremiumFeature(user?.entitlements ?? [], "flexible_goals", getSettings().premiumAccess)) return res.status(403).json({ error: "premium_required" });
    const weekdayGoals = weekdayGoalsSchema.parse(req.body?.weekdayGoals ?? {});
    const empty = Object.values(weekdayGoals).every((day) => !day || Object.keys(day).length === 0);
    const profile = await prisma.profile.update({ where: { userId: req.user!.id }, data: { weekdayGoals: empty ? Prisma.DbNull : weekdayGoals } });
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

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

app.post("/meals", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const input = createMealSchema.parse(req.body);
    // Same recipe-ingredient dynamic deps as recipe-discovery-fallback's own
    // wiring above (recipeIngredientDynamicResolutionLimiter, not the
    // ordinary per-meal limiter) — a confirmed recipe-discovery item re-runs
    // the same server-side ingredient resolution a fresh discovery preview
    // would. `undefined` (not an error) when no external adapters are
    // configured; createMeal only needs this when the request actually
    // contains a recipe-discovery item, at which point its own explicit
    // recipe_discovery_unavailable check fires instead of resolving anything.
    const recipeDynamic = externalFoodAdapters.length
      ? { prisma, searchIntentProvider, semanticRecoveryProvider, adapters: externalFoodAdapters, rateLimiter: recipeIngredientDynamicResolutionLimiter, userId: req.user!.id, locale: trustedLocale(req.user!), localizationProvider: candidateLocalizationProvider, semanticCandidateGateProvider, recipeSemanticGateProvider, webEvidenceFallback, aiEstimation, fallbackCaches: sharedFallbackResultCaches }
      : null;
    const meal = await createMeal(prisma, req.user!.id, input, { recipeAiProvider: recipeDiscoveryAiProvider, dynamic: recipeDynamic, recipeIngredientNormalizationProvider, recipeQuantityEstimationProvider });
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

// Vacsoraajánló (premium, in beta for everyone until payment exists): what
// to eat for dinner so the selected day stays inside the user's targets.
// Same ?date/?tzOffsetMinutes convention as /meals/today. Registered before
// /meals/:mealId.
// "Nézz be a hűtőbe" (owner idea 02261c): the items the dinner ideas can be ticked with.
app.get("/meals/fridge-items", requireAuth, (req, res) => {
  const lang = (["hu", "de", "en"].includes(String(req.query.lang)) ? req.query.lang : "hu") as "hu" | "de" | "en";
  res.json({ items: fridgeItems.map((item) => ({ key: item.key, label: item[lang] })) });
});
app.get("/meals/dinner-suggestions", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { locale: true, profile: true, entitlements: true } });
    if (!hasPremiumFeature(user?.entitlements ?? [], DINNER_FEATURE, getSettings().premiumAccess)) return res.status(403).json({ error: "premium_required" });
    const range = resolveDiaryDateRange({
      date: typeof req.query.date === "string" ? req.query.date : undefined,
      tzOffsetMinutes: typeof req.query.tzOffsetMinutes === "string" ? req.query.tzOffsetMinutes : undefined
    });
    const [day, candidates] = await Promise.all([getMealsForDay(prisma, req.user!.id, range, "detailed"), loadDinnerCandidates(prisma, req.user!.id)]);
    const profile = user?.profile;
    const dayGoals = effectiveGoals(profile, range.date);
    const goal = { kcal: dayGoals.dailyKcal, protein: dayGoals.dailyProtein, netCarbs: dayGoals.dailyNetCarbs, fat: dayGoals.dailyFat };
    const lang = (["hu", "de", "en"].includes(String(req.query.lang)) ? req.query.lang : user?.locale ?? "hu") as "hu" | "de" | "en";
    const dishOf = new Map(candidates.map((c) => [c.recipeId, c.dishId]));
    const weekAgo = new Date(range.start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentItems = await prisma.mealItem.findMany({ where: { recipeId: { not: null }, meal: { userId: req.user!.id, eatenAt: { gte: weekAgo, lt: range.start } } }, select: { recipeId: true }, take: 300 });
    const recentDishIds = new Set(recentItems.map((item) => dishOf.get(item.recipeId!)).filter((id): id is string => !!id));
    const result = rankDinnerSuggestions({
      candidates,
      recentDishIds,
      recentlySuggested: recentlyShown(req.user!.id),
      // ?shown=<recipeId,...>: what "Újraszámolás" already showed in this session.
      exclude: new Set(String(req.query.shown ?? "").split(",").filter(Boolean).slice(0, 200).map((id) => dishOf.get(id) ?? id)),
      // ?have=egg,ham,...: "Nézz be a hűtőbe", what the user has at home.
      have: fridgeKeys(req.query.have),
      remaining: { kcal: goal.kcal - day.totals.kcal, protein: goal.protein - day.totals.protein, netCarbs: goal.netCarbs - day.totals.netCarbs, fat: goal.fat - day.totals.fat },
      avoid: [...(profile?.avoidedFoods ?? []), ...(profile?.allergies ?? [])],
      eatenRecipeIds: new Set(day.meals.flatMap((meal: any) => meal.items.map((item: any) => item.recipeId).filter(Boolean))),
      eatenTitles: new Set(day.meals.flatMap((meal: any) => [meal.title, ...meal.items.map((item: any) => item.displayName)]).filter(Boolean).map((title: string) => normalizeSearch(title))),
      lang,
      todayMeals: day.meals.map((meal: any) => ({ id: meal.id, title: meal.title, mealType: meal.mealType ?? null, mealTypeLabel: meal.mealTypeLabel ?? null, totals: meal.totals }))
    });
    rememberShown(req.user!.id, result.suggestions.map((s) => dishOf.get(s.recipeId) ?? s.recipeId));
    logger.info({ status: result.status, count: result.suggestions.length, leftovers: result.leftovers.length, candidates: candidates.length }, "dinner_suggestions");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Heti étrendtervező (premium, in beta for everyone until payment exists).
app.use(mealPlanRouter({ prisma, requireAuth, adminOnly, log: (obj, msg) => logger.info(obj, msg) }));
// Haladó statisztika és testsúlynapló (premium, in beta for everyone).
app.use(progressRouter({ prisma, requireAuth, adminOnly }));
// Emlékeztetők (premium, in beta for everyone): e-mail at the user's times.
app.use(remindersRouter({ prisma, requireAuth, adminOnly }));

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
app.patch("/meals/:mealId", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const input = editMealSchema.parse(req.body);
    const meal = await editMeal(prisma, req.user!.id, req.params.mealId, input);
    res.json({ meal });
  } catch (error) {
    next(error);
  }
});

app.delete("/meals/:mealId", requireAuth, adminOnly, async (req, res, next) => {
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
app.post("/meals/:mealId/repeat", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const type = repeatMealSchema.parse(req.body ?? {});
    const meal = await repeatMeal(prisma, req.user!.id, req.params.mealId, new Date(), type);
    res.status(201).json({ meal });
  } catch (error) {
    next(error);
  }
});

app.use("/recipes", (req, res, next) => (req.method === "GET" ? next() : requireAuth(req, res, () => adminOnly(req, res, next))), recipeRouter);

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error?.name === "ZodError") return res.status(400).json({ error: "validation_error", issues: error.issues });
  if (error?.status && error?.publicCode) return res.status(error.status).json({ error: error.publicCode });
  logger.error(error);
  res.status(500).json({ error: "internal_error" });
});

// Admin settings (registration, announcement, AI limits) before serving; a
// failed read keeps the defaults rather than blocking the start.
loadSettings(prisma).catch((error) => logger.warn({ err: error?.message }, "admin settings not loaded, using defaults"));
startUsageFlusher(prisma);
startPremiumUsersRefresher(prisma);
if (env.NODE_ENV === "production") startKeepAwake(keepAwakeUrls(env.KEEP_AWAKE_URLS));
// Owner notifications: every event type is switchable before it first happens.
registerWithHub();
// Missing hu/de/en food names, filled once per start in the background (catalog/backfill-food-names.ts).
if (env.NODE_ENV === "production") setTimeout(() => { backfillFoodNames({ prisma, provider: candidateLocalizationProvider, pauseMs: 300, log: (line) => logger.info(line) }).catch((error) => logger.warn(`food_names_backfill error=${error?.message ?? error}`)); }, 60_000).unref();
if (env.NODE_ENV === "production") startReminders({ prisma, mailer, webAppUrl, admins: adminEmails, log: (line) => logger.info(line) });
app.listen(env.PORT, () => logger.info({ port: env.PORT }, "Keto Mentor API listening"));
