#!/usr/bin/env python3
"""Builds the Keto Mentor reference-dish pilot (10 Hungarian dishes).

Every hand-entered number lives in this file; everything else (batch totals,
yield, density, plate-based portion grams, the nutrition cross-check) is
derived here so the data stays internally consistent. Run:

    python3 data/reference-dishes/build.py

Outputs next to this file: hu-pilot.json, hu-pilot-ingredients.csv,
hu-pilot-check.md.
"""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent
SCHEMA_VERSION = "0.2-pilot"

# ---------------------------------------------------------------------------
# 1. Ingredient identity layer (food_key -> one reviewed catalog record).
#
# density_intrinsic: g/ml of the cooked piece itself (used when it sits in a
#   sauce/broth, so there are no air gaps on the plate).
# density_bulk: g/ml of loose cooked pieces (air gaps included); kept per
#   ingredient for future dishes. Dry parts (nokedli, rice, cutlet) carry
#   their own measured-style bulk_density_g_ml instead.
# catalog: production catalog record (source:sourceId), checked read-only on
#   2026-09-26. carb_basis tells how that source reports carbohydrate:
#   "total" (USDA: by difference, fiber included) or "available" (BLS: fiber
#   already excluded). Net carbs = total - fiber, or = available.
# nutrition per 100 g is copied from that record ONLY to cross-check the
#   dishes; it is not the source of truth (the catalog is).
# ---------------------------------------------------------------------------
FOOD_KEYS = {
    # key: (hu, de, en, catalog, carb_basis, kcal, fat, prot, carbs, fiber, d_intr, d_bulk, note)
    "beef_shank":          ("marhalábszár", "Rinderbeinscheibe", "beef shank", "usda_fdc:169441", "total", 128, 3.85, 21.8, 0, 0, 1.06, 0.80, None),
    "pork_shoulder":       ("sertéslapocka", "Schweineschulter", "pork shoulder", "usda_fdc:167843", "total", 236, 17.99, 17.18, 0, 0, 1.06, 0.80, None),
    "pork_loin":           ("sertéskaraj", "Schweinerücken/Kotelett", "pork loin", "bls:U622100", "available", 175, 10.08, 21.02, 0, 0, 1.05, 0.85, None),
    "pork_minced":         ("darált sertéshús", "Schweinehackfleisch", "ground pork", "bls:U020100", "available", 271, 22.14, 17.88, 0, 0, 1.05, 0.80, None),
    "chicken_thigh_skin":  ("csirke felsőcomb bőrrel", "Hähnchenoberschenkel mit Haut", "chicken thigh with skin", "bls:V4A5100", "available", 212, 15.96, 17.17, 0, 0, 1.05, 0.80, "grams = edible part; bone-in purchase weight is ~1.4x"),
    "carp":                ("ponty", "Karpfen", "carp", "bls:T501100", "available", 119, 5.18, 18.0, 0, 0, 1.05, 0.80, "grams = edible part of carp steaks"),
    "frankfurter":         ("virsli", "Wiener Würstchen", "frankfurter / wiener sausage", "bls:W211200", "available", 289, 26.15, 12.9, 0, 0, 1.02, 0.80, "Hungarian 'virsli' = Wiener type; USDA 'Frankfurter, beef' is a worse match"),
    "smoked_sausage":      ("füstölt kolbász", "Räucherwurst (ungarisch)", "smoked pork sausage", "open_database:174584", "total", 309, 28.23, 11.98, 0.94, 0, 1.00, 0.80, "REVIEW: generic 'Pork sausage'; a Hungarian smoked kolbász record would be better"),
    "smoked_bacon":        ("füstölt szalonna / bacon", "Räucherspeck", "smoked bacon", "bls:W415000", "available", 304, 26.22, 16.58, 0.492, 0, 1.00, 0.80, None),
    "lard":                ("sertészsír", "Schweineschmalz", "lard", "usda_fdc:171401", "total", 902, 100, 0, 0, 0, 0.92, 0.92, None),
    "sunflower_oil":       ("napraforgóolaj", "Sonnenblumenöl", "sunflower oil", "bls:Q320000", "available", 900, 100, 0, 0, 0, 0.92, 0.92, None),
    "butter":              ("vaj", "Butter", "butter", "open_database:173430", "total", 717, 81.1, 0.85, 0.06, 0, 0.91, 0.91, None),
    "sour_cream":          ("tejföl (20%)", "Saure Sahne / Schmand", "sour cream", "usda_fdc:2346387", "total", 192.7, 17.99, 3.07, 5.56, 0, 1.02, 1.02, "USDA full-fat sour cream (18% fat) is the closest to Hungarian 20% tejföl"),
    "egg":                 ("tojás", "Hühnerei", "egg", "bls:E111100", "available", 135, 9.0, 13.175, 0.34, 0, 1.03, 1.03, "grams = without shell; 1 medium egg ~50 g"),
    "wheat_flour":         ("búzaliszt (BL55)", "Weizenmehl Type 405/550", "wheat flour", "bls:C214100", "available", 348, 0.93, 10.46, 71.77, 5.3, 1.00, 1.00, None),
    "breadcrumbs":         ("zsemlemorzsa", "Paniermehl", "breadcrumbs", None, None, None, None, None, None, None, 1.00, 1.00, "MISSING in production catalog - import needed (e.g. BLS Paniermehl or USDA 'Bread, crumbs, dry, grated, plain')"),
    "rice_white":          ("rizs (nyers)", "Reis, poliert (roh)", "white rice, raw", "bls:C352000", "available", 351, 0.62, 7.931, 77.1, 2.5, 1.00, 0.80, None),
    "potato":              ("burgonya", "Kartoffel", "potato", "bls:K110100", "available", 83, 0.1, 1.94, 17.9, 1.42, 1.08, 0.70, "grams = peeled"),
    "onion":               ("vöröshagyma", "Zwiebel", "onion", "bls:G480100", "available", 34, 0.15, 1.156, 6.01, 1.4, 1.00, 0.80, None),
    "garlic":              ("fokhagyma", "Knoblauch", "garlic", "bls:G490100", "available", 97, 0.42, 6.05, 3.0, 28.297, 1.00, 1.00, "BLS counts garlic fructans as fiber (3 g available carbs, 28 g fiber); energy is consistent, not a data error"),
    "carrot":              ("sárgarépa", "Möhre/Karotte", "carrot", "bls:G620100", "available", 40, 0.4, 0.84, 6.471, 2.9, 1.03, 0.75, None),
    "parsley_root":        ("petrezselyemgyökér", "Petersilienwurzel", "parsley root", None, None, None, None, None, None, None, 1.03, 0.75, "MISSING in production catalog - import needed (BLS Petersilienwurzel roh). Parsnip is NOT the same food"),
    "celeriac":            ("zellergumó", "Knollensellerie", "celeriac", "bls:G660100", "available", 30, 0.33, 1.55, 2.77, 4.2, 1.03, 0.75, None),
    "kohlrabi":            ("karalábé", "Kohlrabi", "kohlrabi", "bls:G331100", "available", 28, 0.16, 1.94, 3.88, 1.5, 1.03, 0.75, None),
    "tomato":              ("paradicsom", "Tomate", "tomato", "bls:G561100", "available", 22, 0.11, 0.95, 3.25, 1.3, 0.99, 0.99, None),
    "wax_pepper":          ("TV paprika / zöldpaprika", "Spitzpaprika (hellgrün)", "Hungarian wax pepper", "usda_fdc:2747660", "total", 23.94, 0.1314, 0.7231, 4.966, 1.79, 0.98, 0.60, None),
    "hot_pepper_fresh":    ("cseresznyepaprika (erős)", "scharfe Kirschpaprika", "hot cherry pepper", "usda_fdc:2747660", "total", 23.94, 0.1314, 0.7231, 4.966, 1.79, 0.98, 0.60, "mapped to wax pepper (same macros class)"),
    "sauerkraut":          ("savanyú káposzta", "Sauerkraut", "sauerkraut", "bls:G345100", "available", 23, 0.31, 1.125, 0.99, 2.14, 1.02, 0.60, "also used for the rolled leaves (savanyú káposztalevél)"),
    "paprika_ground":      ("őrölt pirospaprika", "Paprikapulver edelsüß", "ground paprika", "usda_fdc:171329", "total", 282, 12.9, 14.1, 54.0, 34.9, 1.00, 1.00, None),
    "caraway_seed":        ("kömény (egész/őrölt)", "Kümmel", "caraway seed", "usda_fdc:170918", "total", 333, 14.59, 19.77, 49.9, 38.0, 1.00, 1.00, "DATA CHECK: catalog Hungarian name is 'Körömfűmag' - should be 'kömény'"),
    "parsley_leaf":        ("petrezselyemzöld", "Petersilie, frisch", "parsley, fresh", "usda_fdc:170416", "total", 36, 0.79, 2.97, 6.33, 3.3, 1.00, 0.30, None),
    "water":               ("víz", "Wasser", "water", "none", "none", 0, 0, 0, 0, 0, 1.00, 1.00, "no nutrition; only mass/volume"),
}

