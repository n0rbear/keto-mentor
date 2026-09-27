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

# Plate model (owner decision 2026-09-26: no photo, no scale).
#   Deep plate / bowl: grams = capacity_ml x fill x density.
#   Flat plate: grams = usable_area x coverage x height x fill x density,
#     usable area = circle of 0.8 x diameter (the rim carries no food).
DEEP_FILL = {"felig": 0.5, "normal": 0.75, "tele": 0.9}
FLAT_FILL = {"keves": 0.7, "normal": 1.0, "pupozott": 1.35}
USABLE_DIAMETER_RATIO = 0.8
