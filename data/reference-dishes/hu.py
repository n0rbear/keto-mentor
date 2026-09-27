"""Hungary (HU): reference dishes.

The 10 pilot dishes (2026-09-26), then phase 2 (2026-09-27): the full Hungarian
set. INVENTORY lists the phase-2 dishes still to build; a dish leaves it when
its PARTS/DISHES entry (two dated sources, catalog-linked ingredients) lands.
"""
from common import g, ing, src, srcs

# The pilot sources were read when the pilot was built (commit ac4416d).
PILOT_RETRIEVED = "2026-09-26"

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
PARTS = {
    "gulyasleves": dict(
        names={"hu": "Gulyásleves", "de": "Gulaschsuppe", "en": "Hungarian goulash soup"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("beef_shank", 600), ing("potato", 600), ing("onion", 250), ing("carrot", 200), ing("parsley_root", 100),
                     ing("wax_pepper", 100), ing("tomato", 100), ing("lard", 30, "fat"), ing("paprika_ground", 10, "seasoning"),
                     ing("garlic", 10, "seasoning"), ing("caraway_seed", 2, "seasoning"), ing("water", 2200, "liquid")],
        cooking=dict(method="simmer ~2 h, partly covered", mass_change_g=-400, note="~18% of the added water evaporates; meat juices stay in the soup"),
        sources=srcs(PILOT_RETRIEVED, ["https://www.mindmegette.hu/recept/hagyomanyos-gulyasleves-a-nagyi-is-igy-csinalta", "https://streetkitchen.hu/receptek/klasszikus-gulyasleves"])),
    "halaszle": dict(
        names={"hu": "Halászlé (passzírozott alappal)", "de": "Ungarische Fischsuppe", "en": "Hungarian fisherman's soup"},
        matrix="liquid", servings_source=4, standard_serving_g=500,
        ingredients=[ing("carp", 800, note="edible part of ~1 kg carp steaks"), ing("onion", 300), ing("wax_pepper", 120), ing("tomato", 150),
                     ing("paprika_ground", 16, "seasoning"), ing("hot_pepper_fresh", 20, "seasoning"), ing("garlic", 10, "seasoning"), ing("water", 3000, "liquid")],
        not_eaten=[{"what": "halfej, farok, szálkás maradék alaplének", "raw_g": 1000, "note": "stock only, strained out; its small protein/fat transfer into the broth is ignored (slight underestimate)"}],
        cooking=dict(method="stock boiled ~1 h, strained with the vegetables; fish boiled 20 min on high heat", mass_change_g=-900, note="hard boil: ~30% of the water evaporates"),
        sources=srcs(PILOT_RETRIEVED, ["https://www.mindmegette.hu/recept/halaszle-eredeti", "https://terebess.hu/tiszaorveny/recept/halaszle.html"])),
    "toltott_kaposzta": dict(
        names={"hu": "Töltött káposzta", "de": "Ungarisches gefülltes Kraut (Krautwickel)", "en": "Hungarian stuffed cabbage"},
        matrix="liquid", servings_source=6, standard_serving_g=450,
        ingredients=[ing("sauerkraut", 1500, note="~400 g whole leaves + ~1100 g shredded"), ing("pork_minced", 800), ing("rice_white", 120, note="raw; cooks inside the filling"),
                     ing("onion", 150), ing("garlic", 10, "seasoning"), ing("egg", 50), ing("smoked_sausage", 200), ing("smoked_bacon", 150),
                     ing("lard", 20, "fat"), ing("paprika_ground", 12, "seasoning"), ing("wheat_flour", 25, "thickener"), ing("sour_cream", 200, "thickener"),
                     ing("water", 1200, "liquid")],
        cooking=dict(method="layered, simmered ~2.5 h covered, thickened with flour + sour cream", mass_change_g=-250, note="covered pot, low evaporation; rice absorbs broth inside the rolls (no mass change)"),
        sources=srcs(PILOT_RETRIEVED, ["https://sobors.hu/receptek/toltott-kaposzta-savanyu-kaposztabol-recept/", "https://www.mindmegette.hu/recept/klasszikus-toltott-kaposzta", "https://streetkitchen.hu/receptek/klasszikus-csaladi-toltott-kaposzta"])),
    "paprikas_csirke": dict(
        names={"hu": "Paprikás csirke", "de": "Paprikahuhn", "en": "Chicken paprikash"},
        matrix="liquid", servings_source=4, standard_serving_g=300,
        ingredients=[ing("chicken_thigh_skin", 1000, note="edible part of ~1.4 kg bone-in thighs"), ing("onion", 200), ing("sunflower_oil", 30, "fat"),
                     ing("paprika_ground", 15, "seasoning"), ing("wax_pepper", 100), ing("tomato", 100), ing("water", 400, "liquid"),
                     ing("sour_cream", 250, "thickener"), ing("wheat_flour", 20, "thickener")],
        cooking=dict(method="braised ~45 min covered, thickened with sour cream + flour", mass_change_g=-150, note="chicken juices go into the sauce"),
        flat_plate=dict(coverage=0.40, height_cm=2.0),
        sources=srcs(PILOT_RETRIEVED, ["https://www.mindmegette.hu/recept/szaftos-paprikas-csirke-nokedlivel", "https://sobors.hu/receptek/tejfolos-csirkepaprikas-recept/"])),
    "nokedli": dict(
        names={"hu": "Nokedli", "de": "Nockerln / Spätzle", "en": "Hungarian dumplings (nokedli)"},
        matrix="dry", bulk_density_g_ml=0.75, servings_source=4, standard_serving_g=200,
        ingredients=[ing("wheat_flour", 400), ing("egg", 150, note="3 eggs"), ing("water", 250, "liquid")],
        cooking=dict(method="dough boiled in salted water, drained", mass_change_g=120, note="boiled dumplings absorb ~15% water"),
        flat_plate=dict(coverage=0.35, height_cm=2.5),
        sources=srcs(PILOT_RETRIEVED, ["https://www.mindmegette.hu/recept/paprikas-csirke-nokedli"])),
    "sertesporkolt": dict(
        names={"hu": "Sertéspörkölt", "de": "Ungarisches Schweinepörkölt (Schweinegulasch)", "en": "Hungarian pork stew (pörkölt)"},
        matrix="liquid", servings_source=4, standard_serving_g=300,
        ingredients=[ing("pork_shoulder", 1000), ing("onion", 300), ing("lard", 30, "fat"), ing("paprika_ground", 15, "seasoning"),
                     ing("wax_pepper", 100), ing("tomato", 100), ing("garlic", 10, "seasoning"), ing("caraway_seed", 1, "seasoning"), ing("water", 400, "liquid")],
        cooking=dict(method="stewed ~1.5-2 h, water added little by little, reduced to a thick sauce", mass_change_g=-600, note="pörkölt is reduced hard: the meat's own water and most added water evaporate"),
        flat_plate=dict(coverage=0.45, height_cm=2.0),
        sources=srcs(PILOT_RETRIEVED, ["https://www.mindmegette.hu/recept/klasszikus-sertesporkolt", "https://streetkitchen.hu/receptek/a-tokeletes-sertesporkolt"])),
    "lecso_virslivel": dict(
        names={"hu": "Lecsó virslivel", "de": "Letscho mit Wiener Würstchen", "en": "Hungarian lecsó with frankfurters"},
        matrix="liquid", servings_source=4, standard_serving_g=400,
        ingredients=[ing("wax_pepper", 800), ing("tomato", 400), ing("onion", 150), ing("frankfurter", 400, note="4 pár virsli"),
                     ing("lard", 30, "fat"), ing("paprika_ground", 6, "seasoning"), ing("garlic", 6, "seasoning")],
        cooking=dict(method="stewed ~25 min", mass_change_g=-200, note="vegetables release water; part of it evaporates"),
        flat_plate=dict(coverage=0.75, height_cm=1.6),
        sources=srcs(PILOT_RETRIEVED, ["https://sobors.hu/receptek/lecso-virslivel-recept/", "https://sobors.hu/receptek/virslis-lecso-recept/"])),
    "rakott_krumpli": dict(
        names={"hu": "Rakott krumpli", "de": "Ungarischer Kartoffelauflauf", "en": "Hungarian layered potato casserole"},
        matrix="solid", servings_source=4, standard_serving_g=400,
        ingredients=[ing("potato", 900, note="peeled weight; boiled in skin first"), ing("egg", 300, note="6 hard-boiled eggs"), ing("smoked_sausage", 200),
                     ing("sour_cream", 400), ing("butter", 20, "fat")],
        cooking=dict(method="layered, baked 45-50 min at 180 °C", mass_change_g=-140, note="~8% baking loss"),
        flat_plate=dict(coverage=0.35, height_cm=3.2),
        sources=srcs(PILOT_RETRIEVED, ["https://streetkitchen.hu/receptek/szaftos-rakott-krumpli", "https://www.mindmegette.hu/recept/rakott-krumpli"])),
    "marhahusleves": dict(
        names={"hu": "Marhahúsleves (hússal, zöldséggel)", "de": "Ungarische Rindfleischsuppe", "en": "Hungarian beef soup"},
        matrix="liquid", servings_source=6, standard_serving_g=450,
        ingredients=[ing("beef_shank", 800), ing("carrot", 300), ing("parsley_root", 200), ing("celeriac", 100), ing("kohlrabi", 150),
                     ing("onion", 100), ing("garlic", 5, "seasoning"), ing("water", 3500, "liquid")],
        not_eaten=[{"what": "velőscsont", "raw_g": 500, "note": "stock only; marrow fat transfer ignored"}],
        cooking=dict(method="very slow simmer 3-4 h", mass_change_g=-900, note="~25% of the water evaporates"),
        sources=srcs(PILOT_RETRIEVED, ["https://falatozz.hu/recept/marhahusleves", "https://mamakonyhaja.hu/receptek/marhahus-leves/"])),
    "rantott_hus": dict(
        names={"hu": "Rántott hús (sertéskaraj)", "de": "Paniertes Schweineschnitzel", "en": "Breaded pork cutlet"},
        matrix="dry", bulk_density_g_ml=0.85, servings_source=4, standard_serving_g=185,
        ingredients=[ing("pork_loin", 600, note="4 x 150 g slices"), ing("wheat_flour", 30, "coating", "amount that sticks, not the amount put out"),
                     ing("egg", 100, "coating", "2 eggs, amount that sticks"), ing("breadcrumbs", 100, "coating", "amount that sticks (~150 g put out)"),
                     ing("sunflower_oil", 60, "absorbed_fat", "absorbed during deep/shallow frying, ~8% of the breaded weight")],
        cooking=dict(method="fried in 170-180 °C oil, 2-3 min per side", mass_change_g=-150, note="meat loses ~25% of its weight as water while frying"),
        flat_plate=dict(coverage=0.35, height_cm=1.8),
        sources=srcs(PILOT_RETRIEVED, ["https://foodandwine.hu/2010/10/05/a-rantott-szelet-keszitesenek-10-titka/", "https://kemenytojas.com/receptek/rantott-hus/"])),
    "petrezselymes_burgonya": dict(
        names={"hu": "Petrezselymes burgonya", "de": "Petersilienkartoffeln", "en": "Parsley potatoes"},
        matrix="dry", bulk_density_g_ml=0.70, servings_source=4, standard_serving_g=200,
        ingredients=[ing("potato", 1000), ing("butter", 40, "fat"), ing("parsley_leaf", 10, "garnish")],
        cooking=dict(method="boiled, tossed with butter and parsley", mass_change_g=-20, note="boiled potato keeps ~98% of its weight"),
        flat_plate=dict(coverage=0.35, height_cm=2.5),
        sources=srcs(PILOT_RETRIEVED, ["https://falatozz.hu/recept/petrezselymes-burgonya", "https://streetkitchen.hu/receptek/klasszik-petrezselymes-burgonya"])),
    "parolt_rizs": dict(
        names={"hu": "Párolt rizs", "de": "Gedünsteter Reis", "en": "Steamed rice"},
        matrix="dry", bulk_density_g_ml=0.80, servings_source=4, standard_serving_g=180,
        ingredients=[ing("rice_white", 250), ing("sunflower_oil", 15, "fat"), ing("onion", 30), ing("water", 600, "liquid", "2 volumes water to 1 volume rice (250 g rice ~ 3 dl)")],
        cooking=dict(method="toasted in oil, steamed covered", mass_change_g=-60, note="rice absorbs almost all water; a little evaporates"),
        flat_plate=dict(coverage=0.35, height_cm=2.2),
        sources=srcs(PILOT_RETRIEVED, ["https://tesco.hu/hello/receptek/parolt-rizs/278828/", "https://borralfozok.hu/a-tokeletes-parolt-rizs/"])),
    "szekelykaposzta": dict(
        names={"hu": "Székelykáposzta", "de": "Szegediner Gulasch", "en": "Székely cabbage (pork and sauerkraut stew)"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("pork_shoulder", 1000), ing("sauerkraut", 1000), ing("sour_cream", 400, "thickener"), ing("lard", 15, "fat"),
                     ing("onion", 200), ing("paprika_ground", 15, "seasoning"), ing("garlic", 6, "seasoning"), ing("caraway_seed", 1, "seasoning"),
                     ing("wheat_flour", 20, "thickener"), ing("water", 800, "liquid")],
        cooking=dict(method="stewed ~1.5 h covered, thickened with sour cream", mass_change_g=-250, note="covered pot, moderate evaporation"),
        sources=srcs(PILOT_RETRIEVED, ["https://www.mindmegette.hu/recept/szekelykaposzta", "https://magyarkonyhaonline.hu/receptek/a-legfinomabb-szekelykaposzta"])),
}

