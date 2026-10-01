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


# Fat that stays in roasted/fried/grilled meat when the drippings are NOT
# eaten (cooking.drippings = "oven" | "pan" | "grill"). Medians of the BLS 4.0
# raw -> cooked pairs of meat, poultry and sausage records (codes ...100 vs
# ...162 "gebraten ohne Fett (Ofen)", ...182 "(Pfanne)", ...172 "gegrillt"):
# retention = fat_cooked x (protein_raw / protein_cooked) / fat_raw, i.e. the
# same retention factors BLS itself uses (101 / 70 / 47 records). Only fat from
# meat-group ingredients renders out; added oil/lard is handled as uptake.
# Stews, soups, casseroles and dishes served with their pan juices keep the
# fat (no drippings key).
FAT_RETENTION = {"oven": 0.842, "pan": 0.956, "grill": 0.969}

# Pasta boiled in plenty of water and drained: cooked weight / dry weight from
# the BLS 4.0 raw -> "gekocht" pairs (protein ratio): E401000 -> E401032
# Teigwaren eifrei 2.30, E432000 -> E432032 Eierteigwaren 2.54. Pasta cooked
# inside a soup or steamed in its own listed water takes that water from the
# batch, so it adds no mass there.
BOILED_YIELD = {"pasta_durum_dry": 2.30, "egg_pasta_dry": 2.54}


# Breaded, pan/deep-fried cutlets (rántott hús, rántott csirkemell): what
# sticks and what is absorbed, per gram of raw meat, solved from BLS 4.0
# Y332132 Schweineschnitzel paniert, gebraten and Y591112 Hähnchenbrustfilet
# paniert, gebraten (carbohydrate -> flour + crumbs at 1:3, protein -> meat,
# remaining fat -> frying oil): dry coating ~12 % of the meat (flour 3 %,
# crumbs 9 %), oil ~6 % of the finished weight. Egg wash 10 % of the meat is
# an assumption (BLS lists no split).
BREADING = {"flour": 0.03, "crumbs": 0.09, "egg": 0.10, "oil_of_finished": 0.06}


def breaded(meat_key, meat_g, meat_loss_g, oil_key="sunflower_oil"):
    """Ingredients and mass change of a breaded cutlet batch (BREADING rule)."""
    flour, crumbs, egg = (round(meat_g * BREADING[k]) for k in ("flour", "crumbs", "egg"))
    base = meat_g + flour + crumbs + egg - meat_loss_g
    oil = round(BREADING["oil_of_finished"] * base / (1 - BREADING["oil_of_finished"]))
    return [ing(meat_key, meat_g), ing("wheat_flour", flour, "coating", "amount that sticks (common.BREADING)"),
            ing("egg", egg, "coating", "egg wash that sticks (common.BREADING)"), ing("breadcrumbs", crumbs, "coating", "amount that sticks (common.BREADING)"),
            ing(oil_key, oil, "absorbed_fat", "absorbed while frying, 6 % of the finished weight (common.BREADING)")], -meat_loss_g


def boiled_uptake(key, dry_g):
    """Water a drained, boiled pasta takes up (grams), from BOILED_YIELD."""
    return round(dry_g * (BOILED_YIELD[key] - 1))

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
