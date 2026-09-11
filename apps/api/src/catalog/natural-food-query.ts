import { normalizeSearch } from "./normalize.js";

export type NaturalQuantityUnit = "g" | "kg" | "ml" | "l" | "piece" | "slice" | "portion" | "plate" | "bowl" | "ladle" | "tbsp" | "tsp" | "cup" | "handful" | "quarter" | "unknown" | "cm" | "bite" | "splash" | "half";

export type ParsedNaturalFoodQuery = {
  quantity?: number;
  unit?: NaturalQuantityUnit;
  size?: "small" | "medium" | "large";
  vesselShape?: "deep";
  fill?: "heaped";
  foodQuery: string;
  preparation?: string;
  // The retailer/store the food was bought at (e.g. "Lidl"), stripped out of
  // foodQuery so it never pollutes generic-identity search — see the
  // RETAIL_CHAINS comment below. Kept separately (not discarded) since it is
  // real user-stated information a future packaged-product lookup could use;
  // never part of the identity search itself.
  retailChain?: string;
  items?: ParsedNaturalFoodQuery[];
};

const UNITS = new Map<string, NaturalQuantityUnit>([
  ["tanyer", "plate"], ["plate", "plate"], ["plates", "plate"], ["teller", "plate"],
  ["tal", "bowl"], ["bowl", "bowl"], ["bowls", "bowl"], ["schussel", "bowl"],
  ["merokanal", "ladle"], ["ladle", "ladle"], ["ladles", "ladle"], ["kelle", "ladle"], ["kellen", "ladle"],
  ["csesze", "cup"], ["cup", "cup"], ["cups", "cup"], ["tasse", "cup"], ["pohar", "cup"], ["glass", "cup"], ["glas", "cup"],
  // "bögre" (mug/cup) was missing entirely — the unit-detection step only
  // checks the token right after the quantity, so an unrecognized unit word
  // doesn't just fall back to "piece" silently, it also gets swept into the
  // food-query text itself (e.g. "1 bögre mandula" parsed as foodQuery
  // "bogre mandula", unit "piece" — a real owner-beta regression found
  // 2026-09-10: wrong identity search AND the wrong geometry/piece quantity
  // route instead of the volume/container model this unit needs).
  ["bogre", "cup"],
  ["negyed", "quarter"], ["quarter", "quarter"], ["viertel", "quarter"], ["halbes", "half"],
  ["g", "g"], ["gramm", "g"], ["gram", "g"], ["kg", "kg"], ["kilogramm", "kg"],
  // ml/l are volume, not mass — deliberately NOT added to resolveQuantity's
  // g/kg exact-mass fast path. They go through the same trusted-serving ->
  // AI-estimate -> manual-grams chain as "piece"/"cup"/etc., since a
  // universal 1 ml = 1 g assumption would be wrong for most real foods.
  ["ml", "ml"], ["milliliter", "ml"], ["milliliterek", "ml"], ["millilitre", "ml"],
  ["l", "l"], ["liter", "l"], ["liters", "l"], ["litre", "l"], ["litres", "l"],
  ["db", "piece"], ["darab", "piece"], ["piece", "piece"], ["pieces", "piece"], ["stuk", "piece"], ["stuck", "piece"], ["stucke", "piece"],
  ["whole", "piece"], ["egesz", "piece"], ["ganz", "piece"], ["ganze", "piece"], ["ganzen", "piece"],
  ["szelet", "slice"], ["slice", "slice"], ["slices", "slice"], ["scheibe", "slice"], ["scheiben", "slice"], ["adag", "portion"], ["portion", "portion"],
  ["ek", "tbsp"], ["el", "tbsp"], ["evokanal", "tbsp"], ["essloffel", "tbsp"], ["tbsp", "tbsp"], ["tablespoon", "tbsp"], ["tablespoons", "tbsp"],
  ["tk", "tsp"], ["tl", "tsp"], ["teaskanal", "tsp"], ["teeloffel", "tsp"], ["tsp", "tsp"], ["teaspoon", "tsp"], ["teaspoons", "tsp"],
  ["marek", "handful"], ["marok", "handful"], ["handful", "handful"], ["handvoll", "handful"], ["cm", "cm"],
  ["harapas", "bite"], ["bite", "bite"], ["bissen", "bite"], ["lottyintes", "splash"], ["splash", "splash"], ["schuss", "splash"],
  ["fel", "half"], ["fele", "half"], ["half", "half"], ["halb", "half"], ["halbe", "half"]
]);