# ---------------------------------------------------------------------------
# 3. Dishes (what the user says). A dish = parts; a side is a separate part
# so "rántott hús rizzsel" and "rántott hús krumplival" both work.
# served_in: default vessel. Soups are deep-plate only.
# ---------------------------------------------------------------------------
DISHES = [
    dict(id="hu_gulyasleves", countries=["HU"], category="traditional", part_refs=[("gulyasleves", 450)], served_in="deep_plate", tags=["soup", "traditional"],
         aliases={"hu": ["gulyásleves", "gulyás", "marhagulyás", "gulyás leves"], "de": ["gulaschsuppe", "gulyassuppe"], "en": ["goulash soup", "hungarian goulash"]}),
    dict(id="hu_halaszle", countries=["HU"], category="traditional", part_refs=[("halaszle", 500)], served_in="deep_plate", tags=["soup", "traditional", "fish"],
         aliases={"hu": ["halászlé", "szegedi halászlé", "halaszle"], "de": ["fischsuppe", "ungarische fischsuppe"], "en": ["fisherman's soup", "hungarian fish soup"]},
         review="Bajai (filézett, gyufatésztával) változat külön étel legyen: más a tészta és nincs passzírozott alap."),
    dict(id="hu_toltott_kaposzta", countries=["HU"], category="traditional", part_refs=[("toltott_kaposzta", 450)], served_in="deep_plate", tags=["traditional"],
         optional_toppings=[{"food_key": "sour_cream", "g": 40, "hu": "tejföl a tetejére"}],
         aliases={"hu": ["töltött káposzta", "toltott kaposzta"], "de": ["krautwickel", "gefülltes kraut"], "en": ["stuffed cabbage"]}),
    dict(id="hu_paprikas_csirke_nokedlivel", countries=["HU"], category="traditional", part_refs=[("paprikas_csirke", 300), ("nokedli", 200)],
         names={"hu": "Paprikás csirke nokedlivel", "de": "Paprikahuhn mit Nockerln", "en": "Chicken paprikash with dumplings"}, served_in="flat_plate", tags=["traditional"],
         aliases={"hu": ["paprikás csirke nokedlivel", "csirkepaprikás nokedlivel", "paprikás csirke galuskával"], "de": ["paprikahuhn mit nockerln", "paprikahendl"], "en": ["chicken paprikash with dumplings"]}),
    dict(id="hu_sertesporkolt", countries=["HU"], category="traditional", part_refs=[("sertesporkolt", 300)], served_in="flat_plate", tags=["traditional", "low-carb-friendly"],
         side_options=[("nokedli", 200), ("petrezselymes_burgonya", 200), ("parolt_rizs", 180)],
         aliases={"hu": ["sertéspörkölt", "pörkölt", "disznópörkölt"], "de": ["schweinegulasch", "schweinepörkölt"], "en": ["pork stew", "pork pörkölt"]},
         alias_side={"sertéspörkölt nokedlivel": "nokedli", "pörkölt nokedlivel": "nokedli", "sertéspörkölt galuskával": "nokedli", "pörkölt krumplival": "petrezselymes_burgonya", "pörkölt rizzsel": "parolt_rizs"}),
    dict(id="hu_lecso_virslivel", countries=["HU"], category="everyday", part_refs=[("lecso_virslivel", 400)], served_in="deep_plate", tags=["traditional", "lower-carb"],
         aliases={"hu": ["lecsó virslivel", "virslis lecsó", "lecsó"], "de": ["letscho mit würstchen"], "en": ["lecso with sausage"]},
         review="A sima 'lecsó' alias csak akkor jó, ha nincs külön virsli nélküli lecsó étel; később szétválasztandó."),
    dict(id="hu_rakott_krumpli", countries=["HU"], category="everyday", part_refs=[("rakott_krumpli", 400)], served_in="flat_plate", tags=["traditional", "higher-carb"],
         aliases={"hu": ["rakott krumpli", "rakott burgonya"], "de": ["kartoffelauflauf ungarisch"], "en": ["layered potato casserole"]}),
    dict(id="hu_marhahusleves", countries=["HU"], category="traditional", part_refs=[("marhahusleves", 450)], served_in="deep_plate", tags=["soup", "traditional", "low-carb-friendly"],
         aliases={"hu": ["marhahúsleves", "húsleves", "marha húsleves"], "de": ["rindfleischsuppe", "rindsuppe"], "en": ["beef soup", "beef broth"]},
         review="Gyakran cérnametélttel eszik és a főtt hús külön kerül a tányérra; a 'csak leve' és a 'tésztával' változat későbbi bővítés."),
    dict(id="hu_rantott_hus", countries=["HU"], category="everyday", part_refs=[("rantott_hus", 185)], served_in="flat_plate", tags=["traditional", "fried"],
         side_options=[("petrezselymes_burgonya", 200), ("parolt_rizs", 180)], default_side=None,
         aliases={"hu": ["rántott hús", "rántott szelet", "bécsi szelet", "rántotthús"], "de": ["schnitzel", "wiener schnitzel vom schwein"], "en": ["breaded cutlet", "pork schnitzel"]},
         alias_side={"rántott hús krumplival": "petrezselymes_burgonya", "rántott hús petrezselymes krumplival": "petrezselymes_burgonya", "rántott hús rizzsel": "parolt_rizs"},
         review="A 'körettel' szó nem dönt a köretről: ha a felhasználó nem mondja meg, a rendszer kérdezzen (burgonya / rizs), ne találgasson. A hasábburgonya és a burgonyapüré későbbi köret."),
    dict(id="hu_szekelykaposzta", countries=["HU"], category="traditional", part_refs=[("szekelykaposzta", 450)], served_in="deep_plate", tags=["traditional", "low-carb-friendly"],
         aliases={"hu": ["székelykáposzta", "székely káposzta", "székelygulyás"], "de": ["szegediner gulasch", "szegediner"], "en": ["szekely goulash", "pork and sauerkraut stew"]}),
]

