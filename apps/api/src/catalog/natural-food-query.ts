import { normalizeSearch } from "./normalize.js";

export type NaturalQuantityUnit = "g" | "kg" | "piece" | "slice" | "portion" | "tbsp" | "tsp" | "handful" | "cm" | "bite" | "splash";

export type ParsedNaturalFoodQuery = {
  quantity?: number;
  unit?: NaturalQuantityUnit;
  size?: "small" | "medium" | "large";
  foodQuery: string;
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
  ["egy", 1], ["ket", 2], ["ketto", 2], ["harom", 3], ["negy", 4], ["ot", 5], ["fel", 0.5],
  ["ein", 1], ["eine", 1], ["zwei", 2], ["drei", 3], ["vier", 4], ["funf", 5], ["halb", 0.5],
  ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["half", 0.5]
]);

const SIZES = new Map<string, NonNullable<ParsedNaturalFoodQuery["size"]>>([
  ["kis", "small"], ["small", "small"], ["klein", "small"], ["kozepes", "medium"], ["medium", "medium"], ["mittel", "medium"],
  ["nagy", "large"], ["large", "large"], ["gross", "large"]
]);

const FOOD_FORMS: Record<string, string> = { tojast: "tojas", goudat: "gouda" };

function cleanFoodQuery(value: string, unit?: NaturalQuantityUnit) {
  const withoutSpeech = value.replace(/\b(ettem|ettem belole|i ate|gegessen)\b/g, "").trim();
  const withoutContext = unit === "splash" ? withoutSpeech.replace(/\b(a kaveba|in den kaffee|in coffee)\b.*$/, "").trim() : withoutSpeech;
  return withoutContext.split(" ").map((token) => FOOD_FORMS[token] ?? token).join(" ").trim();
}

export function parseNaturalFoodQuery(raw: string): ParsedNaturalFoodQuery {
  const normalized = normalizeSearch(raw);
  const parts = normalized.split(" ");
  if (!parts.length || !parts[0]) return { foodQuery: "" };

  const numeric = Number(parts[0].replace(",", "."));
  const quantity = Number.isFinite(numeric) ? numeric : NUMBERS.get(parts[0]);
  if (quantity == null) return { foodQuery: normalized };

  let cursor = 1;
  let size: ParsedNaturalFoodQuery["size"];
  const firstSize = SIZES.get(parts[cursor]);
  if (firstSize) { size = firstSize; cursor++; }

  let unit = UNITS.get(parts[cursor]);
  if (unit) cursor++;
  else unit = "piece";

  const secondSize = SIZES.get(parts[cursor]);
  if (!size && secondSize) { size = secondSize; cursor++; }

  const foodQuery = cleanFoodQuery(parts.slice(cursor).join(" "), unit);
  if (!foodQuery) return { foodQuery: normalized };
  return { quantity, unit, ...(size ? { size } : {}), foodQuery };
}
