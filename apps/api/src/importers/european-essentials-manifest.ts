export type EssentialSource = "bls" | "usda_sr_legacy";

export type EuropeanEssential = {
  key: string;
  label: string;
  source: EssentialSource;
  sourceId: string;
  expectedNameTokens: string[];
  synonyms: string[];
  searchQuery: string;
};

const essential = (
  key: string,
  label: string,
  sourceId: string,
  expectedNameTokens: string[],
  synonyms: string[] = [],
  searchQuery = label,
  source: EssentialSource = "bls"
): EuropeanEssential => ({ key, label, source, sourceId, expectedNameTokens, synonyms, searchQuery });

// Every record is intentionally bound to an audited publisher identity. This is
// a must-have list, not category sampling and not a fuzzy-match instruction.
export const EUROPEAN_ESSENTIALS: readonly EuropeanEssential[] = [
  essential("broccoli", "Brokkoli", "G312100", ["broccoli", "roh"], ["Brokkoli"]),
  essential("cucumber", "Gurke", "G520100", ["gurke", "roh"]),
  essential("garlic", "Knoblauch", "G490100", ["knoblauch", "roh"]),
  essential("cauliflower", "Blumenkohl", "G311100", ["blumenkohl", "roh"]),
  essential("zucchini", "Zucchini", "G582100", ["zucchini", "roh"], [], "zucch"),
  essential("aubergine", "Aubergine", "G510100", ["aubergine", "roh"]),
  essential("tomato", "Tomate", "G561100", ["tomate", "roh"]),
  essential("green-pepper", "Grüne Paprika", "G541100", ["gemusepaprika", "grun", "roh"], ["Grüne Paprika", "Paprika grün"], "grune paprika"),
  essential("red-pepper", "Rote Paprika", "G543100", ["gemusepaprika", "rot", "roh"], ["Rote Paprika", "Paprika rot"]),
  essential("onion", "Zwiebel", "G480100", ["speisezwiebel", "roh"], ["Zwiebel"]),
  essential("spinach", "Spinat", "G211100", ["spinat", "roh"]),
  essential("lettuce", "Kopfsalat", "G105100", ["kopfsalat", "roh"]),
  essential("mushroom", "Champignon", "K701100", ["champignon", "roh"]),
  essential("asparagus", "Spargel", "G450100", ["spargel", "roh"]),
  essential("leek", "Lauch", "G470100", ["porree", "lauch", "roh"], ["Lauch", "Porree"]),
  essential("celeriac", "Knollensellerie", "G660100", ["knollensellerie", "roh"], ["Sellerie"]),
  essential("carrot", "Karotte", "G620100", ["karotte", "mohre", "roh"], ["Karotte", "Möhre"], "mohre"),
  essential("radish", "Radieschen", "G691100", ["radieschen", "roh"]),
  essential("kohlrabi", "Kohlrabi", "G331100", ["kohlrabi", "roh"]),
  essential("brussels-sprouts", "Rosenkohl", "G332100", ["rosenkohl", "roh"]),
  essential("white-cabbage", "Weißkohl", "G342100", ["weisskohl", "roh"], ["Weißkohl", "Weisskohl"], "weisskohl"),
  essential("red-cabbage", "Rotkohl", "G341100", ["rotkohl", "roh"]),
  essential("sauerkraut", "Sauerkraut", "G345100", ["sauerkraut", "abgetropft", "roh"]),
  essential("pumpkin", "Hokkaidokürbis", "G581000", ["kurbis", "hokkaido", "roh"], ["Hokkaidokürbis", "Kürbis"], "kurbis"),
  essential("avocado", "Avocado", "F502100", ["avocado", "roh"]),
  essential("green-peas", "Grüne Erbse", "G760100", ["erbse", "grun", "roh"], ["Grüne Erbse", "Erbse"], "grune erbse"),
  essential("green-beans", "Grüne Bohne", "G710100", ["bohne", "grun", "roh"], ["Grüne Bohne"], "grune bohne"),
  essential("tofu", "Tofu", "H861000", ["tofu"]),

  essential("pear", "Birne", "F130100", ["birne", "roh"]),
  essential("apple", "Apfel", "F110100", ["apfel", "roh"]),
  essential("strawberry", "Erdbeere", "F301100", ["erdbeere", "roh"]),
  essential("raspberry", "Himbeere", "F302100", ["himbeere", "roh"]),
  essential("blueberry", "Heidelbeere", "F304100", ["heidelbeere", "roh"]),
  essential("blackberry", "Brombeere", "F303100", ["brombeere", "roh"]),
  essential("lemon", "Zitrone", "F601100", ["zitrone", "roh"]),
  essential("lime", "Limette", "F602100", ["limette", "roh"]),
  essential("orange", "Orange", "F603100", ["orange", "roh"]),
  essential("grapefruit", "Grapefruit", "F604100", ["grapefruit", "roh"]),
  essential("peach", "Pfirsich", "F203100", ["pfirsich", "roh"]),
  essential("apricot", "Aprikose", "F201100", ["aprikose", "roh"]),
  essential("plum", "Pflaume", "F220100", ["pflaume", "roh"]),
  essential("sweet-cherry", "Süßkirsche", "F211100", ["susskirsche", "roh"], ["Süßkirsche", "Kirsche"], "susskirsche"),
  essential("grape", "Weintraube", "F310100", ["weintraube", "roh"]),
  essential("watermelon", "Wassermelone", "F535100", ["wassermelone", "roh"]),
  essential("banana", "Banane", "F503100", ["banane", "roh"]),

  essential("cod", "Kabeljau", "T204100", ["dorsch", "kabeljau", "roh"], ["Kabeljau", "Dorsch"]),
  essential("tuna", "Thunfisch", "T121100", ["thunfisch", "roh"]),
  essential("egg", "Hühnerei", "E111100", ["huhnerei", "roh"], ["Hühnerei", "Ei"], "huhnerei"),
  essential("salmon", "Lachs", "T410100", ["lachs", "roh"]),
  essential("trout", "Forelle", "T422100", ["forelle", "roh"]),
  essential("mackerel", "Makrele", "T107100", ["makrele", "roh"]),
  essential("sardine", "Sardine", "T105100", ["sardine", "roh"]),
  essential("shrimp", "Garnele", "T753100", ["garnele", "granat", "krabbe", "roh"], ["Garnele", "Krabbe"]),
  essential("mussel", "Miesmuschel", "T792100", ["miesmuschel", "roh"]),
  essential("chicken-breast", "Hähnchenbrust", "V416100", ["hahnchen", "brustfilet", "roh"], ["Hähnchenbrust", "Hähnchen Brust"], "hahnchen"),
  essential("turkey-breast", "Putenbrust", "V486100", ["pute", "brust", "roh"], ["Putenbrust", "Pute Brust"]),
  essential("ground-beef", "Rinderhackfleisch", "U010100", ["rind", "hackfleisch", "roh"], ["Rinderhackfleisch", "Rind Hackfleisch"]),
  essential("beef-tenderloin", "Rinderfilet", "U211100", ["rind", "filet", "lende", "roh"], ["Rinderfilet", "Rind Filet"]),
  essential("pork-chop", "Schweinekotelett", "U622100", ["schwein", "kotelett", "roh"], ["Schweinekotelett"]),
  essential("beef-liver", "Rinderleber", "V531100", ["rind", "leber", "roh"], ["Rinderleber", "Rind Leber"]),
  essential("bacon", "Frühstücksspeck", "W415000", ["schwein", "fruhstucksspeck", "rohpokelware", "gerauchert"], ["Frühstücksspeck", "Speck"], "fruhstucksspeck"),

  essential("whole-milk", "Vollmilch", "M111300", ["vollmilch", "3,5", "pasteurisiert"], ["Vollmilch"]),
  essential("yogurt", "Naturjoghurt", "M141300", ["joghurt", "3,5", "fett"], ["Naturjoghurt", "Joghurt"]),
  essential("quark", "Magerquark", "M713100", ["speisequark", "magerstufe", "magerquark"], ["Magerquark", "Quark"]),
  essential("cottage-cheese", "Hüttenkäse", "M711100", ["korniger", "frischkase"], ["Hüttenkäse", "Körniger Frischkäse"], "huttenkase"),
  essential("cream-cheese", "Frischkäse", "M710800", ["frischkasezubereitung", "natur"], ["Frischkäse"], "frischkase"),
  essential("gouda", "Gouda", "M402600", ["gouda", "48", "fett"], ["Gouda", "Käse"], "kase"),
  essential("emmental", "Emmentaler", "M304600", ["emmentaler", "45", "fett"]),
  essential("mozzarella", "Mozzarella", "M032100", ["mozzarella", "45", "fett"]),
  essential("feta", "Feta", "M012200", ["feta", "45", "fett"]),
  essential("parmesan", "Parmesan", "M306400", ["parmesan", "30", "fett"]),
  essential("butter", "Butter", "Q630000", ["sussrahmbutter"], ["Butter", "Süßrahmbutter"]),
  essential("cream", "Schlagsahne", "M173900", ["schlagsahne", "36", "fett"]),
  essential("sour-cream", "Saure Sahne", "M172500", ["sauerrahm", "saure", "sahne", "10", "fett"], ["Saure Sahne", "Sauerrahm"]),
  essential("olive-oil", "Olivenöl", "Q120000", ["olivenol"], ["Olivenöl"], "olivenol"),
  essential("rapeseed-oil", "Rapsöl", "Q180000", ["rapsol", "rubol"], ["Rapsöl", "Rüböl"], "rapsol"),
  essential("coconut-oil", "Kokosöl", "171412", ["oil", "coconut"], ["Kokosöl", "Coconut oil"], "kokosol", "usda_sr_legacy"),
  essential("lard", "Schweineschmalz", "171401", ["lard"], ["Schweineschmalz", "Schweinefett"], "Schweineschmalz", "usda_sr_legacy"),

  essential("almond", "Mandel", "H210100", ["mandel", "suss"], ["Mandel"]),
  essential("walnut", "Walnuss", "H120100", ["walnuss"]),
  essential("hazelnut", "Haselnuss", "H130100", ["haselnuss"]),
  essential("pecan", "Pekannuss", "H160100", ["pekannuss"]),
  essential("pistachio", "Pistazie", "H250100", ["pistazie"]),
  essential("cashew", "Cashewkern", "H170100", ["cashewkern"]),
  essential("peanut", "Erdnuss", "H110600", ["erdnuss", "gerostet"], ["Erdnuss"]),
  essential("sunflower-seed", "Sonnenblumenkerne", "H430100", ["sonnenblumenkern"], ["Sonnenblumenkerne"]),
  essential("pumpkin-seed", "Kürbiskerne", "H310100", ["kurbiskern"], ["Kürbiskerne"], "kurbiskerne"),
  essential("flaxseed", "Leinsamen", "H410100", ["leinsamen"]),
  essential("chia", "Chiasamen", "H480100", ["chia", "samen"], ["Chiasamen", "Chia-Samen"]),

  essential("potato", "Kartoffel", "K110100", ["kartoffel", "geschalt", "roh"]),
  essential("rice", "Reis", "C352000", ["reis", "poliert", "roh"]),
  essential("oats", "Haferflocken", "C133000", ["hafer", "flocken"], ["Haferflocken"]),
  essential("wheat-flour", "Weizenmehl", "C214100", ["weizen", "mehl", "405"], ["Weizenmehl", "Mehl"]),
  essential("rye-bread", "Roggenbrot", "B221000", ["roggenbrot"]),
  essential("wholegrain-bread", "Vollkornbrot", "B121000", ["roggenvollkornbrot"], ["Vollkornbrot", "Roggenvollkornbrot"]),
  essential("pasta", "Nudeln", "E401000", ["teigwaren", "eifrei", "roh"], ["Nudeln", "Pasta"]),
  essential("lentil", "Linse", "H725100", ["linse", "reif"]),
  essential("chickpea", "Kichererbse", "G770400", ["kichererbse", "reif"]),
  essential("kidney-bean", "Kidneybohne", "H742100", ["kidneybohne", "reif"]),
  essential("tempeh", "Tempeh", "174272", ["tempeh"], ["Tempeh"], "tempeh", "usda_sr_legacy")
] as const;

export const EUROPEAN_ESSENTIAL_MUST_FIND = EUROPEAN_ESSENTIALS.map(({ key, searchQuery }) => ({ key, query: searchQuery }));
