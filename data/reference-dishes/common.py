"""Shared helpers for the hand-written reference-data source files.

The source files (foods.py, hu.py, at.py, de.py, shared.py) hold every
hand-entered number; build.py only derives and emits. Each country module may
define any of:

  PARTS           part id -> cooked component (batch recipe, cooking, density)
  DISHES          what users say: parts, countries, category, aliases per language
  SIDE_WITH       side part id -> "with <side>" per language (dish titles)
  SERVINGS        FoodServing rows (unit weights) tied to one catalog record
  UNIT_CLASSES    generic unit weights for a whole class of foods
  FOOD_ALIASES    FoodAlias rows (regional vocabulary) tied to one catalog record
  CHAIN_PRODUCTS  chain_official Food records (official per-country tables)
  MISSING_FOODS   foods a dish needs that have no reviewed catalog record yet
"""
from __future__ import annotations

COUNTRIES = ("HU", "AT", "DE")
CATEGORIES = ("traditional", "everyday", "street_food", "chain")
# BCP 47 language tags; "de-AT" is Austrian German (Paradeiser, Semmel, Häferl).
LANGUAGES = ("hu", "de", "de-AT", "en")


def ing(key, g, role="core", note=None):
    d = {"food_key": key, "raw_g": g, "role": role}
    if note:
        d["note"] = note
    return d


def src(url, retrieved, note=None):
    """One cited source: URL plus the date it was read (YYYY-MM-DD)."""
    d = {"url": url, "retrieved": retrieved}
    if note:
        d["note"] = note
    return d


def srcs(retrieved, urls):
    return [src(u, retrieved) for u in urls]


# Household measures used by Hungarian recipe sites, in grams, for turning a
# cited recipe ("2 ek liszt", "1 db vöröshagyma") into raw batch grams.
# Volumes use the food's own density (1 dl = 100 ml x density); pieces are
# ordinary medium retail sizes. These are estimates of the recipe's amounts,
# never nutrition; every use keeps the source wording in the ingredient note.
MEASURE_G = {
    "ek_flour": 10, "ek_paprika": 7, "ek_oil": 13, "ek_lard": 13, "ek_sugar": 12, "ek_tomato_paste": 17,
    "ek_vinegar": 15, "ek_sour_cream": 17, "ek_dried_herb": 2, "tk_spice": 2.5, "mk_spice": 1,
    "dl_oil": 92, "dl_sour_cream": 102, "dl_milk": 103, "dl_cream": 100, "dl_water": 100, "dl_wine": 99,
    "db_onion": 100, "gerezd_garlic": 5, "db_green_pepper": 60, "db_tomato": 100, "db_potato": 150,
    "db_carrot": 80, "db_parsley_root": 70, "db_egg": 50, "db_lemon_juice": 45, "fej_kohlrabi": 250,
}


def g(n, measure):
    """Grams for n household units, e.g. g(2, "ek_flour") -> 20."""
    return round(n * MEASURE_G[measure], 1)

# Plate model (owner decision 2026-09-26: no photo, no scale).
#   Deep plate / bowl: grams = capacity_ml x fill x density.
#   Flat plate: grams = usable_area x coverage x height x fill x density,
#     usable area = circle of 0.8 x diameter (the rim carries no food).
DEEP_FILL = {"felig": 0.5, "normal": 0.75, "tele": 0.9}
FLAT_FILL = {"keves": 0.7, "normal": 1.0, "pupozott": 1.35}
USABLE_DIAMETER_RATIO = 0.8
