import { normalizeSearch } from "./normalize.js";

export type NaturalQuantityUnit = "g" | "kg" | "piece" | "slice" | "portion" | "tbsp" | "tsp" | "handful" | "cm" | "bite" | "splash";

export type ParsedNaturalFoodQuery = {
  quantity?: number;
  unit?: NaturalQuantityUnit;
  size?: "small" | "medium" | "large";
  foodQuery: string;
  preparation?: string;
  items?: ParsedNaturalFoodQuery[];
};

const UNITS = new Map<string, NaturalQuantityUnit>([
  ["g", "g"], ["gramm", "g"], ["gram", "g"], ["kg", "kg"], ["kilogramm", "kg"],
  ["db", "piece"], ["darab", "piece"], ["piece", "piece"], ["stuk", "piece"], ["stuck", "piece"],
  ["szelet", "slice"], ["slice", "slice"], ["adag", "portion"], ["portion", "portion"],
  ["ek", "tbsp"], ["evokanal", "tbsp"], ["tbsp", "tbsp"], ["tk", "tsp"], ["teaskanal", "tsp"], ["tsp", "tsp"],
  ["marek", "handful"], ["handful", "handful"], ["handvoll", "handful"], ["cm", "cm"],
  ["harapas", "bite"], ["bite", "bite"], ["bissen", "bite"], ["lottyintes", "splash"], ["splash", "splash"], ["schuss", "splash"]
]);

const NUMBERS = new Map([
  ["egy", 1], ["ket", 2], ["ketto", 2], ["harom", 3], ["negy", 4], ["ot", 5], ["fel", 0.5], ["fele", 0.5],
  ["ein", 1], ["eine", 1], ["zwei", 2], ["drei", 3], ["vier", 4], ["funf", 5], ["halb", 0.5],
  ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["half", 0.5]
]);

const SIZES = new Map<string, NonNullable<ParsedNaturalFoodQuery["size"]>>([
  ["kis", "small"], ["small", "small"], ["klein", "small"], ["kozepes", "medium"], ["medium", "medium"], ["mittel", "medium"],
  ["nagy", "large"], ["large", "large"], ["gross", "large"]
]);

// Preparation is treated as a small CLOSED set of cooking-method CONCEPTS,
// not as a dictionary of food synonyms. This lets "tükörtojás"/"tojásrántotta"/
// "főtt tojás" resolve to base food "tojás" + preparation instead of inventing
// a separate food record for every colloquial phrasing.
const PREPARATION_CONCEPTS: Record<string, string> = {
  rantotta: "scrambled",
  tukor: "fried",
  fott: "boiled",
  sult: "fried",
  pirit: "roasted",
  parolt: "steamed",
  fustolt: "smoked",
  nyers: "raw",
  rakott: "baked",
  bundas: "breaded",
  pörkölt: "roasted",
  scrambled: "scrambled",
  fried: "fried",
  boiled: "boiled",
  grilled: "grilled",
  roasted: "roasted",
  steamed: "steamed",
  smoked: "smoked",
  raw: "raw",
  baked: "baked",
  breaded: "breaded",
  grill: "grilled"
};

// Morphemes that may be attached directly to a base food word (prefix/suffix).
// "grill" is intentionally excluded so multi-word foods like "grillcsirke"
// keep their existing (tested) foodQuery.
const STRIPPABLE_PREP = new Set(Object.keys(PREPARATION_CONCEPTS).filter((key) => key !== "grill"));

// Hungarian case suffixes that may follow a food word, e.g. "tojásból" -> "tojás".
// Single "t" is intentionally excluded: many nominative food words already end in
// "t" (sajt, kenyér), and the accusative is covered by the two-letter "ot/at/et".
const CASE_SUFFIXES = [
  "bol", "ba", "ban", "be", "ben", "val", "vel", "rol", "rol", "rol",
  "nak", "nek", "hoz", "hez", "hoz", "nal", "nel", "tol", "tol", "tol",
  "ig", "kent", "ul", "va", "ve", "ja", "je", "ot", "at", "et"
];

const CONJUNCTIONS = new Set(["es", "and", "und", "meg"]);

const FOOD_FORMS: Record<string, string> = { tojast: "tojas", goudat: "gouda" };