const NUMBERS = new Map([
  ["egy", 1], ["ket", 2], ["ketto", 2], ["harom", 3], ["negy", 4], ["ot", 5],
  ["ein", 1], ["eine", 1], ["zwei", 2], ["drei", 3], ["vier", 4], ["funf", 5],
  ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["quarter", 0.25], ["threequarters", 0.75]
]);

const HALF_WORDS = new Set(["fel", "fele", "half", "halb", "halbe"]);
const IMPLICIT_ONE_UNIT_WORDS = new Set(["fel", "fele", "half", "halb", "halbe", "halbes", "negyed", "quarter", "viertel", "whole", "egesz", "ganz", "ganze", "ganzen"]);

const SIZES = new Map<string, NonNullable<ParsedNaturalFoodQuery["size"]>>([
  ["kleine", "small"], ["kleines", "small"], ["grosse", "large"], ["grosses", "large"], ["mittlere", "medium"],
  ["kis", "small"], ["small", "small"], ["klein", "small"], ["kozepes", "medium"], ["medium", "medium"], ["mittel", "medium"],
  ["nagy", "large"], ["large", "large"], ["gross", "large"]
]);

// Small closed vessel-shape/fill-level modifier vocabulary for volume-aware
// quantity estimation (a deep bowl or a heaped plate holds meaningfully more
// than a flat/typically-filled one). Deliberately narrow: only the forms the
// estimator can actually use are recognized. "félig tele" (half-full) is NOT
// covered here — "fél"/"felig" already means quantity=0.5 in this parser,
// and overloading it as a fill-level word would collide with that
// established, tested meaning, so it's left as a known gap rather than
// hacked in unsafely.
const VESSEL_SHAPES = new Map<string, NonNullable<ParsedNaturalFoodQuery["vesselShape"]>>([
  ["mely", "deep"], ["deep", "deep"], ["tief", "deep"], ["tiefe", "deep"], ["tiefer", "deep"]
]);
const FILL_LEVELS = new Map<string, NonNullable<ParsedNaturalFoodQuery["fill"]>>([
  ["pupozott", "heaped"], ["pupozva", "heaped"], ["heaped", "heaped"], ["gehauft", "heaped"], ["gehauftem", "heaped"]
]);

// Owner-beta blocker (2026-09-12): a small, closed set of RETAILER/STORE
// names — never a product's own manufacturer brand, never an arbitrary
// adjective. "Lidl Bierwurst" must resolve to the same generic trusted
// "Bierwurst" identity as plain "Bierwurst", since Lidl is where the food
// was bought, not what it fundamentally is; searchFoods (see food-search.ts)
// requires its ENTIRE query string to appear in a Food's searchText, so a
// single unrelated leading token silently prevents any match at all,
// regardless of how well the rest of the phrase matches. This is
// deliberately NOT a general "strip any capitalized/unknown word" rule
// (that would mangle real two-word food names) — recognized retail-chain
// names only, consumed in the same leading-modifier run as size/vessel-
// shape/fill-level, so it can never eat a food word that merely happens to
// follow it mid-phrase. The stripped word is kept on `retailChain`, never
// silently discarded, so a future packaged-product lookup can still use it.
const RETAIL_CHAINS = new Set([
  "lidl", "aldi", "rewe", "spar", "tesco", "penny", "edeka", "kaufland", "netto", "real", "dm", "rossmann",
  "billa", "hofer", "interspar", "metro", "coop", "migros", "denner", "volg", "cba", "auchan", "match", "profi"
]);