# ---------------------------------------------------------------------------
# 2. Parts (a reusable cooked component; a dish is one or more parts).
#
# matrix: "liquid" (soup/stew/sauce - pieces sit in liquid), "solid" (a cut
#   slice such as rakott krumpli), "dry" (loose pieces: nokedli, rice, cutlet).
# batch.ingredients: RAW grams per whole batch, edible part (no bones/shells),
#   as in the cited source recipe for `batch.servings_source` people.
# not_eaten: things cooked with the batch but not eaten (stock bones) - kept
#   for transparency, excluded from mass and nutrition.
# cooking.mass_change_g: water that leaves (evaporation, frying loss: < 0) or
#   enters (absorbed by nokedli/rice: > 0) during cooking. Finished batch
#   weight = sum(raw ingredients) + mass_change_g.
# standard_serving_g: one normal plate/portion of this part.
# flat_plate: coverage of the plate's usable area and average food height at
#   a "normal" portion (only for parts that are served on flat plates).
# ---------------------------------------------------------------------------
def ing(key, g, role="core", note=None):
    d = {"food_key": key, "raw_g": g, "role": role}
    if note:
        d["note"] = note
    return d


PARTS = {
    "gulyasleves": dict(
        names={"hu": "Gulyásleves", "de": "Gulaschsuppe", "en": "Hungarian goulash soup"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("beef_shank", 600), ing("potato", 600), ing("onion", 250), ing("carrot", 200), ing("parsley_root", 100),
                     ing("wax_pepper", 100), ing("tomato", 100), ing("lard", 30, "fat"), ing("paprika_ground", 10, "seasoning"),
                     ing("garlic", 10, "seasoning"), ing("caraway_seed", 2, "seasoning"), ing("water", 2200, "liquid")],
        cooking=dict(method="simmer ~2 h, partly covered", mass_change_g=-400, note="~18% of the added water evaporates; meat juices stay in the soup"),
        sources=["https://www.mindmegette.hu/recept/hagyomanyos-gulyasleves-a-nagyi-is-igy-csinalta", "https://streetkitchen.hu/receptek/klasszikus-gulyasleves"]),
    "halaszle": dict(
        names={"hu": "Halászlé (passzírozott alappal)", "de": "Ungarische Fischsuppe", "en": "Hungarian fisherman's soup"},
        matrix="liquid", servings_source=4, standard_serving_g=500,
        ingredients=[ing("carp", 800, note="edible part of ~1 kg carp steaks"), ing("onion", 300), ing("wax_pepper", 120), ing("tomato", 150),
                     ing("paprika_ground", 16, "seasoning"), ing("hot_pepper_fresh", 20, "seasoning"), ing("garlic", 10, "seasoning"), ing("water", 3000, "liquid")],
        not_eaten=[{"what": "halfej, farok, szálkás maradék alaplének", "raw_g": 1000, "note": "stock only, strained out; its small protein/fat transfer into the broth is ignored (slight underestimate)"}],
        cooking=dict(method="stock boiled ~1 h, strained with the vegetables; fish boiled 20 min on high heat", mass_change_g=-900, note="hard boil: ~30% of the water evaporates"),
        sources=["https://www.mindmegette.hu/recept/halaszle-eredeti", "https://terebess.hu/tiszaorveny/recept/halaszle.html"]),
    "toltott_kaposzta": dict(
        names={"hu": "Töltött káposzta", "de": "Ungarisches gefülltes Kraut (Krautwickel)", "en": "Hungarian stuffed cabbage"},
        matrix="liquid", servings_source=6, standard_serving_g=450,
        ingredients=[ing("sauerkraut", 1500, note="~400 g whole leaves + ~1100 g shredded"), ing("pork_minced", 800), ing("rice_white", 120, note="raw; cooks inside the filling"),
                     ing("onion", 150), ing("garlic", 10, "seasoning"), ing("egg", 50), ing("smoked_sausage", 200), ing("smoked_bacon", 150),
                     ing("lard", 20, "fat"), ing("paprika_ground", 12, "seasoning"), ing("wheat_flour", 25, "thickener"), ing("sour_cream", 200, "thickener"),
                     ing("water", 1200, "liquid")],
        cooking=dict(method="layered, simmered ~2.5 h covered, thickened with flour + sour cream", mass_change_g=-250, note="covered pot, low evaporation; rice absorbs broth inside the rolls (no mass change)"),
        sources=["https://sobors.hu/receptek/toltott-kaposzta-savanyu-kaposztabol-recept/", "https://www.mindmegette.hu/recept/klasszikus-toltott-kaposzta", "https://streetkitchen.hu/receptek/klasszikus-csaladi-toltott-kaposzta"]),
    "paprikas_csirke": dict(
        names={"hu": "Paprikás csirke", "de": "Paprikahuhn", "en": "Chicken paprikash"},
        matrix="liquid", servings_source=4, standard_serving_g=300,
        ingredients=[ing("chicken_thigh_skin", 1000, note="edible part of ~1.4 kg bone-in thighs"), ing("onion", 200), ing("sunflower_oil", 30, "fat"),
                     ing("paprika_ground", 15, "seasoning"), ing("wax_pepper", 100), ing("tomato", 100), ing("water", 400, "liquid"),
                     ing("sour_cream", 250, "thickener"), ing("wheat_flour", 20, "thickener")],
        cooking=dict(method="braised ~45 min covered, thickened with sour cream + flour", mass_change_g=-150, note="chicken juices go into the sauce"),
        flat_plate=dict(coverage=0.40, height_cm=2.0),
        sources=["https://www.mindmegette.hu/recept/szaftos-paprikas-csirke-nokedlivel", "https://sobors.hu/receptek/tejfolos-csirkepaprikas-recept/"]),
    "nokedli": dict(
        names={"hu": "Nokedli", "de": "Nockerln / Spätzle", "en": "Hungarian dumplings (nokedli)"},
        matrix="dry", bulk_density_g_ml=0.75, servings_source=4, standard_serving_g=200,
        ingredients=[ing("wheat_flour", 400), ing("egg", 150, note="3 eggs"), ing("water", 250, "liquid")],
        cooking=dict(method="dough boiled in salted water, drained", mass_change_g=120, note="boiled dumplings absorb ~15% water"),
        flat_plate=dict(coverage=0.35, height_cm=2.5),
        sources=["https://www.mindmegette.hu/recept/paprikas-csirke-nokedli"]),
    "sertesporkolt": dict(
        names={"hu": "Sertéspörkölt", "de": "Ungarisches Schweinepörkölt (Schweinegulasch)", "en": "Hungarian pork stew (pörkölt)"},
        matrix="liquid", servings_source=4, standard_serving_g=300,
        ingredients=[ing("pork_shoulder", 1000), ing("onion", 300), ing("lard", 30, "fat"), ing("paprika_ground", 15, "seasoning"),
                     ing("wax_pepper", 100), ing("tomato", 100), ing("garlic", 10, "seasoning"), ing("caraway_seed", 1, "seasoning"), ing("water", 400, "liquid")],
        cooking=dict(method="stewed ~1.5-2 h, water added little by little, reduced to a thick sauce", mass_change_g=-600, note="pörkölt is reduced hard: the meat's own water and most added water evaporate"),
        flat_plate=dict(coverage=0.45, height_cm=2.0),
        sources=["https://www.mindmegette.hu/recept/klasszikus-sertesporkolt", "https://streetkitchen.hu/receptek/a-tokeletes-sertesporkolt"]),
    "lecso_virslivel": dict(
        names={"hu": "Lecsó virslivel", "de": "Letscho mit Wiener Würstchen", "en": "Hungarian lecsó with frankfurters"},
        matrix="liquid", servings_source=4, standard_serving_g=400,
        ingredients=[ing("wax_pepper", 800), ing("tomato", 400), ing("onion", 150), ing("frankfurter", 400, note="4 pár virsli"),
                     ing("lard", 30, "fat"), ing("paprika_ground", 6, "seasoning"), ing("garlic", 6, "seasoning")],
        cooking=dict(method="stewed ~25 min", mass_change_g=-200, note="vegetables release water; part of it evaporates"),
        flat_plate=dict(coverage=0.75, height_cm=1.6),
        sources=["https://sobors.hu/receptek/lecso-virslivel-recept/", "https://sobors.hu/receptek/virslis-lecso-recept/"]),
    "rakott_krumpli": dict(
        names={"hu": "Rakott krumpli", "de": "Ungarischer Kartoffelauflauf", "en": "Hungarian layered potato casserole"},
        matrix="solid", servings_source=4, standard_serving_g=400,
        ingredients=[ing("potato", 900, note="peeled weight; boiled in skin first"), ing("egg", 300, note="6 hard-boiled eggs"), ing("smoked_sausage", 200),
                     ing("sour_cream", 400), ing("butter", 20, "fat")],
        cooking=dict(method="layered, baked 45-50 min at 180 °C", mass_change_g=-140, note="~8% baking loss"),
        flat_plate=dict(coverage=0.35, height_cm=3.2),
        sources=["https://streetkitchen.hu/receptek/szaftos-rakott-krumpli", "https://www.mindmegette.hu/recept/rakott-krumpli"]),
    "marhahusleves": dict(
        names={"hu": "Marhahúsleves (hússal, zöldséggel)", "de": "Ungarische Rindfleischsuppe", "en": "Hungarian beef soup"},
        matrix="liquid", servings_source=6, standard_serving_g=450,
        ingredients=[ing("beef_shank", 800), ing("carrot", 300), ing("parsley_root", 200), ing("celeriac", 100), ing("kohlrabi", 150),
                     ing("onion", 100), ing("garlic", 5, "seasoning"), ing("water", 3500, "liquid")],
        not_eaten=[{"what": "velőscsont", "raw_g": 500, "note": "stock only; marrow fat transfer ignored"}],
        cooking=dict(method="very slow simmer 3-4 h", mass_change_g=-900, note="~25% of the water evaporates"),
        sources=["https://falatozz.hu/recept/marhahusleves", "https://mamakonyhaja.hu/receptek/marhahus-leves/"]),
    "rantott_hus": dict(
        names={"hu": "Rántott hús (sertéskaraj)", "de": "Paniertes Schweineschnitzel", "en": "Breaded pork cutlet"},
        matrix="dry", bulk_density_g_ml=0.85, servings_source=4, standard_serving_g=185,
        ingredients=[ing("pork_loin", 600, note="4 x 150 g slices"), ing("wheat_flour", 30, "coating", "amount that sticks, not the amount put out"),
                     ing("egg", 100, "coating", "2 eggs, amount that sticks"), ing("breadcrumbs", 100, "coating", "amount that sticks (~150 g put out)"),
                     ing("sunflower_oil", 60, "absorbed_fat", "absorbed during deep/shallow frying, ~8% of the breaded weight")],
        cooking=dict(method="fried in 170-180 °C oil, 2-3 min per side", mass_change_g=-150, note="meat loses ~25% of its weight as water while frying"),
        flat_plate=dict(coverage=0.35, height_cm=1.8),
        sources=["https://foodandwine.hu/2010/10/05/a-rantott-szelet-keszitesenek-10-titka/", "https://kemenytojas.com/receptek/rantott-hus/"]),
    "petrezselymes_burgonya": dict(
        names={"hu": "Petrezselymes burgonya", "de": "Petersilienkartoffeln", "en": "Parsley potatoes"},
        matrix="dry", bulk_density_g_ml=0.70, servings_source=4, standard_serving_g=200,
        ingredients=[ing("potato", 1000), ing("butter", 40, "fat"), ing("parsley_leaf", 10, "garnish")],
        cooking=dict(method="boiled, tossed with butter and parsley", mass_change_g=-20, note="boiled potato keeps ~98% of its weight"),
        flat_plate=dict(coverage=0.35, height_cm=2.5),
        sources=["https://falatozz.hu/recept/petrezselymes-burgonya", "https://streetkitchen.hu/receptek/klasszik-petrezselymes-burgonya"]),
    "parolt_rizs": dict(
        names={"hu": "Párolt rizs", "de": "Gedünsteter Reis", "en": "Steamed rice"},
        matrix="dry", bulk_density_g_ml=0.80, servings_source=4, standard_serving_g=180,
        ingredients=[ing("rice_white", 250), ing("sunflower_oil", 15, "fat"), ing("onion", 30), ing("water", 600, "liquid", "2 volumes water to 1 volume rice (250 g rice ~ 3 dl)")],
        cooking=dict(method="toasted in oil, steamed covered", mass_change_g=-60, note="rice absorbs almost all water; a little evaporates"),
        flat_plate=dict(coverage=0.35, height_cm=2.2),
        sources=["https://tesco.hu/hello/receptek/parolt-rizs/278828/", "https://borralfozok.hu/a-tokeletes-parolt-rizs/"]),
    "szekelykaposzta": dict(
        names={"hu": "Székelykáposzta", "de": "Szegediner Gulasch", "en": "Székely cabbage (pork and sauerkraut stew)"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("pork_shoulder", 1000), ing("sauerkraut", 1000), ing("sour_cream", 400, "thickener"), ing("lard", 15, "fat"),
                     ing("onion", 200), ing("paprika_ground", 15, "seasoning"), ing("garlic", 6, "seasoning"), ing("caraway_seed", 1, "seasoning"),
                     ing("wheat_flour", 20, "thickener"), ing("water", 800, "liquid")],
        cooking=dict(method="stewed ~1.5 h covered, thickened with sour cream", mass_change_g=-250, note="covered pot, moderate evaporation"),
        sources=["https://www.mindmegette.hu/recept/szekelykaposzta", "https://magyarkonyhaonline.hu/receptek/a-legfinomabb-szekelykaposzta"]),
}

