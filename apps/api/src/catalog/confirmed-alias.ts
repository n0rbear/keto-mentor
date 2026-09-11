import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import type { FoodLocale } from "./food-locale.js";

type ConfirmedAliasPrisma = Pick<PrismaClient, "foodAlias">;

/**
 * Owner-beta blocker #8 (2026-09-11): the STRONGEST identity evidence this
 * system has — a server-offered candidate the user explicitly picked, which
 * the server then independently refetched and validated server-side (see
 * confirmAuthoritativeFood, unchanged). Unlike learnSearchAlias's
 * "dynamic_search" aliases (an AI's own unverified search-intent guess,
 * gated on hasSemanticCoverage precisely because it is NOT reliable
 * evidence), a human explicitly confirming one of a bounded, pre-vetted,
 * relevance-filtered candidate set IS reliable evidence — this function
 * deliberately does NOT re-run hasSemanticCoverage, since the confirmation
 * itself is the trust boundary.
 *
 * Only ever call this AFTER confirmAuthoritativeFood has returned
 * "confirmed" or "existing" (a real, server-verified Food row) — never on
 * failure, and never with anything the client merely claims about identity.
 *
 * Tagged "confirmed_external" (kind) so food-search.ts's scoring treats it
 * at full trust (the "dynamic_search" special-case in scoreFood does not
 * apply to any other kind string) — this is exactly what makes a future
 * same-locale lookup resolve LOCALLY, at zero USDA/Groq cost (see
 * food-search.ts: isTrustedLocalMatch requires stage "exact"/"alias" +
 * score >= 95, which an exact-matching non-dynamic_search alias reaches).
 *
 * LOCALE-SCOPED, not language-scoped: confirming "Erdapfel" in de-AT never
 * creates or touches a de-DE row — the composite unique key is
 * [foodId, normalizedAlias, locale], and `locale` here is always the
 * confirming user's own specific FoodLocale (e.g. "de-AT"), never a bare
 * language. The SAME authoritative Food may separately and independently
 * gain confirmed aliases in as many locales as are genuinely confirmed —
 * this never auto-propagates one locale's confirmation to another.
 */
export async function learnConfirmedAlias(
  prisma: ConfirmedAliasPrisma,
  input: {
    foodId: string;
    // The PARSED food identity only (e.g. "burgonya") — never the raw
    // ingredient text with quantity/unit/preparation noise ("4 közepes db
    // Burgonya"). Quantity/unit are never identity and must never be learned.
    parsedFoodQuery: string;
    foodLocale: FoodLocale;
    provenance: { sourceUrl?: string; ingredientIndex?: number; source: string; sourceId: string };
  }
): Promise<void> {
  const normalizedAlias = normalizeSearch(input.parsedFoodQuery);
  if (!normalizedAlias || normalizedAlias.length < 2) return;
  try {
    await prisma.foodAlias.upsert({
      where: { foodId_normalizedAlias_locale: { foodId: input.foodId, normalizedAlias, locale: input.foodLocale } },
      update: {},
      create: {
        foodId: input.foodId, alias: input.parsedFoodQuery.trim(), normalizedAlias, locale: input.foodLocale,
        kind: "confirmed_external", confidence: 1,
        provenance: { method: "confirmed_external", learnedAt: new Date().toISOString(), ...input.provenance }
      }
    });
  } catch {
    // Alias learning is a best-effort convenience layered on top of an
    // already-successful confirmation — a failure here must never affect
    // (or be reported as part of) the confirmation result itself.
  }
}