// Preparation is treated as a small CLOSED set of cooking-method CONCEPTS,
// not as a dictionary of food synonyms. This lets "tükörtojás"/"tojásrántotta"/
// "főtt tojás" resolve to base food "tojás" + preparation instead of inventing
// a separate food record for every colloquial phrasing.
//
// Deliberately excludes "rakott" and "pörkölt" even though both look like
// ordinary preparation words: in real Hungarian food language they don't
// modify an existing base food the way "sült"/"főtt" do — they NAME a
// distinct composite/layered dish ("rakott krumpli", "rakott karfiol",
// "marha pörkölt", "csirke pörkölt", ...). Stripping either as a plain
// preparation modifier silently collapses that dish's identity down to its
// base ingredient (e.g. "rakott krumpli" -> foodQuery "krumpli" + a
// preparation nothing downstream acts on), matching a generic single-
// ingredient Food that has nothing to do with the actual dish — a real
// owner-beta regression found 2026-09-10. Leaving them unrecognized keeps
// the whole phrase intact as one atomic foodQuery instead, so local search
// correctly misses (rather than confidently matching the wrong thing) and
// the phrase can fall through to AI understanding / safe unresolved
// handling, which is preferable to a false generic-Food match.
const PREPARATION_CONCEPTS: Record<string, string> = {
  rantotta: "scrambled",
  tukor: "fried",
  fott: "boiled",
  sult: "fried",
  pirit: "roasted",
  parolt: "steamed",
  fustolt: "smoked",
  nyers: "raw",
  bundas: "breaded",
  langolt: "grilled",
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

// Real comma/period-separated recipe style like "onion, chopped" describes
// HOW the same ingredient was prepared, not a second food. A segment made
// up entirely of these (plus/instead of a PREPARATION_CONCEPTS word) is
// swallowed into the previous segment instead of becoming a spurious
// standalone "food" search for the descriptor word itself.
const DESCRIPTOR_WORDS = new Set([
  "chopped", "diced", "sliced", "minced", "grated", "crushed", "peeled", "cubed", "shredded",
  "melted", "softened", "drained", "rinsed", "julienned",
  "gehackt", "gewuerfelt", "geschnitten", "gerieben", "geschaelt", "zerkleinert",
  "apritott", "kockazott", "szeletelt", "reszelt", "hamozott"
]);

// spenot ("spenót", spinach): the root itself ends in "-ot", which collides
// with the two-letter accusative case suffix below — without this it would
// be wrongly stripped down to "spen". Mapped to itself, like spinat, to
// bypass stripCaseSuffix entirely rather than special-casing the stripper.
const FOOD_FORMS: Record<string, string> = { tojast: "tojas", goudat: "gouda", spinat: "spinat", spenot: "spenot" };

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
  if (FOOD_FORMS[base]) base = FOOD_FORMS[base];
  else {
    const stripped = stripCaseSuffix(base);
    if (stripped.length >= 2) base = stripped;
  }
  return { base, preparation };
}

function parseSegment(normalized: string): ParsedNaturalFoodQuery {
  const tokens = normalized.replace(/^a(n)?\s+/, "one ").split(" ").filter(Boolean).filter((token) => !SPEECH_VERBS.has(token) && !["a", "an", "of"].includes(token));

  let quantity: number | undefined;
  let quantityIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const numeric = Number(tokens[i].replace("decimal", ".").replace(",", "."));
    if (Number.isFinite(numeric) && tokens[i].trim() !== "") { quantity = numeric; quantityIndex = i; break; }
    if (HALF_WORDS.has(tokens[i])) {
      const followingUnit = UNITS.get(tokens[i + 1] ?? "");
      if (followingUnit && followingUnit !== "half") { quantity = 0.5; quantityIndex = i; break; }
      continue;
    }
    if (tokens[i] === "quarter") continue;
    if (NUMBERS.has(tokens[i])) { quantity = NUMBERS.get(tokens[i]); quantityIndex = i; break; }
  }

  const rest = quantityIndex >= 0 ? tokens.filter((_, i) => i !== quantityIndex) : tokens;

  // A run of leading modifier words (size/vessel-shape/fill-level, in any
  // order, e.g. "nagy mély tányér") is consumed before the unit itself —
  // same slot the pre-existing size-only scan used, just widened to a small
  // closed set of additional physical modifiers instead of size alone.
  let size: ParsedNaturalFoodQuery["size"];
  let vesselShape: ParsedNaturalFoodQuery["vesselShape"];
  let fill: ParsedNaturalFoodQuery["fill"];
  let restAfterSize = rest;
  while (restAfterSize.length) {
    const token = restAfterSize[0];
    if (!size && SIZES.has(token)) { size = SIZES.get(token); restAfterSize = restAfterSize.slice(1); continue; }
    if (!vesselShape && VESSEL_SHAPES.has(token)) { vesselShape = VESSEL_SHAPES.get(token); restAfterSize = restAfterSize.slice(1); continue; }
    if (!fill && FILL_LEVELS.has(token)) { fill = FILL_LEVELS.get(token); restAfterSize = restAfterSize.slice(1); continue; }
    break;
  }

  let unit: NaturalQuantityUnit = "piece";
  let explicitUnitWord: string | undefined;
  let restAfterUnit = restAfterSize;
  if (restAfterSize.length) {
    const u = UNITS.get(restAfterSize[0]);
    if (u) { unit = u; explicitUnitWord = restAfterSize[0]; restAfterUnit = restAfterSize.slice(1); }
  }
  if (quantity == null && explicitUnitWord && IMPLICIT_ONE_UNIT_WORDS.has(explicitUnitWord)) quantity = 1;

  // A run of leading retail-chain tokens (right before the food name itself,
  // e.g. "200 g Lidl Bierwurst") is consumed the same conservative way as
  // size/vessel-shape/fill above — only recognized store names, only when
  // leading, never eating a food word mid-phrase. See RETAIL_CHAINS.
  let retailChain: string | undefined;
  let restAfterRetail = restAfterUnit;
  while (restAfterRetail.length && RETAIL_CHAINS.has(restAfterRetail[0])) {
    retailChain = retailChain ? `${retailChain} ${restAfterRetail[0]}` : restAfterRetail[0];
    restAfterRetail = restAfterRetail.slice(1);
  }
  // A retail-chain word is only ever a MODIFIER on a real food name, never
  // the whole phrase by itself — "Lidl" alone (no food word left) is not a
  // food, so it is left in place rather than stripped down to nothing.
  if (!restAfterRetail.length) { retailChain = undefined; restAfterRetail = restAfterUnit; }

  let foodText = restAfterRetail.join(" ").trim();
  if (unit === "splash") foodText = foodText.replace(/\b(kaveba|in den kaffee|in coffee)\b.*$/i, "").trim();

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
  if (vesselShape) result.vesselShape = vesselShape;
  if (fill) result.fill = fill;
  if (preparation) result.preparation = preparation;
  if (retailChain) result.retailChain = retailChain;
  return result;
}