# ---------------------------------------------------------------------------
# 3. Dishes (what the user says). A dish = parts; a side is a separate part
# so "rántott hús rizzsel" and "rántott hús krumplival" both work.
# served_in: default vessel. Soups are deep-plate only.
# ---------------------------------------------------------------------------
DISHES = [
    dict(id="hu_gulyasleves", part_refs=[("gulyasleves", 450)], served_in="deep_plate", tags=["soup", "traditional"],
         aliases={"hu": ["gulyásleves", "gulyás", "marhagulyás", "gulyás leves"], "de": ["gulaschsuppe", "gulyassuppe"], "en": ["goulash soup", "hungarian goulash"]}),
    dict(id="hu_halaszle", part_refs=[("halaszle", 500)], served_in="deep_plate", tags=["soup", "traditional", "fish"],
         aliases={"hu": ["halászlé", "szegedi halászlé", "halaszle"], "de": ["fischsuppe", "ungarische fischsuppe"], "en": ["fisherman's soup", "hungarian fish soup"]},
         review="Bajai (filézett, gyufatésztával) változat külön étel legyen: más a tészta és nincs passzírozott alap."),
    dict(id="hu_toltott_kaposzta", part_refs=[("toltott_kaposzta", 450)], served_in="deep_plate", tags=["traditional"],
         optional_toppings=[{"food_key": "sour_cream", "g": 40, "hu": "tejföl a tetejére"}],
         aliases={"hu": ["töltött káposzta", "toltott kaposzta"], "de": ["krautwickel", "gefülltes kraut"], "en": ["stuffed cabbage"]}),
    dict(id="hu_paprikas_csirke_nokedlivel", part_refs=[("paprikas_csirke", 300), ("nokedli", 200)], served_in="flat_plate", tags=["traditional"],
         aliases={"hu": ["paprikás csirke nokedlivel", "csirkepaprikás nokedlivel", "paprikás csirke galuskával"], "de": ["paprikahuhn mit nockerln", "paprikahendl"], "en": ["chicken paprikash with dumplings"]}),
    dict(id="hu_sertesporkolt", part_refs=[("sertesporkolt", 300)], served_in="flat_plate", tags=["traditional", "low-carb-friendly"],
         side_options=[("nokedli", 200), ("petrezselymes_burgonya", 200), ("parolt_rizs", 180)],
         aliases={"hu": ["sertéspörkölt", "pörkölt", "disznópörkölt"], "de": ["schweinegulasch", "schweinepörkölt"], "en": ["pork stew", "pork pörkölt"]},
         alias_side={"sertéspörkölt nokedlivel": "nokedli", "pörkölt nokedlivel": "nokedli", "sertéspörkölt galuskával": "nokedli", "pörkölt krumplival": "petrezselymes_burgonya", "pörkölt rizzsel": "parolt_rizs"}),
    dict(id="hu_lecso_virslivel", part_refs=[("lecso_virslivel", 400)], served_in="deep_plate", tags=["traditional", "lower-carb"],
         aliases={"hu": ["lecsó virslivel", "virslis lecsó", "lecsó"], "de": ["letscho mit würstchen"], "en": ["lecso with sausage"]},
         review="A sima 'lecsó' alias csak akkor jó, ha nincs külön virsli nélküli lecsó étel; később szétválasztandó."),
    dict(id="hu_rakott_krumpli", part_refs=[("rakott_krumpli", 400)], served_in="flat_plate", tags=["traditional", "higher-carb"],
         aliases={"hu": ["rakott krumpli", "rakott burgonya"], "de": ["kartoffelauflauf ungarisch"], "en": ["layered potato casserole"]}),
    dict(id="hu_marhahusleves", part_refs=[("marhahusleves", 450)], served_in="deep_plate", tags=["soup", "traditional", "low-carb-friendly"],
         aliases={"hu": ["marhahúsleves", "húsleves", "marha húsleves"], "de": ["rindfleischsuppe", "rindsuppe"], "en": ["beef soup", "beef broth"]},
         review="Gyakran cérnametélttel eszik és a főtt hús külön kerül a tányérra; a 'csak leve' és a 'tésztával' változat későbbi bővítés."),
    dict(id="hu_rantott_hus", part_refs=[("rantott_hus", 185)], served_in="flat_plate", tags=["traditional", "fried"],
         side_options=[("petrezselymes_burgonya", 200), ("parolt_rizs", 180)], default_side=None,
         aliases={"hu": ["rántott hús", "rántott szelet", "bécsi szelet", "rántotthús"], "de": ["schnitzel", "wiener schnitzel vom schwein"], "en": ["breaded cutlet", "pork schnitzel"]},
         alias_side={"rántott hús krumplival": "petrezselymes_burgonya", "rántott hús petrezselymes krumplival": "petrezselymes_burgonya", "rántott hús rizzsel": "parolt_rizs"},
         review="A 'körettel' szó nem dönt a köretről: ha a felhasználó nem mondja meg, a rendszer kérdezzen (burgonya / rizs), ne találgasson. A hasábburgonya és a burgonyapüré későbbi köret."),
    dict(id="hu_szekelykaposzta", part_refs=[("szekelykaposzta", 450)], served_in="deep_plate", tags=["traditional", "low-carb-friendly"],
         aliases={"hu": ["székelykáposzta", "székely káposzta", "székelygulyás"], "de": ["szegediner gulasch", "szegediner"], "en": ["szekely goulash", "pork and sauerkraut stew"]}),
]

