import { describe, expect, it } from "vitest";
import { CANONICAL_SEARCH_LOCALE, FOOD_LOCALES, foodLocaleFor, isSupportedFoodLocale, languageOf, looksLikeFoodLocale, resolveFoodLocale } from "./food-locale.js";

describe("FOOD_LOCALES: the initially-supported regional locale set", () => {
  it("includes every locale required by owner-beta blocker #8", () => {
    expect(FOOD_LOCALES).toEqual(["hu-HU", "de-DE", "de-AT", "de-CH", "en-US", "en-GB", "en-IE", "en-CA", "en-AU", "en-NZ"]);
  });

  it("distinguishes every regional variant of the same language — none collapse to a bare language code", () => {
    const languages = new Set(FOOD_LOCALES.map(languageOf));
    expect(languages).toEqual(new Set(["hu", "de", "en"]));
    // Three distinct de-* locales, six distinct en-* locales — never merged.
    expect(FOOD_LOCALES.filter((l) => l.startsWith("de-"))).toHaveLength(3);
    expect(FOOD_LOCALES.filter((l) => l.startsWith("en-"))).toHaveLength(6);
  });

  it("CANONICAL_SEARCH_LOCALE is en-US", () => {
    expect(CANONICAL_SEARCH_LOCALE).toBe("en-US");
  });
});

describe("isSupportedFoodLocale / looksLikeFoodLocale: extensibility (not hardcoded around exactly 11 values)", () => {
  it("accepts every currently-supported locale", () => {
    for (const locale of FOOD_LOCALES) expect(isSupportedFoodLocale(locale)).toBe(true);
  });

  it("a well-formed but not-yet-supported locale is recognized as locale-SHAPED without being falsely treated as supported", () => {
    expect(looksLikeFoodLocale("fr-FR")).toBe(true); // well-formed tag, not (yet) in FOOD_LOCALES
    expect(isSupportedFoodLocale("fr-FR")).toBe(false);
  });

  it("rejects malformed/non-locale values", () => {
    expect(looksLikeFoodLocale("de")).toBe(false); // bare language, not a region tag
    expect(looksLikeFoodLocale("DE-de")).toBe(false); // wrong case
    expect(looksLikeFoodLocale("")).toBe(false);
    expect(looksLikeFoodLocale(123)).toBe(false);
    expect(isSupportedFoodLocale(undefined)).toBe(false);
  });
});

describe("foodLocaleFor: the safe default region per known app language", () => {
  it("maps each of the app's three languages to a distinct, sensible default region", () => {
    expect(foodLocaleFor("hu")).toBe("hu-HU");
    expect(foodLocaleFor("de")).toBe("de-DE");
    expect(foodLocaleFor("en")).toBe("en-US");
  });
});

// Test 20 (required): unsupported future locale falls back safely rather
// than silently becoming en-US user-facing output.
describe("resolveFoodLocale: safe fallback for an unsupported/malformed candidate locale", () => {
  it("returns the candidate unchanged when it IS a supported food locale", () => {
    expect(resolveFoodLocale("de-AT", "en")).toBe("de-AT");
  });

  it("falls back to the user's OWN language default — never silently to en-US — for an unsupported or malformed candidate", () => {
    expect(resolveFoodLocale("fr-FR", "hu")).toBe("hu-HU"); // NOT "en-US"
    expect(resolveFoodLocale("fr-FR", "de")).toBe("de-DE"); // NOT "en-US"
    expect(resolveFoodLocale(undefined, "hu")).toBe("hu-HU");
    expect(resolveFoodLocale("not-a-locale-at-all", "de")).toBe("de-DE");
    expect(resolveFoodLocale(42, "en")).toBe("en-US"); // the ONE case where the fallback and en-US coincide, because the fallback language IS en
  });
});
