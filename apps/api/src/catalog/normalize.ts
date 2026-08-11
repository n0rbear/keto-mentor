export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildSearchText(input: {
  name: string;
  originalName?: string | null;
  names?: unknown;
  synonyms?: unknown;
  brand?: string | null;
}) {
  return normalizeSearch([input.name, input.originalName, JSON.stringify(input.names), JSON.stringify(input.synonyms), input.brand].filter(Boolean).join(" "));
}
