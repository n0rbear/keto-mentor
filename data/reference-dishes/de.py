"""Germany (DE): reference dishes.

Phase 1 (2026-09-27): format samples. Phase 4 (2026-10-11): the full German
set, one module per group (de_*.py), loaded through PHASE4_MODULES below the
same way at.py loads its phase-3 modules. Dishes eaten the same way in Austria
or Hungary are not copied: the existing AT/HU dish gains DE (see README).
INVENTORY lists German dishes that could not be built (no catalog record for
an essential ingredient), with the reason.
"""
from common import ing, src

SIDE_WITH = {}

R = "2026-09-27"

PARTS = {
    "bratkartoffeln": dict(
        names={"hu": "Pirított burgonya szalonnával és hagymával", "de": "Bratkartoffeln mit Speck und Zwiebeln", "de-AT": "Geröstete Erdäpfel mit Speck", "en": "German fried potatoes with bacon and onion"},
        matrix="dry", bulk_density_g_ml=0.65, servings_source=2, standard_serving_g=250,
        ingredients=[ing("potato", 500, note="waxy (festkochend), peeled"), ing("smoked_bacon", 90, note="durchwachsener Speck, 80-100 g"),
                     ing("onion", 80, note="1 onion"), ing("clarified_butter", 10, "fat", "1 EL Butterschmalz")],
        cooking=dict(method="pan-fried in bacon fat and Butterschmalz ~20 min until crisp", mass_change_g=-100,
                     note="frying drives ~15% of the potato and onion water off"),
        flat_plate=dict(coverage=0.45, height_cm=2.5),
        sources=[src("https://www.essen-und-trinken.de/rezepte/55725-rzpt-klassische-bratkartoffeln", R, "500 g Kartoffeln, 80 g Speck, 1 Zwiebel, 1 EL Butterschmalz, 1 EL Butter, 2 Portionen"),
                 src("https://www.gutekueche.de/bratkartoffeln-mit-speck-und-zwiebel-rezept-28363", R, "500 g Kartoffeln, 100 g Speck, 1 Zwiebel, 2 Portionen")]),
}

DISHES = [
    dict(id="de_bratkartoffeln", countries=["DE"], category="traditional", part_refs=[("bratkartoffeln", 250)], served_in="flat_plate",
         tags=["traditional", "fried", "higher-carb"],
         aliases={"de": ["bratkartoffeln", "bratkartoffeln mit speck", "bratkartoffeln mit speck und zwiebeln"], "de-AT": ["geröstete erdäpfel"],
                  "hu": ["pirított burgonya", "pirított krumpli"], "en": ["german fried potatoes", "fried potatoes with bacon"]}),
]

SERVINGS = []
FOOD_ALIASES = []
MISSING_FOODS = []

# Phase-1 dishes carrying DE; the phase-4 minimums count the dishes built on top of them.
PHASE1_DISH_IDS = ("de_bratkartoffeln", "at_schweinsbraten", "xx_eierspeis", "xx_leberkaessemmel")

# German dishes that stay out until their essential ingredient has a catalog
# record (name -> reason), like Burenwurst in at.py.
INVENTORY = {"traditional": [], "everyday": [], "street_food": []}
INVENTORY_REASONS = {}

PHASE4_MODULES = ("de_suppen_eintopf", "de_traditionell", "de_kuchen")
for _name in PHASE4_MODULES:
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
