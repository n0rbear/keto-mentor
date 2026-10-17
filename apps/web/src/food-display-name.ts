import type { Lang } from "./i18n";

export type NamedFood = { name: string; originalName?: string; names?: Partial<Record<Lang, string>> | Record<string, string> };

/**
 * Single source of truth for picking a Food's (or external candidate's)
 * display name in the user's UI language — used everywhere a name is shown
 * (search results, meal interpretation preview, external candidate lists,
 * diary, recipe ingredients) so the fallback behavior is identical
 * everywhere rather than accidentally differing screen to screen.
 *
 * Fallback chain: the exact locale's name -> the English name (an honest,
 * safe fallback — never fabricated as if it were a translation) -> the
 * source's original name -> the canonical name field. A food missing a
 * translation for the viewer's language shows its best available name
 * rather than an empty/broken label; it never silently claims an English
 * string is something it isn't.
 */
export function pickDisplayName(food: NamedFood | null | undefined, lang: Lang): string {
  if (!food) return "";
  const names = food.names as Partial<Record<Lang, string>> | undefined;
  return names?.[lang] ?? names?.en ?? food.originalName ?? food.name ?? "";
}

/**
 * A reference dish's title in the viewer's language (owner report
 * 2026-10-17: "virsli mustárral" on a German page). The API sends the
 * dish's titles in every language next to the stored (Hungarian) title.
 */
export function dishTitle(dish: { title: string; titles?: Record<string, string> } | null | undefined, lang: Lang): string {
  if (!dish) return "";
  const titles = dish.titles;
  return titles?.[lang] || (lang === "de" ? titles?.["de-AT"] : undefined) || dish.title;
}
