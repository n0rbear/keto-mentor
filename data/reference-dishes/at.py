"""Austria (AT): reference dishes.

Phase 1 (2026-09-27): format samples. Phase 3 (2026-10-05): the full Austrian
set, one module per group (at_*.py), loaded through PHASE3_MODULES below the
same way hu.py loads its phase-2 modules. INVENTORY lists Austrian dishes that
could not be built (no catalog record for an essential ingredient), with the
reason.
"""
from common import ing, src

SIDE_WITH = {}

R = "2026-09-27"

PARTS = {
    "schweinsbraten": dict(
        names={"hu": "Sült sertéslapocka (Schweinsbraten)", "de": "Schweinebraten", "de-AT": "Schweinsbraten", "en": "Roast pork shoulder"},
        matrix="solid", servings_source=4, standard_serving_g=250,
        ingredients=[ing("pork_shoulder", 1250, note="Schweinsschulter mit Schwarte; the catalog record is shoulder without rind (see review note)"),
                     ing("onion", 160, note="2 onions"), ing("garlic", 12, "seasoning", "3-5 cloves"), ing("caraway_seed", 4, "seasoning", "ground, 1-2 tsp"),
                     ing("lard", 30, "fat"), ing("water", 400, "liquid", "klare Suppe for basting; clear stock carries almost no nutrition, modelled as water")],
        cooking=dict(method="roasted ~2-2.5 h at 160-180 °C, basted, Saft reduced", mass_change_g=-550,
                     note="roast pork loses ~30% of its weight (~375 g); about half of the basting liquid evaporates (~175 g)"),
        flat_plate=dict(coverage=0.44, height_cm=1.6),
        sources=[src("https://www.gutekueche.at/omas-schweinsbratenrezept-rezept-19875", R, "1.25 kg Schulter, 2 Zwiebeln, 5 Knoblauchzehen, 1 EL Kümmel, 40 g Schmalz, 400 ml Suppe, 4 Portionen"),
                 src("https://www.gutekueche.at/saftiger-schweinsbraten-rezept-14744", R, "1 kg Schulter, 2 Zwiebeln, 2 Knoblauchzehen, 1 TL Kümmel, 1 EL Schmalz, 500 ml Suppe, 6 Portionen")]),
}

DISHES = [
    dict(id="at_schweinsbraten", countries=["AT", "DE"], category="traditional", part_refs=[("schweinsbraten", 250)], served_in="flat_plate",
         side_options=[("semmelknoedel", 200), ("sauerkraut_gedunstet", 150)], alias_side_locale="de-AT",
         alias_side={"schweinsbraten mit knödel": "semmelknoedel", "schweinsbraten mit semmelknödel": "semmelknoedel", "schweinsbraten mit kraut": "sauerkraut_gedunstet", "schweinsbraten mit sauerkraut": "sauerkraut_gedunstet"},
         tags=["traditional", "roast", "low-carb-friendly"],
         aliases={"de-AT": ["schweinsbraten", "schweinsbratl"], "de": ["schweinebraten", "schweinsbraten"], "hu": ["sült sertéslapocka", "sertéssült"], "en": ["roast pork", "pork roast"]},
         # derived_check reference: BLS composite, production catalog read-only 2026-09-27.
         reference_check=dict(catalog="bls:Y352212", name="Schweinebraten ohne Sauce", kcal=264, fat=17.24, protein=27.24, net_carbs=0.0),
         review="Knödel és Sauerkraut köret választható (3. fázis, at_traditionell). A katalógusrekord bőr nélküli lapocka; a Schwarte zsírtöbblete miatt enyhe alulbecslés."),
]

# One Semmel = mean of two declared retail weights.
SERVINGS = [
    dict(food_key="wheat_roll", key="piece_at", unit="piece", countries=["AT"], grams=62.5, is_estimated=False, confidence=0.85,
         labels={"hu": "zsemle", "de": "Brötchen", "de-AT": "Semmel", "en": "bread roll"},
         sources=[src("https://www.spar.at/produktwelt/spar-bio-kaisersemmel-60g-g-p2020001325436", R, "SPAR Natur*pur Bio-Kaisersemmel 60 g"),
                  src("https://shop.billa.at/produkte/ja-natuerlich-kaisersemmel-00480904", R, "Ja! Natürlich Kaisersemmel 65 g Stück")]),
]