const SPEECH_VERBS = new Set(["ettem", "belole", "ate", "gegessen"]);

function stripCaseSuffix(token: string): string {
  for (const suffix of CASE_SUFFIXES) {
    if (token.length - suffix.length >= 2 && token.endsWith(suffix)) {
      return token.slice(0, token.length - suffix.length);
    }
  }
  return token;
}

// Separate a single food-ish token into its base food and an optional preparation concept.
function extractBaseFood(token: string): { base: string; preparation?: string } {
  let base = token;
  let preparation: string | undefined;

  for (const prep of STRIPPABLE_PREP) {
    if (base.length > prep.length + 1 && base.startsWith(prep)) {
      preparation = PREPARATION_CONCEPTS[prep];
      base = base.slice(prep.length);
      break;
    }
  }
  if (base === token) {
    for (const prep of STRIPPABLE_PREP) {
      if (base.length > prep.length + 1 && base.endsWith(prep)) {
        preparation = PREPARATION_CONCEPTS[prep];
        base = base.slice(0, base.length - prep.length);
        break;
      }
    }
  }
  const stripped = stripCaseSuffix(base);
  if (stripped.length >= 2) base = stripped;
  if (FOOD_FORMS[base]) base = FOOD_FORMS[base];
  return { base, preparation };
}

function parseSegment(normalized: string): ParsedNaturalFoodQuery {
  const tokens = normalized.split(" ").filter(Boolean).filter((token) => !SPEECH_VERBS.has(token));

  let quantity: number | undefined;
  let quantityIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const numeric = Number(tokens[i].replace(",", "."));
    if (Number.isFinite(numeric) && tokens[i].trim() !== "") { quantity = numeric; quantityIndex = i; break; }
    if (NUMBERS.has(tokens[i])) { quantity = NUMBERS.get(tokens[i]); quantityIndex = i; break; }
  }

  const rest = quantityIndex >= 0 ? tokens.filter((_, i) => i !== quantityIndex) : tokens;

  let size: ParsedNaturalFoodQuery["size"];
  let restAfterSize = rest;
  if (rest.length) {
    const firstSize = SIZES.get(rest[0]);
    if (firstSize) { size = firstSize; restAfterSize = rest.slice(1); }
  }

  let unit: NaturalQuantityUnit = "piece";
  let restAfterUnit = restAfterSize;
  if (restAfterSize.length) {
    const u = UNITS.get(restAfterSize[0]);
    if (u) { unit = u; restAfterUnit = restAfterSize.slice(1); }
  }

  let foodText = restAfterUnit.join(" ").trim();
  if (unit === "splash") foodText = foodText.replace(/\b(a kaveba|in den kaffee|in coffee)\b.*$/i, "").trim();

  const foodTokens: string[] = [];
  const preparations: string[] = [];
  for (const token of foodText.split(" ").filter(Boolean)) {
    if (PREPARATION_CONCEPTS[token]) { preparations.push(PREPARATION_CONCEPTS[token]); continue; }
    const { base, preparation } = extractBaseFood(token);
    if (preparation) preparations.push(preparation);
    if (base.length >= 2) foodTokens.push(base);
  }

  const foodQuery = [...new Set(foodTokens)].join(" ").trim() || normalized;
  const preparation = preparations[0];

  const result: ParsedNaturalFoodQuery = { foodQuery };
  if (quantity != null) { result.quantity = quantity; result.unit = unit; }
  if (size) result.size = size;
  if (preparation) result.preparation = preparation;
  return result;
}

export function parseNaturalFoodQuery(raw: string): ParsedNaturalFoodQuery {
  const normalized = normalizeSearch(raw).replace(/\s+/g, " ").trim();
  if (!normalized) return { foodQuery: "" };

  const tokens = normalized.split(" ");
  const conjIndex = tokens.findIndex((t) => CONJUNCTIONS.has(t));
  if (conjIndex >= 0) {
    const left = tokens.slice(0, conjIndex).join(" ");
    const right = tokens.slice(conjIndex + 1).join(" ");
    const items = [parseSegment(left), parseSegment(right)].filter((p) => p.foodQuery);
    if (items.length === 0) return { foodQuery: normalized };
    return { ...items[0], items };
  }

  return parseSegment(normalized);
}