# ---------------------------------------------------------------------------
# 4. Plate model (owner decision 2026-09-26: no photo, no scale).
#   Deep plate / bowl: grams = capacity_ml x fill x density.
#   Flat plate: grams = usable_area x coverage x height x fill x density,
#     usable area = circle of 0.8 x diameter (the rim carries no food).
# ---------------------------------------------------------------------------
DEEP_FILL = {"felig": 0.5, "normal": 0.75, "tele": 0.9}
FLAT_FILL = {"keves": 0.7, "normal": 1.0, "pupozott": 1.35}
USABLE_DIAMETER_RATIO = 0.8


def nutrition_of(key, grams):
    k = FOOD_KEYS[key]
    kcal, fat, prot, carbs, fiber, basis = k[5], k[6], k[7], k[8], k[9], k[4]
    if kcal is None:
        return None
    f = grams / 100
    net = carbs if basis in ("available", "none") else max(0.0, carbs - fiber)
    return {"kcal": kcal * f, "fat": fat * f, "protein": prot * f, "net_carbs": net * f}


def build_part(pid, p):
    raw_total = sum(i["raw_g"] for i in p["ingredients"])
    finished = raw_total + p["cooking"]["mass_change_g"]
    # Volume of the finished part: water that left/entered is taken from/added
    # to the liquid; every other component keeps its raw mass.
    vol = 0.0
    change = p["cooking"]["mass_change_g"]
    for i in p["ingredients"]:
        k = FOOD_KEYS[i["food_key"]]
        d = k[10]
        vol += i["raw_g"] / d
    vol += change / 1.0  # the evaporated/absorbed mass is water
    # Loose dry parts: the cooked product's own bulk density (air gaps
    # between dumplings/rice grains/cutlets) - raw ingredients say nothing
    # about it. Liquid and solid parts: derived from the components.
    density = p["bulk_density_g_ml"] if p["matrix"] == "dry" else finished / vol
    totals = {"kcal": 0.0, "fat": 0.0, "protein": 0.0, "net_carbs": 0.0}
    missing = []
    for i in p["ingredients"]:
        n = nutrition_of(i["food_key"], i["raw_g"])
        if n is None:
            missing.append(i["food_key"])
            continue
        for x in totals:
            totals[x] += n[x]
    per100 = {x: round(v / finished * 100, 1) for x, v in totals.items()}
    out = {
        "id": pid, "names": p["names"], "matrix": p["matrix"],
        "batch": {
            "servings_source": p["servings_source"],
            "ingredients": p["ingredients"],
            **({"not_eaten": p["not_eaten"]} if p.get("not_eaten") else {}),
            "raw_total_g": raw_total,
            "cooking": p["cooking"],
            "finished_weight_g": finished,
            "yield_factor": round(finished / raw_total, 3),
        },
        "standard_serving_g": p["standard_serving_g"],
        "density_g_per_ml": round(density, 3),
        "density_method": "cooked bulk density (loose pieces)" if p["matrix"] == "dry" else "derived from components after cooking mass change",
        **({"flat_plate": p["flat_plate"]} if p.get("flat_plate") else {}),
        "sources": p["sources"],
        "derived_check": {
            "note": "Cross-check only, computed from the linked catalog records; the app must compute nutrition from the catalog, not from this block.",
            "per_100g": per100,
            "incomplete_missing_food_keys": missing,
        },
    }
    return out


