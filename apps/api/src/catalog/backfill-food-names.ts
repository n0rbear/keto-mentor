import { buildSearchText, normalizeSearch } from "./normalize.js";
import type { CandidateLocalizationProvider, LocalizationLocale } from "./candidate-localization.js";

// Missing display names (owner request 2026-10-17): many shared foods only
// had their source-language name — US (USDA) foods showed English on the
// German page, German (BLS) foods had no Hungarian or English name. Once per
// start, in the background, each missing hu/de/en name is filled by the
// existing localization provider (ten names per call, the food's identity is
// given, only a display name comes back). A filled name is never asked for
// again; a failed one is retried on the next start. The name also becomes a
// localized alias and part of the search text, so searching in that
// language finds the food.

export const NAME_TARGETS: Array<{ lang: "hu" | "de" | "en"; locale: LocalizationLocale }> = [
  { lang: "de", locale: "de-DE" },
  { lang: "hu", locale: "hu-HU" },
  { lang: "en", locale: "en-GB" }
];

type FoodRow = { id: string; name: string; originalName: string | null; names: unknown; synonyms: unknown; brand: string | null; category: string | null };
type Db = any;

const namesOf = (food: FoodRow): Record<string, string> => (food.names && typeof food.names === "object" ? { ...(food.names as Record<string, string>) } : {});

/** The name the food is known by in its source: English where there is one, else the original. */
export function authoritativeName(food: FoodRow): string {
  const names = namesOf(food);
  return (names.en || food.originalName || food.name).slice(0, 160);
}

export async function backfillFoodNames(deps: { prisma: Db; provider: CandidateLocalizationProvider; log?: (line: string) => void; batchSize?: number; pauseMs?: number }) {
  const log = deps.log ?? console.log;
  if (deps.provider.id === "disabled") { log("food_names_backfill skipped=no_provider"); return { filled: 0, failed: 0 }; }
  const foods: FoodRow[] = await deps.prisma.food.findMany({
    where: { createdById: null },
    select: { id: true, name: true, originalName: true, names: true, synonyms: true, brand: true, category: true }
  });
  const byId = new Map(foods.map((food) => [food.id, food]));
  let filled = 0, failed = 0;
  for (const { lang, locale } of NAME_TARGETS) {
    const missing = foods.filter((food) => !namesOf(food)[lang]?.trim());
    for (let i = 0; i < missing.length; i += deps.batchSize ?? 10) {
      const batch = missing.slice(i, i + (deps.batchSize ?? 10));
      const localized = await deps.provider.localize(batch.map((food) => ({ id: food.id, authoritativeName: authoritativeName(food), category: food.category ?? undefined })), locale).catch(() => new Map<string, string>());
      for (const food of batch) {
        const name = localized.get(food.id)?.trim();
        if (!name) { failed += 1; continue; }
        const current = byId.get(food.id)!;
        const names = { ...namesOf(current), [lang]: name };
        current.names = names;
        await deps.prisma.food.update({ where: { id: food.id }, data: { names, searchText: buildSearchText({ ...current, names }) } });
        const normalizedAlias = normalizeSearch(name);
        if (normalizedAlias.length >= 2) {
          await deps.prisma.foodAlias.upsert({
            where: { foodId_normalizedAlias_locale: { foodId: food.id, normalizedAlias, locale: lang } },
            update: {},
            create: { foodId: food.id, alias: name, normalizedAlias, locale: lang, kind: "localized_name", confidence: 0.8, provenance: { method: "ai_localization", targetLocale: locale } }
          });
        }
        filled += 1;
      }
      if (deps.pauseMs) await new Promise((resolve) => setTimeout(resolve, deps.pauseMs));
    }
  }
  log(`food_names_backfill filled=${filled} failed=${failed}`);
  return { filled, failed };
}
