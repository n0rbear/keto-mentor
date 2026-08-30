import { normalizeSearch } from "../catalog/normalize.js";
import { EUROPEAN_ESSENTIALS, type EssentialSource } from "./european-essentials-manifest.js";

export type EverydayLocale = "hu" | "de" | "en";
export type EverydayCoverageSource = EssentialSource | "usda_foundation";
export type LocalizedAliases = Record<EverydayLocale, readonly string[]>;

export type EverydayCoverageEntry = {
  key: string;
  category: string;
  source: EverydayCoverageSource;
  sourceId: string;
  expectedNameTokens: readonly string[];
  aliases: LocalizedAliases;
  reusesEuropeanEssential: boolean;
};

const words = (hu: string[], de: string[], en: string[]): LocalizedAliases => ({ hu, de, en });

function reuse(key: string, category: string, aliases: LocalizedAliases): EverydayCoverageEntry {
  const existing = EUROPEAN_ESSENTIALS.find((entry) => entry.key === key);
  if (!existing) throw new Error(`European essential not found for Everyday Coverage v2: ${key}`);
  return {
    key,
    category,
    source: existing.source,
    sourceId: existing.sourceId,
    expectedNameTokens: existing.expectedNameTokens,
    aliases,
    reusesEuropeanEssential: true
  };
}

const add = (
  key: string,
  category: string,
  source: EverydayCoverageSource,
  sourceId: string,
  expectedNameTokens: string[],
  aliases: LocalizedAliases
): EverydayCoverageEntry => ({ key, category, source, sourceId, expectedNameTokens, aliases, reusesEuropeanEssential: false });