SIDE_WITH = {
    "nokedli": {"hu": "nokedlivel", "de": "mit Nockerln", "en": "with dumplings"},
    "petrezselymes_burgonya": {"hu": "petrezselymes burgonyával", "de": "mit Petersilienkartoffeln", "en": "with parsley potatoes"},
    "parolt_rizs": {"hu": "párolt rizzsel", "de": "mit Reis", "en": "with rice"},
}

# Phase-2 inventory. These are reviewable dish identities, not nutrition data.
# A row is promoted into PARTS/DISHES only after all ingredients resolve to an
# authoritative record in foods.py; unresolved rows are emitted to the HU gap report.
INVENTORY = {
    "traditional": "körömpörkölt|juhászos tokány".split("|"),
    "everyday": "tepertős pogácsa".split("|"),
    "street_food": [],
}
MISSING_FOODS = [
    dict(food_key="tarragon_dried", names={"hu": "tárkony (szárított)", "de": "Estragon getrocknet", "en": "dried tarragon"},
         needed_for=["hu_palocleves (1 ek per 5 adag, seasoning)"],
         note="BLS 4.0 has no Estragon record and the production catalog has none; left out of the batch (about 2 g). Candidate: USDA FDC 'Spices, tarragon, dried' via a reviewed import."),
]