// Ordinary list/sentence item boundary — a comma, period or semicolon that
// SURVIVED the decimal-protection step above, so it can't be a decimal
// separator (those were already rewritten to "…decimal…" before this runs).
const LIST_SEPARATOR = /[,.;]+/;

function isDescriptorOnlySegment(normalizedSegment: string): boolean {
  const tokens = normalizedSegment.split(" ").filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => DESCRIPTOR_WORDS.has(token) || !!PREPARATION_CONCEPTS[token]);
}

// Splits one already-normalized segment on every conjunction it contains
// ("es"/"and"/"und"/"meg"), not just the first — "sonka és feta és sajt"
// becomes three parts, not two.
function splitOnConjunctions(normalizedSegment: string): string[] {
  const tokens = normalizedSegment.split(" ").filter(Boolean);
  const conjIndex = tokens.findIndex((t) => CONJUNCTIONS.has(t));
  if (conjIndex < 0) return [normalizedSegment];
  const left = tokens.slice(0, conjIndex).join(" ");
  const right = tokens.slice(conjIndex + 1).join(" ");
  return [left, ...splitOnConjunctions(right)].filter((part) => part.trim().length > 0);
}

export function parseNaturalFoodQuery(raw: string): ParsedNaturalFoodQuery {
  // "200g" / "2db" -> "200 g" / "2 db": a quantity glued directly to its
  // unit must still tokenize as quantity + unit, not one unmatched word.
  // Applied before decimal protection so a glued unit after a decimal
  // ("1,5kg") still splits correctly without disturbing the "1,5" itself.
  const spaced = raw.replace(/(\d)([a-zA-Z])/g, "$1 $2");
  const numericSafe = spaced
    .replace(/½/g, " 0decimal5 ")
    .replace(/¼/g, " 0decimal25 ")
    .replace(/¾/g, " 0decimal75 ")
    .replace(/(\d)[.,](\d)/g, "$1decimal$2");

  // Split into ordinary list/sentence items on the punctuation still left
  // after decimal protection — "200 g saláta, 2 főtt tojás" or "saláta.
  // Tojás." are genuine item boundaries. A trailing descriptor-only segment
  // ("chopped", "sülve") is reattached to the previous item's text instead
  // of becoming a spurious standalone food.
  const rawListSegments = numericSafe.split(LIST_SEPARATOR).map((segment) => segment.trim()).filter(Boolean);
  const rawSegments: string[] = [];
  for (const segment of rawListSegments) {
    const preview = normalizeSearch(segment);
    if (rawSegments.length && isDescriptorOnlySegment(preview)) rawSegments[rawSegments.length - 1] += ` ${segment}`;
    else rawSegments.push(segment);
  }

  const normalizedSegments = rawSegments.map((segment) => normalizeSearch(segment).replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!normalizedSegments.length) return { foodQuery: "" };

  const subSegments = normalizedSegments.flatMap((segment) => splitOnConjunctions(segment));
  const items = subSegments.map((segment) => parseSegment(segment)).filter((p) => p.foodQuery);

  if (items.length === 0) return { foodQuery: normalizedSegments.join(" ") };
  if (items.length === 1) return items[0];
  return { ...items[0], items };
}