// This is an alias-and-identity increment beyond EUROPEAN_ESSENTIALS. Reused
// identities intentionally update the same (source, sourceId); new identities
// are exact publisher records. No name-based or cross-source merge is allowed.
export const EVERYDAY_COVERAGE_V2: readonly EverydayCoverageEntry[] = [
  reuse("chicken-breast", "meat", words(["csirkemell"], ["Hähnchenbrust"], ["chicken breast"])),
  add("chicken-thigh", "meat", "bls", "V4A5100", ["hahnchen", "oberschenkel", "roh"], words(["csirke felsőcomb", "csirkefelsőcomb"], ["Hähnchenoberschenkel"], ["chicken thigh"])),
  add("chicken-leg", "meat", "bls", "V4B5100", ["hahnchen", "unterschenkel", "roh"], words(["csirke alsócomb", "csirkecomb"], ["Hähnchenunterschenkel", "Hähnchenkeule"], ["chicken drumstick", "chicken leg"])),
  add("whole-chicken", "meat", "bls", "V414100", ["hahnchen", "ganz", "roh"], words(["egész csirke"], ["ganzes Hähnchen"], ["whole chicken"])),
  reuse("turkey-breast", "meat", words(["pulykamell"], ["Putenbrust"], ["turkey breast"])),
  add("pork-loin", "meat", "bls", "U611100", ["schwein", "filet", "lende", "roh"], words(["sertésszűz", "sertéskaraj"], ["Schweinelende", "Schweinefilet"], ["pork loin", "pork tenderloin"])),
  add("pork-shoulder", "meat", "usda_sr_legacy", "167843", ["pork", "fresh", "shoulder", "whole", "raw"], words(["sertéslapocka"], ["Schweineschulter"], ["pork shoulder"])),
  add("pork-belly", "meat", "bls", "U642100", ["schwein", "bauch", "roh"], words(["sertéshas", "császárhús"], ["Schweinebauch"], ["pork belly"])),
  add("ground-pork", "meat", "bls", "U020100", ["schwein", "hackfleisch", "roh"], words(["darált sertéshús", "daralt serteshus"], ["Schweinehackfleisch"], ["ground pork", "minced pork"])),
  reuse("ground-beef", "meat", words(["darált marhahús", "daralt marhahus"], ["Rinderhackfleisch"], ["ground beef", "minced beef"])),
  add("beef-steak", "meat", "bls", "U131100", ["rind", "steak", "roh"], words(["marhasteak", "marha steak"], ["Rindersteak"], ["beef steak"])),
  add("beef-roast", "meat", "bls", "U171100", ["rind", "bratenfleisch", "bug", "roh"], words(["marhasült hús", "marhasult hus"], ["Rinderbraten", "Rinderbratenfleisch"], ["beef roast", "roast beef"])),
  add("veal", "meat", "bls", "U401000", ["kalb", "muskelfleisch", "roh"], words(["borjúhús", "borjuhus"], ["Kalbfleisch"], ["veal"])),
  add("lamb", "meat", "bls", "U807000", ["lamm", "muskelfleisch", "roh"], words(["bárányhús", "baranyhus"], ["Lammfleisch"], ["lamb"])),
  reuse("bacon", "meat", words(["bacon", "szalonna"], ["Frühstücksspeck"], ["bacon"])),
  add("ham", "meat", "bls", "W424000", ["schwein", "kochschinken", "kochpokelware"], words(["főtt sonka", "sonka"], ["Kochschinken"], ["cooked ham", "ham"])),

  reuse("salmon", "fish", words(["lazac"], ["Lachs"], ["salmon"])),
  reuse("tuna", "fish", words(["tonhal"], ["Thunfisch"], ["tuna"])),
  reuse("cod", "fish", words(["tőkehal", "tokehal"], ["Kabeljau", "Dorsch"], ["cod"])),
  reuse("trout", "fish", words(["pisztráng", "pisztrang"], ["Forelle"], ["trout"])),
  reuse("mackerel", "fish", words(["makréla", "makrela"], ["Makrele"], ["mackerel"])),
  reuse("sardine", "fish", words(["szardínia", "szardinia"], ["Sardine"], ["sardine"])),
  reuse("shrimp", "fish", words(["garnéla", "garnela", "rák"], ["Garnele"], ["shrimp", "prawn"])),
  reuse("mussel", "fish", words(["kagyló", "kagylo"], ["Miesmuschel"], ["mussel"])),

  reuse("egg", "dairy", words(["tojás", "tojas"], ["Hühnerei", "Ei"], ["egg"])),
  reuse("cream", "dairy", words(["tejszín", "tejszin"], ["Schlagsahne"], ["cream", "whipping cream"])),
  reuse("sour-cream", "dairy", words(["tejföl", "tejfol"], ["Saure Sahne", "Sauerrahm"], ["sour cream"])),
  add("greek-yogurt", "dairy", "usda_sr_legacy", "171304", ["yogurt", "greek", "plain", "whole", "milk"], words(["görög joghurt", "gorog joghurt"], ["griechischer Joghurt"], ["Greek yogurt", "plain Greek yogurt"])),
  reuse("yogurt", "dairy", words(["natúr joghurt", "natur joghurt"], ["Naturjoghurt"], ["natural yogurt", "plain yogurt"])),
  reuse("cottage-cheese", "dairy", words(["szemcsés túró", "szemcses turo", "cottage cheese"], ["Hüttenkäse", "Körniger Frischkäse"], ["cottage cheese"])),
  reuse("quark", "dairy", words(["túró", "turo", "sovány túró"], ["Quark", "Magerquark"], ["quark"])),
  reuse("mozzarella", "dairy", words(["mozzarella"], ["Mozzarella"], ["mozzarella"])),
  reuse("feta", "dairy", words(["feta", "feta sajt"], ["Feta"], ["feta", "feta cheese"])),
  reuse("parmesan", "dairy", words(["parmezán", "parmezan"], ["Parmesan"], ["parmesan"])),
  reuse("emmental", "dairy", words(["ementáli", "ementali"], ["Emmentaler"], ["emmental"])),
  add("edam", "dairy", "bls", "M401600", ["edamer", "45", "fett"], words(["edami sajt", "edami"], ["Edamer"], ["edam", "edam cheese"])),
  reuse("gouda", "dairy", words(["gouda", "gouda sajt"], ["Gouda"], ["gouda", "gouda cheese"])),
  add("cheddar", "dairy", "bls", "M303600", ["chester", "cheddar", "45", "fett"], words(["cheddar", "cheddar sajt"], ["Cheddar", "Chester"], ["cheddar", "cheddar cheese"])),
  reuse("butter", "dairy", words(["vaj"], ["Butter", "Süßrahmbutter"], ["butter"])),
  add("mascarpone", "dairy", "bls", "M7A6800", ["mascarpone", "80", "fett"], words(["mascarpone"], ["Mascarpone"], ["mascarpone"])),

  reuse("broccoli", "vegetable", words(["brokkoli"], ["Brokkoli"], ["broccoli"])),
  reuse("cauliflower", "vegetable", words(["karfiol"], ["Blumenkohl"], ["cauliflower"])),
  reuse("brussels-sprouts", "vegetable", words(["kelbimbó", "kelbimbo"], ["Rosenkohl"], ["Brussels sprouts"])),
  reuse("white-cabbage", "vegetable", words(["fejes káposzta", "fejes kaposzta", "káposzta"], ["Weißkohl"], ["white cabbage", "cabbage"])),
  reuse("red-cabbage", "vegetable", words(["vörös káposzta", "voros kaposzta", "lila káposzta"], ["Rotkohl"], ["red cabbage"])),
  reuse("sauerkraut", "vegetable", words(["savanyú káposzta", "savanyu kaposzta"], ["Sauerkraut"], ["sauerkraut"])),
  reuse("spinach", "vegetable", words(["spenót", "spenot"], ["Spinat"], ["spinach"])),
  reuse("lettuce", "vegetable", words(["fejes saláta", "fejes salata", "saláta"], ["Kopfsalat"], ["lettuce"])),
  reuse("cucumber", "vegetable", words(["uborka", "kígyóuborka", "kigyouborka"], ["Gurke", "Salatgurke"], ["cucumber"])),
  reuse("zucchini", "vegetable", words(["cukkini"], ["Zucchini"], ["zucchini", "courgette"])),
  reuse("aubergine", "vegetable", words(["padlizsán", "padlizsan"], ["Aubergine"], ["eggplant", "aubergine"])),
  reuse("tomato", "vegetable", words(["paradicsom"], ["Tomate"], ["tomato"])),
  reuse("green-pepper", "vegetable", words(["paprika", "zöldpaprika", "zoldpaprika"], ["Grüne Paprika"], ["bell pepper", "green pepper"])),
  reuse("onion", "vegetable", words(["vöröshagyma", "voroshagyma", "hagyma"], ["Zwiebel", "Speisezwiebel"], ["onion"])),
  add("red-onion", "vegetable", "usda_foundation", "790577", ["onions", "red", "raw"], words(["lilahagyma", "lila hagyma"], ["Rote Zwiebel"], ["red onion"])),
  reuse("garlic", "vegetable", words(["fokhagyma"], ["Knoblauch"], ["garlic"])),
  reuse("leek", "vegetable", words(["póréhagyma", "porehagyma"], ["Lauch", "Porree"], ["leek"])),
  add("celery", "vegetable", "bls", "G220100", ["bleichsellerie", "roh"], words(["szárzeller", "szarzeller"], ["Bleichsellerie", "Staudensellerie"], ["celery", "celery stalk"])),
  reuse("celeriac", "vegetable", words(["zellergumó", "zellergumo"], ["Knollensellerie"], ["celery root", "celeriac"])),
  reuse("radish", "vegetable", words(["retek", "hónapos retek", "honapos retek"], ["Radieschen"], ["radish"])),
  reuse("mushroom", "vegetable", words(["gomba", "csiperkegomba"], ["Champignon"], ["mushroom"])),
  reuse("asparagus", "vegetable", words(["spárga", "sparga"], ["Spargel"], ["asparagus"])),
  reuse("green-beans", "vegetable", words(["zöldbab", "zoldbab"], ["Grüne Bohne"], ["green beans"])),
  reuse("green-peas", "vegetable", words(["zöldborsó", "zoldborso"], ["Grüne Erbse"], ["peas", "green peas"])),
  reuse("carrot", "vegetable", words(["sárgarépa", "sargarepa", "répa"], ["Karotte", "Möhre"], ["carrot"])),
  add("beetroot", "vegetable", "bls", "G613100", ["rote", "bete", "roh"], words(["cékla", "cekla"], ["Rote Bete", "Rote Rübe"], ["beetroot", "beet"])),
  reuse("pumpkin", "vegetable", words(["sütőtök", "sutotok"], ["Hokkaidokürbis", "Kürbis"], ["pumpkin"])),

  reuse("avocado", "fruit", words(["avokádó", "avokado"], ["Avocado"], ["avocado"])),
  reuse("lemon", "fruit", words(["citrom"], ["Zitrone"], ["lemon"])),
  reuse("lime", "fruit", words(["lime", "zöldcitrom"], ["Limette"], ["lime"])),
  reuse("strawberry", "fruit", words(["eper", "szamóca", "szamoca"], ["Erdbeere"], ["strawberry"])),
  reuse("raspberry", "fruit", words(["málna", "malna"], ["Himbeere"], ["raspberry"])),
  reuse("blueberry", "fruit", words(["áfonya", "afonya"], ["Heidelbeere"], ["blueberry"])),
  reuse("blackberry", "fruit", words(["szeder"], ["Brombeere"], ["blackberry"])),
  reuse("apple", "fruit", words(["alma"], ["Apfel"], ["apple"])),
  reuse("pear", "fruit", words(["körte", "korte"], ["Birne"], ["pear"])),
  reuse("peach", "fruit", words(["őszibarack", "oszibarack"], ["Pfirsich"], ["peach"])),
  reuse("plum", "fruit", words(["szilva"], ["Pflaume"], ["plum"])),
  reuse("sweet-cherry", "fruit", words(["cseresznye"], ["Süßkirsche"], ["cherry", "sweet cherry"])),
  reuse("orange", "fruit", words(["narancs"], ["Orange"], ["orange"])),
  reuse("banana", "fruit", words(["banán", "banan"], ["Banane"], ["banana"])),

  reuse("walnut", "nuts", words(["dió", "dio"], ["Walnuss"], ["walnut"])),
  reuse("almond", "nuts", words(["mandula"], ["Mandel"], ["almond"])),
  reuse("hazelnut", "nuts", words(["mogyoró", "mogyoro"], ["Haselnuss"], ["hazelnut"])),
  reuse("peanut", "nuts", words(["földimogyoró", "foldimogyoro"], ["Erdnuss"], ["peanut"])),
  reuse("pistachio", "nuts", words(["pisztácia", "pisztacia"], ["Pistazie"], ["pistachio"])),
  reuse("cashew", "nuts", words(["kesudió", "kesudio"], ["Cashewkern"], ["cashew"])),
  reuse("sunflower-seed", "nuts", words(["napraforgómag", "napraforgomag"], ["Sonnenblumenkerne"], ["sunflower seed"])),
  reuse("pumpkin-seed", "nuts", words(["tökmag", "tokmag"], ["Kürbiskerne"], ["pumpkin seed"])),
  reuse("chia", "nuts", words(["chiamag", "chia mag"], ["Chiasamen"], ["chia", "chia seed"])),
  reuse("flaxseed", "nuts", words(["lenmag"], ["Leinsamen"], ["flaxseed", "linseed"])),
  add("sesame", "nuts", "bls", "H420100", ["sesam"], words(["szezámmag", "szezammag"], ["Sesam"], ["sesame", "sesame seed"])),

  reuse("olive-oil", "fats", words(["olívaolaj", "olivaolaj"], ["Olivenöl"], ["olive oil"])),
  add("sunflower-oil", "fats", "bls", "Q320000", ["sonnenblumenol"], words(["napraforgóolaj", "napraforgoolaj"], ["Sonnenblumenöl"], ["sunflower oil"])),
  reuse("coconut-oil", "fats", words(["kókuszolaj", "kokuszolaj"], ["Kokosöl"], ["coconut oil"])),
  reuse("lard", "fats", words(["sertészsír", "serteszzsir", "zsír"], ["Schweineschmalz"], ["lard"])),
  add("mayonnaise", "fats", "bls", "Q991000", ["mayonnaise", "fertigprodukt"], words(["majonéz", "majonez"], ["Mayonnaise"], ["mayonnaise", "mayo"])),
  add("mustard", "fats", "bls", "R132000", ["senf", "mittelscharf"], words(["mustár", "mustar"], ["Senf"], ["mustard"])),
  add("vinegar", "fats", "bls", "R121000", ["weinessig"], words(["ecet", "borecet"], ["Weinessig", "Essig"], ["vinegar", "wine vinegar"])),

  reuse("potato", "carbs", words(["burgonya", "krumpli"], ["Kartoffel"], ["potato"])),
  reuse("rice", "carbs", words(["rizs"], ["Reis"], ["rice"])),
  reuse("pasta", "carbs", words(["tészta", "teszta"], ["Nudeln"], ["pasta"])),
  reuse("wholegrain-bread", "carbs", words(["teljes kiőrlésű kenyér", "teljes kiorlesu kenyer"], ["Vollkornbrot"], ["wholegrain bread", "whole wheat bread"])),
  reuse("oats", "carbs", words(["zabpehely"], ["Haferflocken"], ["oats", "oatmeal"])),
  reuse("wheat-flour", "carbs", words(["búzaliszt", "buzaliszt", "liszt"], ["Weizenmehl"], ["wheat flour"])),
  add("sugar", "carbs", "bls", "S111000", ["zucker", "weiss"], words(["cukor", "fehér cukor"], ["Zucker", "Weißzucker"], ["sugar", "white sugar"]))
] as const;