def flat_grams(part, diameter_cm, fill=1.0):
    fp = part["flat_plate"]
    area = math.pi * (USABLE_DIAMETER_RATIO * diameter_cm / 2) ** 2
    return area * fp["coverage"] * fp["height_cm"] * fill * part["density_g_per_ml"]


def main():
    parts = {pid: build_part(pid, p) for pid, p in PARTS.items()}
    dishes = []
    for d in DISHES:
        dish_parts = [{"part": pid, "standard_serving_g": g} for pid, g in d["part_refs"]]
        first = parts[d["part_refs"][0][0]]
        dish = {
            "id": d["id"],
            "names": first["names"] if len(d["part_refs"]) == 1 else {
                "hu": " ".join([parts[d["part_refs"][0][0]]["names"]["hu"], "nokedlivel"]),
                "de": "Paprikahuhn mit Nockerln", "en": "Chicken paprikash with dumplings"},
            "aliases": d["aliases"],
            "tags": d["tags"],
            "served_in": d["served_in"],
            "parts": dish_parts,
        }
        if d.get("side_options"):
            dish["side_options"] = [{"part": pid, "standard_serving_g": g} for pid, g in d["side_options"]]
            dish["side_required_question"] = True
            if d.get("alias_side"):
                dish["alias_side"] = d["alias_side"]
        if d.get("optional_toppings"):
            dish["optional_toppings"] = d["optional_toppings"]
        if d.get("review"):
            dish["review_note_hu"] = d["review"]
        dishes.append(dish)

    doc = {
        "schema_version": SCHEMA_VERSION,
        "purpose": "Keto Mentor reference dishes - pilot (10 Hungarian traditional dishes)",
        "generated_by": "data/reference-dishes/build.py",
        "rules": [
            "Ingredient grams are RAW, edible part, for the whole source batch (bones, shells and stock-only items excluded).",
            "finished_weight_g = raw_total_g + cooking.mass_change_g (evaporation/frying loss negative, absorption positive).",
            "Nutrition per 100 g = sum of ingredient nutrition from the linked catalog records / finished_weight_g. Nothing here is a nutrition source of truth.",
            "Net carbs: 'total' sources (USDA) = carbs - fiber; 'available' sources (BLS) = carbs as stored.",
            "density_g_per_ml is derived from the parts' components (intrinsic density in liquid/solid dishes, bulk density with air gaps for loose dry parts).",
        ],
        "plate_model": {
            "deep_plate": "grams = capacity_ml x fill x density_g_per_ml",
            "deep_fill": DEEP_FILL,
            "flat_plate": "grams = pi x (0.8 x diameter_cm / 2)^2 x coverage x height_cm x fill x density_g_per_ml",
            "flat_fill": FLAT_FILL,
            "usable_diameter_ratio": USABLE_DIAMETER_RATIO,
        },
        "food_keys": {
            key: {
                "names": {"hu": v[0], "de": v[1], "en": v[2]},
                "catalog": v[3], "carb_basis": v[4],
                "density_intrinsic_g_ml": v[10], "density_bulk_g_ml": v[11],
                **({"note": v[12]} if v[12] else {}),
            } for key, v in FOOD_KEYS.items()
        },
        "parts": parts,
        "dishes": dishes,
    }
    (OUT / "hu-pilot.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (OUT / "hu-pilot-ingredients.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["part_id", "part_name_hu", "servings_source", "food_key", "food_hu", "raw_g", "role", "catalog", "finished_weight_g", "yield_factor", "density_g_per_ml", "standard_serving_g"])
        for pid, p in parts.items():
            for i in p["batch"]["ingredients"]:
                w.writerow([pid, p["names"]["hu"], p["batch"]["servings_source"], i["food_key"], FOOD_KEYS[i["food_key"]][0], i["raw_g"], i["role"],
                            FOOD_KEYS[i["food_key"]][3] or "MISSING", p["batch"]["finished_weight_g"], p["batch"]["yield_factor"], p["density_g_per_ml"], p["standard_serving_g"]])

    lines = ["# Referenciaételek – ellenőrző táblázat (generált)", "",
             "## Részek: nyers tömeg → kész tömeg, sűrűség, tápérték 100 g-ra (keresztellenőrzés)", "",
             "| Rész | Nyers össz. (g) | Víz/tömegváltozás (g) | Kész (g) | Hozam | Sűrűség (g/ml) | kcal | zsír | fehérje | nettó CH | Hiányzó rekord |",
             "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|"]
    for pid, p in parts.items():
        b = p["batch"]; c = p["derived_check"]["per_100g"]
        lines.append(f"| {p['names']['hu']} | {b['raw_total_g']} | {b['cooking']['mass_change_g']:+} | {b['finished_weight_g']} | {b['yield_factor']} | {p['density_g_per_ml']} | {c['kcal']} | {c['fat']} | {c['protein']} | {c['net_carbs']} | {', '.join(p['derived_check']['incomplete_missing_food_keys']) or '–'} |")
    lines += ["", "## Tányér → gramm (normál adag)", "",
              "Mély tányér: kapacitás × töltöttség × sűrűség. Lapos tányér: 0,8 × átmérő hasznos kör × lefedettség × magasság × sűrűség.", "",
              "| Étel | Szokásos adag (g) | Mély 450 ml normál | Mély 650 ml normál | Lapos 24 cm | Lapos 26 cm | Lapos 28 cm |",
              "|---|---:|---:|---:|---:|---:|---:|"]
    for d in dishes:
        std = sum(x["standard_serving_g"] for x in d["parts"])
        ps = [parts[x["part"]] for x in d["parts"]]
        dens = sum(x["standard_serving_g"] for x in d["parts"]) / sum(x["standard_serving_g"] / parts[x["part"]]["density_g_per_ml"] for x in d["parts"])
        loose = all(p["matrix"] == "dry" for p in ps)
        deep = lambda cap: "– (lapos tányéros étel)" if loose else f"{cap * DEEP_FILL['normal'] * dens:.0f}"
        if all("flat_plate" in p for p in ps):
            flat = lambda dia: f"{sum(flat_grams(p, dia) for p in ps):.0f}"
            f24, f26, f28 = flat(24), flat(26), flat(28)
        else:
            f24 = f26 = f28 = "– (mély tányéros étel)"
        lines.append(f"| {d['names']['hu']} | {std} | {deep(450)} | {deep(650)} | {f24} | {f26} | {f28} |")
    lines += ["", "Köretek lapos tányéron (26 cm, normál): " + ", ".join(f"{parts[pid]['names']['hu']} ≈ {flat_grams(parts[pid], 26):.0f} g" for pid in ("nokedli", "petrezselymes_burgonya", "parolt_rizs")), ""]
    (OUT / "hu-pilot-check.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