PHASE2_RETRIEVED = "2026-09-27"

PILOT_DISH_IDS = ("hu_gulyasleves", "hu_halaszle", "hu_toltott_kaposzta", "hu_paprikas_csirke_nokedlivel", "hu_sertesporkolt",
                  "hu_lecso_virslivel", "hu_rakott_krumpli", "hu_marhahusleves", "hu_rantott_hus", "hu_szekelykaposzta")

PARTS.update({
    "palocleves": dict(
        names={"hu": "Palócleves", "de": "Palóc-Suppe", "en": "Palóc soup"},
        matrix="liquid", servings_source=5, standard_serving_g=450,
        ingredients=[ing("sunflower_oil", g(0.5, "dl_oil"), "fat", "0,5 dl olaj"), ing("onion", g(1, "db_onion"), note="1 db"), ing("garlic", g(3, "gerezd_garlic"), note="3 gerezd"),
                     ing("pork_shoulder", 300), ing("paprika_ground", g(1, "ek_paprika"), "seasoning", "1 ek"), ing("wax_pepper", g(1, "db_green_pepper"), note="1 db zöldpaprika"),
                     ing("tomato", g(1, "db_tomato"), note="1 db"), ing("green_bean", 300), ing("potato", 200), ing("caraway_seed", 0.5, "seasoning", "1 csipet"),
                     ing("sour_cream", g(3, "dl_sour_cream"), "thickener", "3 dl"), ing("wheat_flour", g(2, "ek_flour"), "thickener", "2 ek"),
                     ing("parsley_leaf", 10, "seasoning", "1 csokor, apróra vágva"), ing("lemon_juice", g(0.25, "db_lemon_juice"), "seasoning", "1/4 citrom leve"),
                     ing("water", 1600, "liquid", "kb. 1,5 l a zöldbabhoz + egy kevés a hús párolásához")],
        cooking=dict(method="stew the meat covered, add beans, water, potatoes; thicken with sour cream roux", mass_change_g=-150,
                     note="about 50 min covered simmer; evaporation is an estimate. 1 ek tarragon (MISSING_FOODS) and 2 bay leaves are left out of the mass"),
        sources=[src("https://www.mindmegette.hu/recept/tarkonyos-palocleves", PHASE2_RETRIEVED, "batch recipe, 5 adag"),
                 src("https://www.mindmegette.hu/recept/palocleves", PHASE2_RETRIEVED, "cross-check: sertéscomb, zöldbab, burgonya, tejföl + liszt, 8 adag")]),
    "jokai_bableves": dict(
        names={"hu": "Jókai-bableves", "de": "Jókai-Bohnensuppe", "en": "Jókai bean soup"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("dry_bean", 400, note="40 dkg bab, dry weight, soaked overnight (Street Kitchen: 500 g)"),
                     ing("smoked_pork_hock", 550, note="edible part of 1 kg bone-in smoked hock (both sources: 1 kg); ~55% edible share is an estimate"),
                     ing("smoked_sausage", 100, note="10 dkg füstölt kolbász (Street Kitchen: 150 g)"), ing("onion", g(1, "db_onion"), note="1 fej"),
                     ing("garlic", g(2, "gerezd_garlic"), "seasoning", "2 gerezd"), ing("carrot", 150), ing("parsley_root", 150),
                     ing("sunflower_oil", g(1, "ek_oil"), "fat", "1 ek, rántás"), ing("wheat_flour", g(2, "ek_flour"), "thickener", "2 ek, rántás"),
                     ing("paprika_ground", g(1, "mk_spice"), "seasoning", "1 mokkáskanál"), ing("parsley_leaf", 10, "garnish"),
                     ing("wheat_flour", 100, note="csipetke: 10 dkg liszt"), ing("egg", g(1, "db_egg"), note="csipetke: 1 tojás"),
                     ing("water", 2000, "liquid", "the hock's cooking water ('annyi, hogy ellepje') is the soup base")],
        cooking=dict(method="hock cooked soft, beans and roots simmered in its broth, roux and csipetke at the end", mass_change_g=150,
                     note="about +450 g water taken up by the dry beans, about -300 g evaporation over the long simmer (estimates)"),
        sources=[src("https://www.mindmegette.hu/recept/jokai-bableves-fustolt-csulokkel", PHASE2_RETRIEVED, "batch recipe, 4 adag"),
                 src("https://streetkitchen.hu/receptek/a-klasszikus-jokai-bableves", PHASE2_RETRIEVED, "cross-check: 1 kg smoked hock, 500 g beans, 150 g sausage, csipetke")]),
})
DISHES += [
    dict(id="hu_palocleves", countries=["HU"], category="traditional", part_refs=[("palocleves", 450)], served_in="deep_plate", tags=["soup", "traditional"],
         names={"hu": "Palócleves", "de": "Palóc-Suppe", "en": "Palóc soup"},
         aliases={"hu": ["palócleves", "palóc leves", "tárkonyos palócleves"], "de": ["palóc-suppe", "palocsuppe"], "de-AT": ["palóc-suppe"], "en": ["palóc soup", "paloc soup"]},
         review="Az eredeti (Mikszáth-féle) palócleves ürühússal készül; ez a sertéslapockás hétköznapi változat. Birkahúsos változat külön rész legyen, ha lesz ürü katalógusrekord."),
    dict(id="hu_jokai_bableves", countries=["HU"], category="traditional", part_refs=[("jokai_bableves", 450)], served_in="deep_plate", tags=["soup", "traditional"],
         names={"hu": "Jókai-bableves", "de": "Jókai-Bohnensuppe", "en": "Jókai bean soup"},
         aliases={"hu": ["jókai-bableves", "jókai bableves", "jokai bableves", "csülkös bableves"], "de": ["jókai-bohnensuppe", "ungarische bohnensuppe mit eisbein"], "de-AT": ["jókai-bohnensuppe"], "en": ["jókai bean soup", "jokai bean soup"]}),
]

# Phase-2 dishes live in one module per group (hu_*.py), each with the same
# PARTS / DISHES / MISSING layout as above.
PHASE2_MODULES = ('hu_street_food', 'hu_hetkoznapi', 'hu_reggeli_pekaru', 'hu_husetelek', 'hu_tesztak_edessegek', 'hu_levesek', )
for _name in PHASE2_MODULES:
    _m = __import__(_name)
    _clash = PARTS.keys() & _m.PARTS.keys()
    if _clash:
        raise SystemExit(f"{_name}: part ids already defined: {sorted(_clash)}")
    PARTS.update(_m.PARTS)
    DISHES += _m.DISHES
    MISSING_FOODS += getattr(_m, "MISSING", [])