# Class-wide weight for foods without their own serving (generic-unit-weights).
UNIT_CLASSES = [
    dict(key="bread_roll_at", unit="piece", grams=62.5, countries=["AT"], whole_word=True,
         keywords=["semmel", "semmeln", "kaisersemmel", "kaisersemmeln"],
         sources=[src("https://www.spar.at/produktwelt/spar-bio-kaisersemmel-60g-g-p2020001325436", R, "60 g"),
                  src("https://shop.billa.at/produkte/ja-natuerlich-kaisersemmel-00480904", R, "65 g")]),
]

# Regional vocabulary (brief table), both directions, on the catalog record.
FOOD_ALIASES = [
    dict(food_key="tomato", aliases={"de-AT": ["Paradeiser"], "de": ["Tomate", "Tomaten"], "hu": ["paradicsom", "pari"], "en": ["tomato"]}),
    dict(food_key="potato", aliases={"de-AT": ["Erdäpfel", "Erdapfel"], "de": ["Kartoffel", "Kartoffeln"], "hu": ["burgonya", "krumpli"], "en": ["potato"]}),
    dict(food_key="frankfurter", aliases={"de-AT": ["Frankfurter"], "de": ["Wiener Würstchen", "Wiener"], "hu": ["virsli"], "en": ["frankfurter"]}),
    dict(food_key="wheat_roll", aliases={"de-AT": ["Semmel", "Kaisersemmel"], "de": ["Brötchen", "Schrippe", "Weck", "Weckle", "Semmel"], "hu": ["zsemle", "zsömle"], "en": ["bread roll"]}),
]

CHAIN_PRODUCTS = [
    dict(id="mcdonalds-at:big-mac", chain="McDonald's", countries=["AT"], category="burger",
         names={"hu": "Big Mac (McDonald's)", "de": "Big Mac (McDonald's)", "de-AT": "Big Mac (McDonald's)", "en": "Big Mac (McDonald's)"},
         aliases={"hu": ["big mac", "bigmac"], "de": ["big mac", "bigmac"], "de-AT": ["big mac"], "en": ["big mac"]},
         # EU label, per 100 g, carbohydrate = AVAILABLE (fiber excluded).
         per_100g=dict(kcal=231, fat=12, protein=11, carbs_available=18, fiber=1.7),
         per_portion=dict(kcal=544, kj=2273, fat=29, protein=27, carbs_available=42, fiber=4),
         per_100g_kj=963,
         # The table gives no portion weight; it is derived from energy per
         # portion / per 100 g, hence estimated.
         serving=dict(key="piece", unit="piece", labels={"hu": "darab", "de": "Stück", "de-AT": "Stück", "en": "piece"}, is_estimated=True, confidence=0.9),
         sources=[src("https://www.mcdonalds.at/produkt/big-mac", R, "Nährwerte Portion und per 100g, McDonald's Österreich")]),
]

MISSING_FOODS = []

# Phase-1 dishes; the phase-3 minimums count the dishes built on top of them.
PHASE1_DISH_IDS = ("at_schweinsbraten", "xx_eierspeis", "xx_leberkaessemmel")

# Austrian dishes that stay out until their essential ingredient has a
# catalog record (name -> reason), like körömpörkölt in hu.py.
INVENTORY = {"traditional": [], "everyday": [], "street_food": []}
INVENTORY_REASONS = {}

PHASE3_MODULES = ("at_traditionell", "at_knoedel_nudeln", "at_suppen", "at_mehlspeisen")
for _name in PHASE3_MODULES:
    _m = __import__(_name)
    _clash = PARTS.keys() & _m.PARTS.keys()
    if _clash:
        raise SystemExit(f"{_name}: part ids already defined: {sorted(_clash)}")
    PARTS.update(_m.PARTS)
    DISHES += _m.DISHES
    SERVINGS += getattr(_m, "SERVINGS", [])
    FOOD_ALIASES += getattr(_m, "FOOD_ALIASES", [])
    MISSING_FOODS += getattr(_m, "MISSING", [])
    SIDE_WITH.update(getattr(_m, "SIDE_WITH", {}))
    for _c, _names in getattr(_m, "INVENTORY", {}).items():
        INVENTORY[_c] += _names
    INVENTORY_REASONS.update(getattr(_m, "INVENTORY_REASONS", {}))
