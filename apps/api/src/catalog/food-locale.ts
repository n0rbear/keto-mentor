import type { Locale } from "@keto-mentor/shared";

/**
 * Regional food-vocabulary locale (owner-beta blocker #8, 2026-09-11) —
 * deliberately a SEPARATE, narrower concept from the app-wide `Locale`
 * (hu/de/en, from @keto-mentor/shared) that governs onboarding/UI/session
 * language. `Locale` is unchanged by this file and remains the single
 * trusted source of which LANGUAGE a user reads (see trustedLocale() in
 * server.ts/recipes/router.ts) — this module only adds a REGIONAL layer on
 * top of it for the food-search/localization/alias pipeline specifically,
 * since food vocabulary genuinely differs by region even within one
 * language (de-DE "Kartoffel" vs de-AT "Erdapfel"; en-US "eggplant" vs
 * en-GB "aubergine").
 *
 * Extensible by design: FOOD_LOCALES lists the initially-supported set (used
 * for exhaustive test coverage and prompt guidance), but `isFoodLocale`
 * accepts any well-formed language-REGION tag matching FOOD_LOCALE_PATTERN,
 * not just this list — adding a new supported locale later is a data change
 * (extend FOOD_LOCALES + DEFAULT_FOOD_LOCALE_FOR_LANGUAGE if it becomes a
 * new language's default), never a structural one.
 */
export const FOOD_LOCALES = [
  "hu-HU",
  "de-DE", "de-AT", "de-CH",
  "en-US", "en-GB", "en-IE", "en-CA", "en-AU", "en-NZ"
] as const;

export type FoodLocale = (typeof FOOD_LOCALES)[number];

const FOOD_LOCALE_PATTERN = /^[a-z]{2}-[A-Z]{2}$/;

/** Well-formed language-REGION tag check — intentionally broader than FOOD_LOCALES so a not-yet-listed but validly-shaped locale can still be recognized as "a locale" rather than silently treated as junk; callers needing the fully-supported set should check `FOOD_LOCALES.includes`. */
export function looksLikeFoodLocale(value: unknown): value is string {
  return typeof value === "string" && FOOD_LOCALE_PATTERN.test(value);
}

export function isSupportedFoodLocale(value: unknown): value is FoodLocale {
  return typeof value === "string" && (FOOD_LOCALES as readonly string[]).includes(value);
}

/**
 * The user's persisted `User.locale` (hu/de/en — see trustedLocale()) is
 * still the ONLY currently-trusted per-user signal (per this checkpoint's
 * "reuse the existing User.locale implementation" instruction — onboarding
 * does not yet collect a specific region). This is the safe, explicit
 * default region for each supported language until a finer-grained,
 * independently-trusted per-user region signal exists.
 */
const DEFAULT_FOOD_LOCALE_FOR_LANGUAGE: Record<Locale, FoodLocale> = {
  hu: "hu-HU",
  de: "de-DE",
  en: "en-US"
};

export function foodLocaleFor(language: Locale): FoodLocale {
  return DEFAULT_FOOD_LOCALE_FOR_LANGUAGE[language];
}

/**
 * Safe resolution for a value that MIGHT be a supported food locale (e.g. a
 * future per-user region preference, once one exists) but cannot be assumed
 * to be one. Never silently coerces an unsupported/malformed value to
 * en-US — falls back to the user's own known LANGUAGE default instead, so a
 * not-yet-supported region still gets a linguistically-correct (if less
 * regionally precise) result rather than a silently wrong one.
 */
export function resolveFoodLocale(candidate: unknown, fallbackLanguage: Locale): FoodLocale {
  return isSupportedFoodLocale(candidate) ? candidate : foodLocaleFor(fallbackLanguage);
}

/** The single canonical search representation every USDA lookup targets, regardless of the user's own locale. */
export const CANONICAL_SEARCH_LOCALE: FoodLocale = "en-US";

export function languageOf(foodLocale: FoodLocale): string {
  return foodLocale.split("-")[0];
}
