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
    "green_bean":          ("zöldbab", "Grüne Bohnen", "green beans", "bls:G710100", "total", 28, 0.24, 2.238, 5.29, 1.89, 1.0, 0.60, None),
    "dry_bean":            ("szárazbab (tarkabab, vörösbab)", "Gartenbohne getrocknet", "dry beans (pinto, kidney)", "bls:H739400", "total", 344, 1.6, 22.619, 68.991, 23.24, 1.3, 0.80, "grams = dry beans before soaking"),
    "lemon_juice":         ("citromlé", "Zitronensaft", "lemon juice", "usda_fdc:167747", "total", 22, 0.24, 0.35, 6.9, 0.3, 1.03, 1.03, None),
    "smoked_pork_hock":    ("füstölt sertéscsülök", "Eisbein gepökelt, geräuchert", "smoked pork hock", "bls:U672700", "total", 150, 8.17, 18.68, 0.437, 0, 1.06, 0.80, "BLS Vorderhaxe Kochpökelware geräuchert; imported by migration 20260927120000"),
    # hu_levesek
    "egg_pasta_dry":      ("száraz tojásos tészta (gyufatészta, lebbencs, eperlevél)", "Eierteigwaren (roh)", "dry egg pasta", "bls:E432000", "total", 342, 2, 13.2, 69.473, 3.38, 1.0, 0.5, "dry weight; takes up ~1.2x its weight in water when boiled"),
    "stewing_hen":        ("tyúkhús (bőrrel)", "Suppenhuhn Fleisch mit Haut", "stewing hen meat with skin", "bls:V434100", "total", 257, 20.3, 18.5, 0, 0, 1.05, 0.8, "grams = edible part; whole hen is ~55% edible"),
    "savoy_cabbage":      ("kelkáposzta", "Wirsing", "savoy cabbage", "bls:G343100", "total", 37, 0.32, 2.779, 6.9, 2.8, 1.0, 0.4, None),
    "green_peas":         ("zöldborsó", "Erbse grün", "green peas", "bls:G760100", "total", 88, 0.48, 5.9, 17.303, 5, 1.0, 0.7, None),
    "mushroom":           ("csiperkegomba", "Champignon", "button mushroom", "bls:K701100", "total", 28, 0.274, 3.66, 4.8, 1.9, 1.0, 0.5, None),
    "cauliflower":        ("karfiol", "Blumenkohl", "cauliflower", "bls:G311100", "total", 35, 0.28, 2.424, 8.23, 2.9, 1.0, 0.5, None),
    "smoked_pork_neck":   ("füstölt tarja", "Kasseler Kamm (gepökelt, geräuchert)", "smoked cured pork neck", "bls:W511000", "total", 154, 7.5, 20.9, 0.611, 0, 1.05, 0.8, "BLS Kasseler Kamm, Kochpökelware, geräuchert"),
    "lentils_dry":        ("lencse (száraz)", "Linsen getrocknet", "dry lentils", "bls:H725100", "total", 323, 1.7, 23.357, 62.4, 17.6, 1.3, 0.8, "grams = dry lentils before soaking"),
    "split_peas_dry":     ("sárgaborsó (száraz)", "Erbsen getrocknet (gelbe Schälerbsen)", "dry yellow split peas", "bls:G760400", "total", 311, 1.44, 23.023, 62.53, 22.03, 1.3, 0.8, "BLS Erbse reif = dried mature peas; grams = dry weight"),
    "sugar":              ("kristálycukor", "Zucker weiß", "white sugar", "bls:S111000", "total", 400, 0, 0, 100, 0, 1.59, 0.85, None),
    "vinegar":            ("ecet (10%-os)", "Branntweinessig", "spirit vinegar", "bls:R122000", "total", 25, 0, 0, 0, 0, 1.01, 1.01, None),
    "turkey_breast":      ("pulykamell", "Putenbrust ohne Haut", "turkey breast, skinless", "bls:V486100", "total", 105, 0.99, 24.1, 0, 0, 1.05, 0.8, None),
    "leek":               ("póréhagyma", "Porree/Lauch", "leek", "bls:G470100", "total", 36, 0.25, 2.14, 7.2, 2.2, 1.0, 0.4, None),
    "cream_30":           ("habtejszín (30%)", "Schlagsahne 30 % Fett", "whipping cream 30%", "bls:M173800", "total", 308, 31.7, 2.312, 3.27, 0, 1.0, 1.0, "also used for recipes that say plain 'tejszín'"),
    "sour_cherry":        ("meggy", "Sauerkirsche", "sour cherry", "bls:F212100", "total", 69, 0.5, 0.9, 14.846, 1.1, 1.05, 0.6, "grams = pitted"),
    "sweet_cherry":       ("cseresznye", "Süßkirsche", "sweet cherry", "bls:F211100", "total", 70, 0.31, 0.9, 17.23, 1.9, 1.05, 0.6, "grams = pitted"),
    "apple_peeled":       ("alma (hámozva)", "Apfel geschält", "apple, peeled", "bls:F120100", "total", 43, 0.13, 0.3, 11.09, 2.19, 0.85, 0.55, None),
    "pear":               ("körte", "Birne", "pear", "bls:F130100", "total", 58, 0.29, 0.3, 15.96, 2.8, 1.0, 0.55, None),
    "peach":              ("őszibarack", "Pfirsich", "peach", "bls:F203100", "total", 39, 0.11, 0.7, 9.72, 1.7, 1.0, 0.55, None),
    "vanilla_sugar":      ("vaníliás cukor", "Vanillezucker", "vanilla sugar", "bls:S114000", "total", 400, 0, 0, 100, 0, 1.59, 0.85, None),
    "milk_whole":         ("tej (3,5%)", "Vollmilch 3,5 %", "whole milk 3.5%", "bls:M111300", "total", 62, 3.49, 3.55, 4.03, 0, 1.03, 1.03, None),
    "pumpkin":            ("sütőtök", "Kürbis Hokkaido (C. maxima)", "winter squash (C. maxima)", "bls:G581000", "total", 30, 0.2, 1.4, 6.078, 0.78, 0.95, 0.6, "Hungarian sütőtök is C. maxima"),
    "bouillon_cube":      ("leveskocka / erőleveskocka", "Fleischbrühe (Brühwürfel)", "meat bouillon cube", "bls:R811000", "total", 207, 6.48, 7.24, 30.58, 2.82, 1.0, 1.0, "values per 100 g of cube/powder; 1 cube ~10 g"),
    "soy_sauce":          ("szójaszósz", "Sojasauce", "soy sauce", "bls:R143000", "total", 66, 0.88, 6.3, 6.61, 1.14, 1.15, 1.15, None),
    # hu_tesztak_edessegek
    "quark_20":           ("tehéntúró (félzsíros)", "Speisequark Halbfettstufe, 20 % Fett i. Tr.", "quark / farmer cheese, 20% fat in dry matter", "bls:M713300", "total", 110, 5.1, 12.245, 3.04, 0, 1.05, 0.8, "ordinary Hungarian tehéntúró (félzsíros, ~5% fat)"),
    "quark_40":           ("tehéntúró (zsíros)", "Speisequark Fettstufe, 40 % Fett i. Tr.", "quark / farmer cheese, 40% fat in dry matter", "bls:M713500", "total", 159, 11.4, 10.874, 2.6, 0, 1.05, 0.8, "Hungarian zsíros tehéntúró (~10-11% fat)"),
    "powdered_sugar":     ("porcukor", "Puderzucker", "powdered sugar", "bls:S111100", "total", 400, 0, 0, 100, 0, 1.59, 0.56, None),
    "poppy_seed_ground":  ("darált mák", "Mohn gemahlen", "ground poppy seed", "bls:H450400", "total", 521, 42.2, 23.821, 20.149, 17.159, 1.0, 0.55, None),
    "walnut_ground":      ("darált dió", "Walnuss gemahlen", "ground walnuts", "bls:H120400", "total", 718, 70.6, 16.07, 6.2, 3.2, 1.0, 0.45, None),
    "semolina_soft":      ("búzadara (gríz)", "Weichweizengrieß", "wheat semolina (soft wheat)", "bls:C218000", "total", 355, 0.88, 10.72, 78.03, 4.06, 1.4, 0.7, "Hungarian búzadara is milled from common (soft) wheat"),
    "plum":               ("szilva (magozott)", "Zwetschge roh", "plum (Zwetschge), raw", "bls:F223100", "total", 48, 0.17, 0.3, 12.41, 1.7, 1.05, 0.6, "grams = pitted"),
    "jam":                ("lekvár (sárgabarack, szilva)", "Konfitüre extra", "jam", "bls:S132000", "total", 234, 0.2, 0.4, 57.4, 1.1, 1.3, 1.3, "BLS generic Konfitüre extra; Hungarian baracklekvár"),
    "cocoa_powder":       ("kakaópor (holland)", "Kakaopulver schwach entölt", "cocoa powder", "bls:S711000", "total", 365, 19.8, 22.61, 37.22, 26.32, 1.0, 0.45, None),
    "dark_chocolate":     ("étcsokoládé (~50-60%)", "Zartbitter-/Halbbitterschokolade", "dark chocolate (semisweet)", "bls:S560000", "total", 534, 32.26, 6.62, 58.87, 9.27, 1.25, 1.25, None),
    "bitter_chocolate":   ("étcsokoládé (70%)", "Bitterschokolade", "bittersweet chocolate (70%)", "bls:S570000", "total", 563, 41.33, 9.1, 43.81, 10.11, 1.25, 1.25, None),
    "yeast_fresh":        ("friss élesztő", "Backhefe frisch", "fresh yeast", "bls:R459000", "total", 128, 1.2, 16.7, 15.18, 5.18, 1.0, 1.0, None),
    "raisins":            ("mazsola", "Rosinen/Sultaninen", "raisins", "bls:F840100", "total", 288, 1, 2.7, 67.2, 5.4, 1.0, 0.65, None),
    "white_cabbage":      ("fejes káposzta", "Weißkohl", "white cabbage", "bls:G342100", "total", 32, 0.19, 1.382, 7.54, 3, 1.0, 0.45, None),
    "rum":                ("rum", "Rum 37,5/40 % vol", "rum 40%", "bls:P741000", "total", 214, 0, 0, 0, 0, 0.94, 0.94, None),
    "corn_starch":        ("étkezési keményítő", "Maisstärke", "corn starch", "bls:C446000", "total", 348, 0.08, 0.431, 86.9, 1, 1.0, 0.6, None),
    "egg_yolk":           ("tojássárgája", "Hühnerei Eigelb", "egg yolk", "bls:E112100", "total", 345, 31.3, 15.6, 0.21, 0, 1.03, 1.03, "1 yolk ~18 g"),
    "gelatin":            ("zselatin", "Speisegelatine", "gelatin", "bls:R468000", "total", 341, 0.1, 85.1, 0, 0, 1.0, 0.6, None),
    "olive_oil":          ("olívaolaj", "Olivenöl", "olive oil", "bls:Q120000", "total", 899, 99.9, 0, 0, 0, 0.92, 0.92, None),
    "baking_powder":      ("sütőpor", "Backpulver", "baking powder", "bls:R421100", "total", 88, 0.124, 0.09, 21.6, 0, 1.0, 0.8, None),
    # hu_husetelek
    "chicken_whole_skin": ("csirke (egész, csont nélkül, bőrrel)", "Hähnchen ganz, entbeint, mit Haut", "whole chicken, boneless, with skin", "bls:V414100", "total", 186, 12.53, 18.37, 0, 0, 1.05, 0.8, "grams = edible part; bone-in pieces are ~1.4x"),
    "mutton_meat":        ("birkahús", "Schaffleisch, grob entsehnt", "mutton meat", "bls:U803000", "total", 181, 11.9, 18.4, 0, 0, 1.05, 0.8, None),
    "wild_boar":          ("vaddisznóhús", "Wildschwein Fleisch", "wild boar meat", "bls:V250100", "total", 162, 9.3, 19.5, 0, 0, 1.05, 0.8, None),
    "beef_tripe":         ("marhapacal", "Rind Magen/Kutteln", "beef tripe", "bls:V551100", "total", 80, 2.84, 13.5, 0, 0, 1.04, 0.8, "cleaned tripe, raw"),
    "pork_hock":          ("sertéscsülök (nyers)", "Schweine-Vordereisbein/Vorderhaxe", "pork hock, raw", "bls:U672100", "total", 200, 12.06, 22.99, 0, 0, 1.06, 0.8, "grams = edible part (meat, skin, fat), bone removed"),
    "catfish":            ("harcsa", "Wels", "wels catfish", "bls:T506100", "total", 128, 7.4, 15.3, 0, 0, 1.05, 0.8, "grams = fillet"),
    "pork_neck":          ("sertéstarja", "Schweinekamm", "pork neck (collar)", "bls:U632100", "total", 175, 10.9, 19.21, 0, 0, 1.05, 0.85, None),
    "pork_leg":           ("sertéscomb", "Schwein Oberschale", "pork leg (top round)", "bls:U687000", "total", 115, 2.51, 23.01, 0, 0, 1.05, 0.85, None),
    "pork_rib":           ("sertésoldalas", "Schwein Dicke Rippe", "pork ribs (belly ribs)", "bls:U564100", "total", 196, 13.07, 19.66, 0, 0, 1.05, 0.8, "grams = edible part; bone-in weight is ~1.5x"),
    "beef_striploin":     ("marha hátszín", "Rind Roastbeef (Rücken)", "beef striploin", "bls:U221100", "total", 130, 4.45, 22.45, 0, 0, 1.05, 0.85, None),
    "beef_chuck":         ("marhalapocka", "Rind Bug/Schulter", "beef shoulder (chuck)", "bls:U261100", "total", 128, 5.3, 20.2, 0, 0, 1.06, 0.8, None),
    "mushroom_mix":       ("erdei gomba (vegyes)", "Mischpilze", "mixed mushrooms", "bls:K750100", "total", 34, 0.3, 3.5, 7.26, 5.1, 0.95, 0.5, None),
    "beef_broth":         ("marhahúsleves-alaplé", "Fleischbrühe (Rind)", "beef broth", "bls:Y183013", "total", 3, 0.2, 0.4, 0, 0, 1.0, 1.0, None),
    "apple":              ("alma", "Apfel", "apple", "bls:F110100", "total", 58, 0.5, 0.424, 13.975, 2.275, 0.85, 0.6, "grams = cored, with peel"),
    "tomato_paste":       ("sűrített paradicsom (paradicsompüré)", "Tomatenmark", "tomato paste", "bls:R160000", "total", 81, 0.2, 3.4, 17.9, 4.7, 1.1, 1.1, "Hungarian 'paradicsompüré' = concentrated paste"),
    "tomato_passata":     ("paradicsomlé / passata", "Tomaten passiert", "tomato passata", "bls:R161200", "total", 29, 0.1, 1.18, 5.75, 1.81, 1.03, 1.03, None),
    "trappista":          ("trappista sajt", "Trappistenkäse mind. 45 % Fett i. Tr.", "Trappist cheese", "bls:M505600", "total", 345, 26.8, 25.1, 0.01, 0, 1.08, 0.4, None),
    "spring_onion":       ("újhagyma", "Frühlingszwiebel", "spring onion", "bls:G482100", "total", 27, 0.19, 1.9, 5.6, 2.6, 1.0, 0.4, None),
    # hu_reggeli_pekaru
    "ham_cooked":         ("főtt sonka / szendvicssonka", "Kochschinken", "cooked ham", "bls:W424000", "total", 130, 3.7, 22.5, 0.74, 0, 1.05, 0.6, None),
    "parizsi":            ("párizsi", "Lyoner", "parizer (Lyoner-type sausage)", "bls:W231100", "total", 281, 25.5, 12.25, 0.25, 0, 1.0, 0.6, "Hungarian párizsi = finely emulsified Lyoner-type Brühwurst"),
    "felvagott":          ("felvágott (olasz/bécsi típusú)", "Jagdwurst/Schinkenwurst grob", "cold cuts (Brühwurst with meat pieces)", "bls:W254000", "total", 204, 15.8, 15.3, 0.13, 0.05, 1.0, 0.6, "Hungarian felvágott = Brühwurst with meat mosaic (olasz, bécsi felvágott); BLS generic coarse Jagdwurst/Schinkenwurst"),
    "processed_cheese_slice":("lapkasajt (ömlesztett)", "Schmelzkäse schnittfest 45 % F. i. Tr.", "processed cheese slices", "bls:M771600", "total", 299, 23.6, 15.7, 5.1, 0, 1.05, 0.6, None),
    "oat_flakes":         ("zabpehely", "Haferflocken", "rolled oats", "bls:C133000", "total", 348, 6.65, 13.22, 64.283, 10.983, 0.4, 0.4, None),
    "muesli":             ("müzli (gyümölcsös)", "Müslimischung mit Trockenfrüchten, gesüßt", "muesli with dried fruit, sweetened", "bls:C538000", "total", 335, 6, 9.3, 65.3, 10.1, 0.45, 0.45, None),
    "granola":            ("granola (ropogós müzli)", "Knuspermüslimischung mit Trockenfrüchten, gesüßt", "granola (crunchy muesli)", "bls:C514400", "total", 410, 14.1, 7.9, 66.3, 7.1, 0.45, 0.45, None),
    "yogurt_plain":       ("natúr joghurt", "Joghurt mild 3,5 %", "plain yogurt 3.5 %", "bls:M141300", "total", 67, 3.46, 3.98, 4.13, 0, 1.03, 1.03, None),
    "strawberry":         ("eper", "Erdbeere", "strawberry", "bls:F301100", "total", 38, 0.4, 0.82, 7.917, 2, 0.95, 0.6, None),
    "honey":              ("méz", "Honig", "honey", "bls:S120000", "total", 305, 0, 0.4, 74.091, 0, 1.4, 1.4, None),
    "yeast_dry":          ("szárított élesztő (porélesztő)", "Trockenbackhefe", "dry yeast", "bls:R458000", "total", 334, 7.61, 40.4, 37.6, 23.3, 0.6, 0.6, None),
    "plum_butter":        ("szilvalekvár", "Pflaumenmus", "plum butter (lekvár)", "bls:S161000", "total", 195, 0.2, 0.94, 47.588, 1.66, 1.3, 1.3, None),
    "pork_back_fat":      ("sertés hátszalonna (nyers)", "Rückenspeck roh", "pork back fat, raw", "bls:W412000", "total", 746, 80.92, 4.41, 0, 0, 0.92, 0.8, None),
    # hu_hetkoznapi
    "pasta_durum_dry":    ("száraztészta (durum, tojás nélküli)", "Teigwaren eifrei (roh)", "dry pasta, egg-free (durum)", "bls:E401000", "total", 346, 1.6, 12.4, 72.239, 3.406, 1.0, 0.5, "grams = dry weight; spagetti, penne"),
    "couscous_dry":       ("kuszkusz (száraz)", "Couscous (Hartweizen) roh", "couscous, dry", "bls:C119200", "total", 350, 1.7, 11.692, 75.09, 6.17, 1.0, 0.7, "grams = dry weight"),
    "parmesan":           ("parmezán", "Parmesan", "parmesan", "bls:M306400", "total", 391, 27.43, 35.6, 0.056, 0, 1.1, 0.4, None),
    "mozzarella":         ("mozzarella", "Mozzarella", "mozzarella", "bls:M032100", "total", 259, 20.99, 17.12, 0, 0, 1.05, 0.5, None),
    "feta":               ("feta sajt", "Feta", "feta cheese", "bls:M012200", "total", 284, 24.09, 15.68, 0, 0, 1.1, 0.6, None),
    "olives_black":       ("fekete olívabogyó", "Oliven geschwärzt, in Salzlake", "black olives", "bls:H520800", "total", 140, 14.84, 0.84, 1.6, 1.6, 1.0, 0.6, "drained"),
    "cucumber":           ("kígyóuborka / uborka", "Gurke", "cucumber", "bls:G520100", "total", 16, 0.2, 1.062, 2.87, 0.9, 0.96, 0.6, None),
    "sweet_corn_canned":  ("csemegekukorica (konzerv)", "Zuckermais Konserve, abgetropft", "sweet corn, canned, drained", "bls:G570902", "total", 79, 1.94, 2.71, 14.43, 3.59, 1.0, 0.7, None),
    "zucchini":           ("cukkini / főzőtök", "Zucchini", "zucchini / vegetable marrow", "bls:G582100", "total", 22, 0.287, 1.3, 4.1, 1.1, 0.95, 0.6, "Hungarian főzőtök (C. pepo summer squash, eaten young) is mapped here; BLS Kürbis Pumpkin is the ripe orange pumpkin"),
    "spinach":            ("spenót", "Spinat", "spinach", "bls:G211100", "total", 18, 0.3, 2.067, 2.73, 1.8, 1.0, 0.3, None),
    "mayonnaise":         ("majonéz", "Mayonnaise (Fertigprodukt)", "mayonnaise", "bls:Q991000", "total", 750, 81.2, 1.49, 2.94, 0.64, 0.95, 0.95, None),
    "beef_minced":        ("darált marhahús", "Rinderhackfleisch", "ground beef", "bls:U010100", "total", 224, 16.39, 19.102, 0, 0, 1.05, 0.8, None),
    "chicken_breast":     ("csirkemellfilé", "Hähnchenbrustfilet", "chicken breast fillet", "bls:V416100", "total", 109, 1.81, 23.25, 0, 0, 1.05, 0.8, None),
    "chicken_drumstick_skin":("csirke alsócomb bőrrel", "Hähnchenunterschenkel mit Haut", "chicken drumstick with skin", "bls:V4B5100", "total", 151, 8.58, 18.55, 0, 0, 1.05, 0.8, "grams = edible part"),
    "ham_smoked_cooked":  ("füstölt főtt sonka", "Kochschinken geräuchert", "smoked cooked ham", "bls:W423000", "total", 106, 3.04, 19.24, 0.465, 0, 1.05, 0.6, None),
    "tomato_juice":       ("paradicsomlé", "Tomatensaft", "tomato juice", "bls:G560600", "total", 18, 0.046, 0.76, 3.728, 0.76, 1.02, 1.02, None),
    "bell_pepper_red":    ("piros kaliforniai paprika", "Gemüsepaprika rot", "red bell pepper", "bls:G543100", "total", 36, 0.2, 1.025, 8.39, 2.2, 0.95, 0.5, None),
    "aubergine":          ("padlizsán", "Aubergine", "aubergine / eggplant", "bls:G510100", "total", 19, 0.18, 0.57, 4.42, 1.4, 0.9, 0.5, None),
    "romaine":            ("római saláta", "Römischer Salat", "romaine lettuce", "bls:G107100", "total", 14, 0.13, 1.2, 2.9, 1.6, 0.95, 0.2, None),
    "pine_nuts":          ("fenyőmag", "Pinienkerne", "pine nuts", "bls:H320100", "total", 660, 61.9, 16.4, 12.6, 6.4, 1.0, 0.6, None),
    "basil_fresh":        ("bazsalikom (friss)", "Basilikum frisch", "fresh basil", "bls:G061000", "total", 23, 0.64, 3.15, 1.91, 1.6, 1.0, 0.15, None),
    "kidney_beans_canned":("vörösbab (konzerv)", "Kidneybohnen Konserve, abgetropft", "kidney beans, canned, drained", "bls:H742902", "total", 128, 1, 8.5, 26.33, 11.23, 1.1, 0.75, None),
    "beer_lager":         ("világos sör", "Lagerbier hell", "lager beer", "bls:P161000", "total", 36, 0, 0.4, 2.283, 0, 1.0, 1.0, "alcohol mostly evaporates during cooking; energy slightly overstated"),
    "coffee_brewed":      ("kávé (főzet)", "Kaffee (Getränk)", "brewed coffee", "bls:N410100", "total", 1, 0, 0.12, 0.314, 0.314, 1.0, 1.0, None),
    "brown_sugar":        ("barna cukor", "Zucker braun", "brown sugar", "bls:S112000", "total", 387, 0, 0, 96.7, 0, 0.9, 0.9, None),
    # hu_street_food
    "sour_cream_20_bls":  ("tejföl (20%)", "Schmand, 20 % Fett", "sour cream 20%", "bls:M172700", "total", 206, 20, 2.8, 3, 0, 1.02, 1.02, "BLS record matching Hungarian 20% tejföl; foods.py sour_cream is the USDA 18% record"),
    "pork_liver":         ("sertésmáj", "Schweineleber", "pork liver", "bls:V533100", "total", 131, 4.77, 20.96, 1, 0, 1.05, 0.8, None),
    "pork_lung":          ("sertéstüdő", "Schweinelunge", "pork lung", "bls:V543100", "total", 114, 6.67, 13.5, 0, 0, 1.0, 0.7, None),
    "pork_heart":         ("sertésszív", "Schweineherz", "pork heart", "bls:V513100", "total", 117, 5.53, 16.9, 0, 0, 1.05, 0.8, None),
    "pork_kidney":        ("sertésvese", "Schweineniere", "pork kidney", "bls:V573100", "total", 102, 3.765, 17, 0, 0, 1.05, 0.8, None),
    "pork_tongue":        ("sertésnyelv", "Schweinezunge", "pork tongue", "bls:V593100", "total", 190, 13.44, 17.27, 0, 0, 1.05, 0.8, None),
    "pork_blood":         ("sertésvér", "Schweineblut", "pork blood", "bls:U609100", "total", 75, 0.11, 18.5, 0, 0, 1.05, 1.05, None),
    "pork_belly":         ("sertésdagadó / hasaalja (bőrös)", "Schweinebauch", "pork belly", "bls:U642100", "total", 324, 28.06, 17.74, 0, 0, 1.0, 0.8, None),
    "white_bread":        ("fehér kenyér", "Weizenbrot/Weißbrot", "white wheat bread", "bls:B311000", "total", 272, 2.97, 8.69, 54.54, 4, 0.3, 0.3, "density = sliced bread with airy crumb"),
    "hake":               ("hekk (tengeri)", "Seehecht", "hake", "bls:T209100", "total", 86, 1.93, 17.2, 0, 0, 1.05, 0.8, "grams = edible part (no head, bones)"),
    "flatbread":          ("pita / török kenyér", "Weizenfladenbrot", "wheat flatbread (pita)", "bls:B782100", "total", 248, 2.3, 8.2, 50.34, 3.34, 0.35, 0.35, None),
    "tortilla":           ("tortilla lap", "Weizentortilla", "wheat tortilla", "bls:B783012", "total", 296, 7.85, 8.85, 47.839, 1.2, 0.6, 0.4, None),
    "yogurt_greek_10":    ("görög típusú joghurt (10%)", "Sahnejoghurt 10 %", "Greek-style yogurt 10%", "bls:M141500", "total", 124, 10, 3.3, 4.5, 0, 1.05, 1.05, "Hungarian 'görög joghurt' retail = 10% fat creamy yogurt"),
    "kefir":              ("kefir", "Kefir 3,5 %", "kefir", "bls:M130300", "total", 63, 3.5, 3.164, 4.13, 0, 1.03, 1.03, None),
    "lettuce":            ("fejes saláta", "Kopfsalat", "lettuce", "bls:G105100", "total", 18, 0.22, 1.5, 3.1, 1.4, 0.95, 0.2, None),
    "yellow_bell_pepper": ("kaliforniai paprika (sárga)", "Gemüsepaprika gelb", "yellow bell pepper", "bls:G542100", "total", 28, 0.2, 0.8, 6.622, 2.2, 0.95, 0.5, None),
    "ketchup":            ("ketchup", "Tomatenketchup", "ketchup", "bls:R141100", "total", 98, 0.1, 1.4, 22.97, 1.81, 1.14, 1.14, None),
    "bbq_sauce":          ("barbecue szósz", "Grillsauce, Tomaten-Basis", "barbecue sauce", "bls:R148200", "total", 102, 0.56, 1.46, 22.08, 0.72, 1.1, 1.1, None),
    "chickpeas_canned":   ("csicseriborsó (konzerv, lecsepegtetve)", "Kichererbse Konserve, abgetropft", "chickpeas, canned, drained", "bls:H720902", "total", 136, 2.7, 7.5, 25.3, 9.8, 1.1, 0.75, None),
    "hummus":             ("humusz", "Hummus", "hummus", "bls:H960000", "total", 324, 28.5, 5.9, 13.9, 5.9, 1.05, 1.05, None),
    "margarine":          ("margarin", "Pflanzenmargarine Vollfett", "margarine (full fat)", "bls:Q400000", "total", 718, 79.6, 0.11, 0.164, 0, 0.92, 0.92, None),
    # at_traditionell (phase 3, BLS 4.0 xlsx 2025; production presence to be confirmed read-only, imported by 20261005120000_bls_regional_at)
    "veal_schnitzel":     ("borjúcomb (szelet)", "Kalb Schnitzel (Keule)", "veal leg cutlet", "bls:U342100", "total", 89, 0.72, 20.7, 0, 0, 1.05, 0.85, None),  # BLS: Kalb Schnitzel (Keule) roh
    "beef_tafelspitz":    ("marha fartő (Tafelspitz)", "Rind Kochfleisch (Hüfte) / Tafelspitz", "beef rump (Tafelspitz)", "bls:U185100", "total", 110, 2.35, 22.1, 0, 0, 1.06, 0.85, "Austrian Tafelspitz is cut from the Hüfte (rump)"),  # BLS: Rind Kochfleisch (Hüfte) roh
    "beef_boiled":        ("főtt marhahús (fartő)", "Rind Kochfleisch (Hüfte) gekocht", "boiled beef (rump)", "bls:U185132", "total", 181, 6.625, 30.3, 0, 0, 1.06, 0.85, "already cooked weight (Tiroler Gröstl uses leftover boiled beef)"),  # BLS: Rind Kochfleisch (Hüfte) gekocht
    "beef_hind_shank":    ("marha hátsó lábszár", "Rind Hinterhesse (Wadschinken)", "beef hind shank", "bls:U291100", "total", 140, 6, 21.4, 0, 0, 1.06, 0.8, "Austrian Wadschinken / Wadl"),  # BLS: Rind Hinterhesse, roh
    "beef_rostbraten":    ("marha rostélyos (Rostbraten)", "Rind Rostbraten", "beef sirloin (Rostbraten)", "bls:U175100", "total", 130, 4.45, 22.45, 0, 0, 1.05, 0.85, None),  # BLS: Rind Rostbraten, roh
    "mixed_minced":       ("vegyes darált hús (sertés-marha)", "Rind/Schwein Hackfleisch gemischt", "mixed minced beef and pork", "bls:U050100", "total", 236, 17.83, 18.8, 0, 0, 1.05, 0.8, "Austrian Faschiertes gemischt"),  # BLS: Rind/Schwein, Hackfleisch gemischt, roh
    "pork_hind_hock":     ("sertés hátsó csülök (Stelze)", "Schwein Hintereisbein/Hinterhaxe", "pork hind hock", "bls:U693100", "total", 222, 15.7, 20.12, 0, 0, 1.06, 0.8, "grams = edible part (meat, skin, fat), bone removed"),  # BLS: Schwein Hintereisbein/Hinterhaxe, roh
    "veal_shank":         ("borjúlábszár", "Kalb Haxe", "veal shank", "bls:U471100", "total", 118, 4.51, 19.3, 0, 0, 1.05, 0.8, None),  # BLS: Kalb Haxe, roh
    "veal_lung":          ("borjútüdő", "Kalb Lunge", "veal lung", "bls:V542100", "total", 90, 2.17, 17.5, 0, 0, 1.0, 0.7, None),  # BLS: Kalb Lunge, roh
    "veal_heart":         ("borjúszív", "Kalb Herz", "veal heart", "bls:V512100", "total", 109, 5.06, 15.9, 0, 0, 1.05, 0.8, None),  # BLS: Kalb Herz, roh
    "anchovy":            ("szardella", "Sardelle", "anchovy", "bls:T104100", "total", 204, 13.7, 20.1, 0, 0, 1.05, 0.8, None),  # BLS: Sardelle roh
    "trout":              ("pisztráng", "Forelle", "trout", "bls:T422100", "total", 156, 7.63, 21.552, 0, 0, 1.05, 0.8, "grams = edible part (fillet with skin)"),  # BLS: Forelle roh
    "emmentaler":         ("ementáli sajt", "Emmentaler mind. 45 % Fett i. Tr.", "Emmental cheese", "bls:M304600", "total", 374, 29.15, 27.5, 0, 0, 1.08, 0.4, None),  # BLS: Emmentaler mind. 45 % Fett i. Tr.
    "bergkaese":          ("hegyi sajt (Bergkäse)", "Bergkäse mind. 45 % Fett i. Tr.", "mountain cheese (Bergkäse)", "bls:M302600", "total", 395, 30.805, 28.9, 0, 0, 1.08, 0.4, None),  # BLS: Bergkäse mind. 45 % Fett i. Tr.
    "gouda":              ("gouda sajt", "Gouda 48 % Fett i. Tr.", "Gouda cheese", "bls:M402600", "total", 379, 31.58, 22.47, 0, 0, 1.08, 0.4, None),  # BLS: Gouda 48 % Fett i. Tr.
    "quark_lean":         ("sovány túró (Magertopfen)", "Speisequark Magerstufe", "lean quark", "bls:M713100", "total", 66, 0.18, 11.85, 3.68, 0, 1.05, 0.8, None),  # BLS: Speisequark Magerstufe, Magerquark < 10 % Fett i. Tr.
    "parsnip":            ("paszternák", "Pastinake", "parsnip", "bls:G640100", "total", 59, 0.43, 2.688, 11.83, 2.13, 1.03, 0.75, None),  # BLS: Pastinake roh
    "shallot":            ("salottahagyma", "Schalotte", "shallot", "bls:G485100", "total", 33, 0.1, 2, 8.624, 5.424, 1.0, 0.8, None),  # BLS: Schalotte roh
    "sauerrahm":          ("tejföl (Sauerrahm)", "Sauerrahm/Saure Sahne mind. 10 % Fett", "sour cream (Sauerrahm)", "bls:M172500", "total", 119, 10, 3.1, 4.1, 0, 1.02, 1.02, "Austrian Sauerrahm is sold at 15 % fat; the BLS record of the same food is 10 % (slight underestimate)"),  # BLS: Sauerrahm/Saure Sahne, mind. 10 % Fett
    "cream_36":           ("habtejszín (36%, Schlagobers)", "Schlagsahne mind. 36 % Fett", "whipping cream 36% (Schlagobers)", "bls:M173900", "total", 363, 38, 2.2, 3, 0, 1.0, 1.0, None),  # BLS: Schlagsahne mind. 36 % Fett
    "creme_fraiche":      ("crème fraîche", "Sauerrahm/Creme fraiche, 30 % Fett", "crème fraîche", "bls:M176800", "total", 265, 27.03, 2.4, 2.55, 0, 1.0, 1.0, None),  # BLS: Sauerrahm/Creme fraiche, 30 % Fett
    "chives":             ("metélőhagyma", "Schnittlauch", "chives", "bls:G081100", "total", 29, 0.74, 2.6, 4.14, 2.6, 1.0, 0.3, None),  # BLS: Schnittlauch roh
    "horseradish":        ("torma", "Meerrettich (Kren)", "horseradish", "bls:G630100", "total", 84, 0.3, 5.875, 15.957, 4.287, 1.0, 0.5, None),  # BLS: Meerrettich roh
    "cider_vinegar":      ("almaecet", "Apfelessig (Mostessig)", "cider vinegar", "bls:R123100", "total", 18, 0, 0.2, 0.147, 0, 1.01, 1.01, None),  # BLS: Apfelessig
    "wine_vinegar":       ("borecet", "Weinessig", "wine vinegar", "bls:R121000", "total", 25, 0, 0, 0, 0, 1.01, 1.01, None),  # BLS: Weinessig
    # at_knoedel_nudeln
    "chanterelle":        ("rókagomba", "Pfifferling (Eierschwammerl)", "chanterelle", "bls:K713100", "total", 26, 0.271, 3.91, 3.821, 3.27, 0.95, 0.5, None),  # BLS: Pfifferling roh
    "sour_milk_cheese":   ("savanyútej-sajt (Graukäse)", "Sauermilchkäse < 10 % Fett i. Tr. (Graukäse)", "sour-milk cheese (Graukäse)", "bls:M730100", "total", 128, 0.473, 30.031, 0, 0, 1.08, 0.5, "Tyrolean Graukäse is a low-fat Sauermilchkäse"),  # BLS: Sauermilchkäse < 10 % Fett i. Tr.
    "veg_bouillon_powder":("zöldségleveskocka / -por", "Gemüse Bouillon (Brühwürfel, Pulver)", "vegetable bouillon cube/powder", "bls:R821000", "total", 195, 5.8, 5.82, 30.81, 2.9, 1.0, 1.0, "values per 100 g powder; Austrian 'Gemüsesuppe (klar)' from a cube = ~2 g per 100 ml (1 Würfel per 0,5 l)"),  # BLS: Gemüse Bouillon/Brühe/Suppe (Brühwürfel, Pulver)
    "chicken_bouillon_powder":("csirke leveskocka / -por", "Hühner Bouillon (Brühwürfel, Pulver)", "chicken bouillon cube/powder", "bls:R822000", "total", 201, 4.3, 6.96, 33.53, 0.78, 1.0, 1.0, "values per 100 g powder; ~2 g per 100 ml"),  # BLS: Hühner Bouillon/Brühe/Suppe (Brühwürfel, Pulver)
    "red_cabbage":        ("vöröskáposzta", "Rotkohl (Rotkraut, Blaukraut)", "red cabbage", "bls:G341100", "total", 28, 0.18, 1.563, 6.232, 2.5, 1.0, 0.45, None),  # BLS: Rotkohl roh
    # at_suppen
    "calf_liver":         ("borjúmáj", "Kalb Leber", "calf liver", "bls:V532100", "total", 86, 1.15, 14.9, 4.1, 0, 1.05, 0.8, None),  # BLS: Kalb Leber, roh
    "durum_semolina":     ("durumbúzadara", "Hartweizengrieß", "durum wheat semolina", "bls:C219300", "total", 352, 1.48, 13.36, 73.76, 4.84, 1.4, 0.7, None),  # BLS: Hartweizen Grieß
    "pumpkin_seeds":      ("tökmag", "Kürbiskern", "pumpkin seeds", "bls:H310100", "total", 588, 46.34, 35.49, 11.47, 8.66, 1.0, 0.55, None),  # BLS: Kürbiskern
    "pumpkin_seed_oil":   ("tökmagolaj", "Kürbiskernöl", "pumpkin seed oil", "bls:Q250000", "total", 900, 100, 0, 0, 0, 0.92, 0.92, "Styrian Kürbiskernöl"),  # BLS: Kürbiskernöl
    "porcini_dried":      ("szárított vargánya", "Steinpilz getrocknet", "dried porcini", "bls:K718400", "total", 270, 2.332, 31.479, 54.153, 35.093, 1.0, 0.3, None),  # BLS: Steinpilz getrocknet
    # at_mehlspeisen
    "almond":             ("mandula (darált)", "Mandel süß", "almond (ground)", "bls:H210100", "total", 544, 46.6, 22.333, 13.87, 10, 1.0, 0.45, None),  # BLS: Mandel süß
    "hazelnut":           ("mogyoró (darált)", "Haselnuss", "hazelnut (ground)", "bls:H130100", "total", 667, 63.3, 16.25, 11.8, 7.6, 1.0, 0.45, None),  # BLS: Haselnuss
    "apricot":            ("sárgabarack (Marille)", "Aprikose (Marille)", "apricot", "bls:F201100", "total", 42, 0.13, 0.8, 9.76, 1.54, 1.0, 0.6, "grams = pitted"),  # BLS: Aprikose roh
    "marzipan":           ("marcipán (nyersmassza)", "Marzipan Rohmasse", "marzipan paste", "bls:S421000", "total", 415, 24.9, 8, 42.198, 4.988, 1.2, 1.2, None),  # BLS: Marzipan Rohmasse
    "pudding_powder_vanilla":("vaníliás pudingpor", "Puddingpulver Vanille, ungezuckert", "vanilla custard powder", "bls:R481100", "total", 344, 0.079, 0.426, 85.899, 0.988, 1.0, 0.6, None),  # BLS: Puddingpulver Vanille, ungezuckert
    "sacher_glaze":       ("csokoládémáz (Sacher)", "Sacherguss/Schokoladenglasur", "chocolate glaze", "bls:R9A5100", "total", 345, 15.75, 3.31, 49.6, 4.2, 1.3, 1.3, None),  # BLS: Sacherguss/Schokoladenglasur, für Gebäck/Torten
    "toast_bread":        ("toastkenyér", "Weizentoastbrot/Buttertoastbrot", "white toast bread", "bls:B314000", "total", 261, 3.59, 8.29, 50.747, 3.947, 0.3, 0.3, None),  # BLS: Weizentoastbrot/Buttertoastbrot
    "egg_white":          ("tojásfehérje", "Hühnerei Eiklar", "egg white", "bls:E113100", "total", 42, 0.03, 9.9, 0.41, 0, 1.03, 1.03, "1 egg white ~33 g"),  # BLS: Hühnerei Eiklar, roh
    "fondant":            ("fondán", "Fondant (Fondantmasse)", "fondant icing", "bls:S351000", "total", 339, 3.1, 0.7, 77, 0, 1.4, 1.4, None),  # BLS: Fondant (Fondantmasse)
}

# Keys whose fat renders out when meat is roasted, pan-fried or grilled
# (common.FAT_RETENTION): every BLS meat, poultry/offal and sausage record
# (groups U, V, W) plus the USDA meat records below.
RENDERS_FAT_USDA = ("beef_shank", "pork_shoulder")


def renders_fat(key):
    ref = FOOD_KEYS[key][3]
    return (ref.startswith("bls:") and ref[4] in "UVW") or key in RENDERS_FAT_USDA
