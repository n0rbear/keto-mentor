"""Ingredient identity layer shared by every country (food_key -> one
reviewed catalog record). See build.py for how the values are used."""

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
    "smoked_sausage":      ("füstölt kolbász (debreceni)", "Debrecziner", "Debrecziner sausage", "bls:W185000", "total", 330, 26.31, 23.32, 0.07, 0.07, 1.00, 0.80, "BLS Debrecziner roh (Hungarian-style paprika sausage); imported by migration 20260926170000; carbs stored as total"),
    "smoked_bacon":        ("füstölt szalonna / bacon", "Räucherspeck", "smoked bacon", "bls:W415000", "available", 304, 26.22, 16.58, 0.492, 0, 1.00, 0.80, None),
    "lard":                ("sertészsír", "Schweineschmalz", "lard", "usda_fdc:171401", "total", 902, 100, 0, 0, 0, 0.92, 0.92, None),
    "sunflower_oil":       ("napraforgóolaj", "Sonnenblumenöl", "sunflower oil", "bls:Q320000", "available", 900, 100, 0, 0, 0, 0.92, 0.92, None),
    "butter":              ("vaj", "Butter", "butter", "open_database:173430", "total", 717, 81.1, 0.85, 0.06, 0, 0.91, 0.91, None),
    "sour_cream":          ("tejföl (20%)", "Saure Sahne / Schmand", "sour cream", "usda_fdc:2346387", "total", 192.7, 17.99, 3.07, 5.56, 0, 1.02, 1.02, "USDA full-fat sour cream (18% fat) is the closest to Hungarian 20% tejföl"),
    "egg":                 ("tojás", "Hühnerei", "egg", "bls:E111100", "available", 135, 9.0, 13.175, 0.34, 0, 1.03, 1.03, "grams = without shell; 1 medium egg ~50 g"),
    "wheat_flour":         ("búzaliszt (BL55)", "Weizenmehl Type 405/550", "wheat flour", "bls:C214100", "available", 348, 0.93, 10.46, 71.77, 5.3, 1.00, 1.00, None),
    "breadcrumbs":         ("zsemlemorzsa", "Paniermehl", "breadcrumbs", "bls:B821000", "total", 364, 3.97, 11.6, 72.82, 5.34, 1.00, 1.00, "BLS Paniermehl/Semmelbrösel; imported by migration 20260926170000; carbs stored as total"),
    "rice_white":          ("rizs (nyers)", "Reis, poliert (roh)", "white rice, raw", "bls:C352000", "available", 351, 0.62, 7.931, 77.1, 2.5, 1.00, 0.80, None),
    "potato":              ("burgonya", "Kartoffel", "potato", "bls:K110100", "available", 83, 0.1, 1.94, 17.9, 1.42, 1.08, 0.70, "grams = peeled"),
    "onion":               ("vöröshagyma", "Zwiebel", "onion", "bls:G480100", "available", 34, 0.15, 1.156, 6.01, 1.4, 1.00, 0.80, None),
    "garlic":              ("fokhagyma", "Knoblauch", "garlic", "bls:G490100", "available", 97, 0.42, 6.05, 3.0, 28.297, 1.00, 1.00, "BLS counts garlic fructans as fiber (3 g available carbs, 28 g fiber); energy is consistent, not a data error"),
    "carrot":              ("sárgarépa", "Möhre/Karotte", "carrot", "bls:G620100", "available", 40, 0.4, 0.84, 6.471, 2.9, 1.03, 0.75, None),
    "parsley_root":        ("petrezselyemgyökér", "Wurzelpetersilie", "parsley root", "bls:G670100", "total", 76, 0.47, 2.88, 15.93, 2.13, 1.03, 0.75, "BLS Wurzelpetersilie roh; imported by migration 20260926170000; carbs stored as total. Parsnip is NOT the same food"),
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
    # Phase 1 samples (AT/DE/street food), production catalog checked read-only on 2026-09-27.
    "clarified_butter":    ("tisztított vaj (ghí)", "Butterschmalz", "clarified butter", "bls:Q683000", "total", 897, 99.5, 0.25, 0, 0, 0.91, 0.91, None),
    "wheat_roll":          ("zsemle", "Weizenbrötchen / Semmel", "white bread roll", "bls:B511000", "total", 280, 1.81, 10.09, 57.57, 3.6, 0.25, 0.25, "density = whole roll (airy crumb); carbs stored as total"),
    "leberkaese":          ("leberkäse (sütött hússajt)", "Leberkäse / Fleischkäse", "Leberkäse (baked meat loaf)", "bls:W233000", "total", 282, 24.9, 13.5, 0.57, 0, 1.00, 1.00, "BLS Fleischkäse einfach, fein / Bayerischer Leberkäse"),
    "mustard":             ("mustár", "Senf mittelscharf", "mustard", "bls:R132000", "total", 111, 6.96, 5.51, 7.44, 4.5, 1.05, 1.05, None),
    "green_bean_missing":  ("zöldbab", "Grüne Bohnen", "green beans", "", "none", None, None, None, None, None, 1.0, 0.75, "MISSING_FOODS: authoritative BLS record required"),
    "white_bean_missing":  ("fehérbab", "weiße Bohnen", "white beans", "", "none", None, None, None, None, None, 1.0, 0.75, "MISSING_FOODS: authoritative BLS record required"),
    "tarragon_missing":    ("tárkony", "Estragon", "tarragon", "", "none", None, None, None, None, None, 1.0, 0.30, "MISSING_FOODS: authoritative BLS record required"),
    "lemon_missing":       ("citrom", "Zitrone", "lemon", "", "none", None, None, None, None, None, 0.99, 0.99, "MISSING_FOODS: authoritative BLS record required"),
}