export type EverydaySearchCase = {
  query: string;
  locale: EverydayLocale;
  expectedConcept: string;
  expectedSource?: "bls" | "usda_fdc";
  expectedSourceId?: string;
  acceptedIdentities?: readonly string[];
  expectedAmbiguous?: boolean;
};

const corpus: EverydaySearchCase[] = [];
const acceptedIdentityByConcept: Readonly<Record<string, readonly string[]>> = {
  egg: ["open_database:171287"],
  avocado: ["open_database:171705"],
  "chicken-breast": ["open_database:172395"],
  butter: ["open_database:173430"],
  cheddar: ["open_database:173414"],
  gouda: ["open_database:171241"],
  spinach: ["open_database:168462"],
  cucumber: ["open_database:168409"]
};
const accentlessBudget = 26;
let accentlessAdded = 0;
for (const [index, entry] of EVERYDAY_COVERAGE_V2.entries()) {
  const source = entry.source === "bls" ? "bls" : "usda_fdc";
  const acceptedIdentities = acceptedIdentityByConcept[entry.key];
  corpus.push({ query: entry.aliases.hu[0], locale: "hu", expectedConcept: entry.key, expectedSource: source, expectedSourceId: entry.sourceId, acceptedIdentities });
  const secondary: EverydayLocale = index % 2 === 0 ? "de" : "en";
  corpus.push({ query: entry.aliases[secondary][0], locale: secondary, expectedConcept: entry.key, expectedSource: source, expectedSourceId: entry.sourceId, acceptedIdentities });
  const accentless = normalizeSearch(entry.aliases.hu[0]);
  if (accentlessAdded < accentlessBudget && accentless !== entry.aliases.hu[0].toLocaleLowerCase("hu")) {
    corpus.push({ query: accentless, locale: "hu", expectedConcept: entry.key, expectedSource: source, expectedSourceId: entry.sourceId, acceptedIdentities });
    accentlessAdded++;
  }
}

corpus.push(
  { query: "weisskohl", locale: "de", expectedConcept: "white-cabbage", expectedSource: "bls", expectedSourceId: "G342100" },
  { query: "susskirsche", locale: "de", expectedConcept: "sweet-cherry", expectedSource: "bls", expectedSourceId: "F211100" },
  { query: "sajt", locale: "hu", expectedConcept: "generic-cheese", expectedAmbiguous: true },
  { query: "Käse", locale: "de", expectedConcept: "generic-cheese", expectedAmbiguous: true },
  { query: "fish", locale: "en", expectedConcept: "generic-fish", expectedAmbiguous: true },
  { query: "bread", locale: "en", expectedConcept: "generic-bread", expectedAmbiguous: true }
);

export const EVERYDAY_SEARCH_CORPUS: readonly EverydaySearchCase[] = corpus;
