"""Austria phase 3: Knödel, Nockerl, Nudeln and other flour-and-cheese mains
(sources read 2026-10-05)."""
from common import boiled_uptake, g, ing, src

R = "2026-10-05"
GK = "https://www.gutekueche.at/"
IK = "https://www.ichkoche.at/"


def broth(powder_key, ml, note):
    """Austrian 'klare Suppe' made from a cube/powder: 1 Würfel (~10 g) per 0,5 l,
    i.e. 2 g powder per 100 ml (pack instruction; estimate)."""
    return [ing(powder_key, round(ml * 0.02, 1), "seasoning", note + " - bouillon powder, 2 g per 100 ml (1 Würfel / 0,5 l, estimate)"),
            ing("water", ml, "liquid", note + " - water")]


PARTS = {
    "kaerntner_kasnudeln": dict(
        names={"hu": "Karintiai túrós-burgonyás derelye (Kasnudeln)", "de": "Kärntner Kasnudeln", "de-AT": "Kärntner Kasnudeln", "en": "Carinthian cheese and potato dumplings (Kasnudeln)"},
        matrix="dry", bulk_density_g_ml=0.70, servings_source=4, standard_serving_g=300,
        ingredients=[ing("wheat_flour", 250, note="250 g Mehl (glatt)"), ing("egg", g(1, "db_egg"), note="1 Ei"), ing("milk_whole", g(6, "ek_milk"), "liquid", "6 EL Milch"),
                     ing("water", 15, "liquid", "1 EL Wasser"), ing("potato", 500, note="500 g Kartoffeln, boiled and mashed for the filling"),
                     ing("quark_20", 250, note="250 g Topfen (grob, bröselig)"), ing("onion", 120, note="2 Stk Zwiebel (klein); 60 g each is an estimate"),
                     ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Knoblauchzehe"), ing("parsley_leaf", 10, "seasoning", "1 Bund Petersilie; 10 g is an estimate"),
                     ing("butter", 40, "fat", "40 g Butter (onions sweated, poured over)")],
        cooking=dict(method="filled half-moon dumplings, crimped ('gekrendelt'), simmered ~10-15 min, served with brown butter", mass_change_g=60,
                     note="estimate: boiled dough takes up ~5 % water; salt left out (the cross-check sources add mint and chervil, which have no catalog record)"),
        flat_plate=dict(coverage=0.35, height_cm=3.0),
        sources=[src(GK + "kaerntner-kasnudeln-rezept-1790", R, "batch recipe: 250 g Mehl, 1 Ei, 6 EL Milch, 500 g Kartoffeln, 250 g Topfen, 2 kleine Zwiebeln, 40 g Butter, Petersilie, 4 Portionen"),
                 src(IK + "kaerntner-kasnudeln-rezept-96590", R, "cross-check: 350 g Mehl, 2 Eier, 120 g Erdäpfel, 250 g Topfen, 2 EL Sauerrahm, Minze, Kerbel, 4 Portionen"),
                 src(GK + "kasnudeln-rezept-20655", R, "cross-check: 450 g Mehl, 3 Eier, 3 Dotter, 300 g Erdäpfel, 600 g Topfen, 150 g Butter, Kerbel, Schnittlauch, 6 Portionen")]),
    "kasnocken": dict(
        names={"hu": "Sajtos galuska (Pinzgauer Kasnocken)", "de": "Kasnocken (Käsespätzle Pinzgauer Art)", "de-AT": "Pinzgauer Kasnocken", "en": "Austrian cheese dumplings (Kasnocken)"},
        matrix="dry", bulk_density_g_ml=0.75, servings_source=4, standard_serving_g=330,
        ingredients=[ing("wheat_flour", 400, note="400 g Mehl"), ing("egg", g(2, "db_egg"), note="2 Eier"), ing("milk_whole", g(2.5, "dl_milk"), "liquid", "250 ml Milch"),
                     ing("bergkaese", 300, note="300 g Bergkäse"), ing("butter", 60, "fat", "60 g Butter"), ing("lard", 60, "fat", "60 g Schmalz"),
                     ing("chives", 5, "garnish", "1 Prise Schnittlauch; 5 g is an estimate")],
        cooking=dict(method="Nockerl dough boiled, tossed in a pan with Schmalz, butter and cheese until melted", mass_change_g=120,
                     note="estimate: the boiled dough takes up ~15 % water (as nokedli); salt left out. Fried onions are a common topping but not in this source"),
        flat_plate=dict(coverage=0.40, height_cm=3.0),
        sources=[src(GK + "kasnocken-rezept-7647", R, "batch recipe: 400 g Mehl, 2 Eier, 250 ml Milch, 300 g Bergkäse, 60 g Butter, 60 g Schmalz, Schnittlauch, 4 Portionen"),
                 src(IK + "kasnocken-rezept-1675", R, "cross-check: 300 g Nockerlteig, 1 kleine Zwiebel, 50 g Butter, 100 g Pinzgauer Käse, Schnittlauch, 4 Portionen"),
                 src(GK + "kasnocken-rezept-9368", R, "cross-check: 0,5 kg Mehl, 4 Eier, 150 g Bergkäse, 0,125 l Suppe, 4 Portionen")]),
    "kaesespaetzle": dict(
        names={"hu": "Sajtos nokedli (Käsespätzle, Käsknöpfle)", "de": "Käsespätzle", "de-AT": "Käsespätzle (Vorarlberger Käsknöpfle)", "en": "Cheese spätzle"},
        matrix="dry", bulk_density_g_ml=0.75, servings_source=4, standard_serving_g=280,
        ingredients=[ing("wheat_flour", 300, note="300 g Mehl"), ing("egg", g(3, "db_egg"), note="3 Eier"), ing("milk_whole", g(1.5, "dl_milk"), "liquid", "150 ml Milch"),
                     ing("butter", 60, "fat", "60 g Butter"), ing("bergkaese", 300, note="300 g Bergkäse kräftig, gerieben"),
                     ing("clarified_butter", g(1.5, "ek_oil"), "fat", "1 1/2 EL Butterschmalz"), ing("chives", 10, "garnish", "1/2 Bund Schnittlauch; 10 g is an estimate")],
        cooking=dict(method="Spätzle pressed into boiling water, layered with grated cheese and butter", mass_change_g=90,
                     note="estimate: boiled Spätzle take up ~15 % of the dough weight in water; nutmeg (MISSING), salt, pepper left out"),
        flat_plate=dict(coverage=0.40, height_cm=3.0),
        sources=[src(IK + "kaesespaetzle-rezept-6343", R, "batch recipe: 300 g Mehl, 3 Eier, 150 ml Milch, 60 g Butter, 300 g Bergkäse, 1 1/2 EL Butterschmalz, Schnittlauch, 4 Portionen"),
                 src(GK + "kaesknoepfle-rezept-164", R, "cross-check: 1 kg Mehl, 10 Eier, 250 ml Milch, 300 g Räßkäse oder Gouda, 300 g Bergkäse, 300 g Butter, 2 Zwiebeln, 6 Portionen"),
                 src(IK + "kaesknoepfle-rezept-4444", R, "cross-check: 1/2 kg Mehl, 2-3 Eier, 300 ml Wasser, 240 g Käse, 2 EL Butterschmalz, 1-2 Zwiebeln, 4 Portionen")]),
    "krautfleckerl": dict(
        names={"hu": "Káposztás kocka (Krautfleckerl)", "de": "Krautfleckerl (Krautnudeln)", "de-AT": "Krautfleckerl", "en": "Cabbage and pasta squares (Krautfleckerl)"},
        matrix="dry", bulk_density_g_ml=0.60, servings_source=4, standard_serving_g=300,
        ingredients=[ing("egg_pasta_dry", 200, note="200 g Fleckerl, dry (Austrian Fleckerl are egg pasta)"), ing("white_cabbage", 600, note="600 g Weißkraut"),
                     ing("onion", 150, note="150 g Zwiebeln"), ing("sugar", g(1, "ek_sugar"), "seasoning", "1 EL Kristallzucker, caramelised"),
                     ing("sunflower_oil", g(2, "ek_oil"), "fat", "2 EL Öl oder Schmalz"), ing("caraway_seed", g(0.5, "tk_spice"), "seasoning", "'Kümmel', no amount; 1/2 TL is an estimate (gutekueche: 1/2 TL)")],
        cooking=dict(method="sugar caramelised, onion and cabbage braised ~30 min, mixed with the boiled Fleckerl", mass_change_g=boiled_uptake("egg_pasta_dry", 200) - 150,
                     note="drained Fleckerl from common.BOILED_YIELD (egg pasta 2.54x); the cabbage loses ~25 % water while braising (estimate); salt, pepper left out"),
        flat_plate=dict(coverage=0.40, height_cm=3.0),
        sources=[src(IK + "krautfleckerln-rezept-2000", R, "batch recipe: 200 g Fleckerl, 600 g Weißkraut, 150 g Zwiebeln, 1 EL Kristallzucker, 2 EL Öl oder Schmalz, Kümmel, 4 Portionen"),
                 src(GK + "krautfleckerl-rezept-2632", R, "cross-check: 300 g Fleckerl, 1 Weißkrautkopf ca. 600 g, 1 Zwiebel, 1 TL Zucker, 1/2 TL Kümmel, 1 EL Speckwürfel, Butter, 2 Portionen")]),
    "spinatknoedel": dict(
        names={"hu": "Spenótos gombóc (Spinatknödel)", "de": "Spinatknödel", "de-AT": "Spinatknödel", "en": "Spinach dumplings"},
        matrix="dry", bulk_density_g_ml=0.60, servings_source=2, standard_serving_g=330,
        ingredients=[ing("spinach", 500, note="500 g Blattspinat, blanched"), ing("wheat_roll", 350, note="350 g Semmelwürfel (oder altes Weißbrot) - BLS Weizenbrötchen"),
                     ing("egg", g(2, "db_egg"), note="2 Eier"), ing("milk_whole", g(1.25, "dl_milk"), "liquid", "125 ml Milch"),
                     ing("wheat_flour", g(2, "ek_flour"), "thickener", "2 EL Weizenmehl"), ing("onion", 60, note="1 Stk Zwiebel (klein); 60 g is an estimate"),
                     ing("butter", g(1, "tk_butter") + g(1, "ek_butter"), "fat", "1 TL Butter for the onion + 1 EL Butter, browned, poured over"),
                     ing("parmesan", 15, "garnish", "3 EL Parmesan frisch gerieben; 5 g per EL is an estimate")],
        cooking=dict(method="spinach-bread dough shaped into Knödel, simmered ~15 min, served with brown butter and Parmesan", mass_change_g=-150,
                     note="estimate: blanched spinach loses ~35 % water before it goes in, the dumplings take a little water back; salt left out. Portion = half the source batch (~3 Knödel)"),
        flat_plate=dict(coverage=0.35, height_cm=4.0),
        sources=[src(GK + "spinatknoedel-rezept-5086", R, "batch recipe: 500 g Blattspinat, 350 g Semmelwürfel, 2 Eier, 125 ml Milch, 2 EL Mehl, 1 kleine Zwiebel, Butter, 3 EL Parmesan, 2 Portionen"),
                 src(IK + "spinatknoedel-rezept-2664", R, "cross-check: 400 g Blattspinat, 200 g Erdäpfel, 2 Eier, 100 g Semmelbrösel, 100 g Butter zum Übergießen, 60 g Parmesan, 4 Portionen")]),
    "speckknoedel": dict(
        names={"hu": "Szalonnás zsemlegombóc (Tiroler Speckknödel)", "de": "Speckknödel", "de-AT": "Tiroler Speckknödel", "en": "Tyrolean bacon dumplings"},
        matrix="dry", bulk_density_g_ml=0.60, servings_source=4, standard_serving_g=200,
        ingredients=[ing("white_bread", 300, note="300 g Weißbrot (altbacken oder Semmelwürfel)"), ing("smoked_bacon", 100, note="100 g Speck (geräuchert)"),
                     ing("egg", g(2, "db_egg"), note="2 Eier"), ing("milk_whole", g(1.5, "dl_milk"), "liquid", "150 ml Milch"), ing("onion", 60, note="1 Stk Zwiebel (klein); estimate"),
                     ing("parsley_leaf", 10, "seasoning", "0,5 Bund Petersilie; estimate"), ing("chives", 10, "seasoning", "1 Bund Schnittlauch; estimate"),
                     ing("breadcrumbs", g(1, "ek_breadcrumbs"), "thickener", "1 EL Semmelbrösel")],
        cooking=dict(method="bread, bacon, egg-milk dough shaped into Knödel, simmered ~15 min", mass_change_g=30, note="estimate: dumplings take up ~5 % water; salt, pepper left out"),
        flat_plate=dict(coverage=0.25, height_cm=4.0),
        sources=[src(GK + "speckknoedel-rezept-2202", R, "batch recipe: 300 g Weißbrot, 100 g Speck, 2 Eier, 150 ml Milch, 1 kleine Zwiebel, Petersilie, Schnittlauch, 1 EL Brösel, 4 Portionen"),
                 src(GK + "speckknoedel-rezept-7113", R, "cross-check: 4 alte Semmeln, 200 g Selchspeck, 2 Eier, 250 ml Milch, 120 g Mehl, 50 g Fett, 6 Portionen")]),
    "kaspressknoedel": dict(
        names={"hu": "Sajtos lapított gombóc (Kaspressknödel)", "de": "Kaspressknödel", "de-AT": "Kaspressknödel", "en": "Fried cheese dumplings (Kaspressknödel)"},
        matrix="dry", bulk_density_g_ml=0.60, servings_source=4, standard_serving_g=190,
        ingredients=[ing("wheat_roll", 250, note="250 g Semmelwürfel - BLS Weizenbrötchen"), ing("egg", g(4, "db_egg"), note="4 Eier"), ing("milk_whole", 129, "liquid", "125 ml Milch (warm)"),
                     ing("sour_milk_cheese", 125, note="250 g Käse (Graukäse und Bergkäse): half Graukäse is an estimate"), ing("bergkaese", 125, note="half Bergkäse (estimate)"),
                     ing("wheat_flour", 50, note="50 g Mehl"), ing("onion", 50, note="50 g Zwiebel"), ing("butter", 50, "fat", "50 g Butter"),
                     ing("parsley_leaf", 10, "seasoning", "0,5 Bund Petersilie; estimate"), ing("chives", 10, "seasoning", "0,5 Bund Schnittlauch; estimate"),
                     ing("sunflower_oil", 30, "absorbed_fat", "3 EL Sonnenblumenöl zum Backen; ~30 g taken up is an estimate")],
        cooking=dict(method="cheese-bread dough pressed flat, fried golden on both sides", mass_change_g=-80, note="estimate: ~10 % frying loss; salt left out"),
        flat_plate=dict(coverage=0.30, height_cm=2.5),
        sources=[src(GK + "kaspressknoedel-rezept-2152", R, "batch recipe: 250 g Semmelwürfel, 4 Eier, 125 ml Milch, 250 g Käse (Graukäse und Bergkäse), 50 g Mehl, 50 g Zwiebel, 50 g Butter, 3 EL Öl, 4 Portionen"),
                 src(IK + "kaspressknoedel-rezept-1676", R, "cross-check: 4 Semmeln, 2 Eier, 250 ml Milch, 200 g Pinzgauer oder anderer Schnittkäse, 2 gekochte Erdäpfel, 1 Zwiebel, Öl, 4 Portionen")]),
    "schwammerlsauce": dict(
        names={"hu": "Tejfölös rókagomba-mártás (Schwammerlsauce)", "de": "Pfifferlingsrahmsauce", "de-AT": "Schwammerlsauce (Eierschwammerlsauce)", "en": "Chanterelle cream sauce"},
        matrix="liquid", servings_source=4, standard_serving_g=200,
        ingredients=[ing("chanterelle", 500, note="500 g Eierschwammerl, geputzt"), ing("sunflower_oil", 55, "fat", "60 ml Öl"), ing("wheat_flour", 30, "thickener", "30 g Mehl"),
                     ing("onion", g(1, "db_onion"), note="1 Zwiebel"), ing("parsley_leaf", 5, "garnish", "Petersilie; 5 g is an estimate"),
                     ing("sauerrahm", 255, "thickener", "250 ml Sauerrahm")],
        cooking=dict(method="onion and chanterelles sautéed, dusted, finished with Sauerrahm", mass_change_g=-150, note="estimate: mushrooms release ~30 % water that partly evaporates; salt left out"),
        sources=[src(IK + "schwammerlsauce-rezept-2224", R, "batch recipe: 500 g Eierschwammerl, 60 ml Öl, 30 g Mehl, 1 Zwiebel, Petersilie, 250 ml Sauerrahm, 4 Portionen"),
                 src(IK + "semmelknoedel-mit-schwammerlsauce-rezept-237614", R, "cross-check: 500 g Eierschwammerl, 1 Zwiebel, 100 ml Schlagobers, 1 EL Mehl, 100 ml Sauerrahm, Zitronensaft, 4 Portionen")]),
    "reisfleisch": dict(
        names={"hu": "Osztrák rizses hús (Serbisches Reisfleisch)", "de": "Serbisches Reisfleisch", "de-AT": "Reisfleisch (Serbisches Reisfleisch)", "en": "Austrian rice and pork stew (Reisfleisch)"},
        matrix="dry", bulk_density_g_ml=0.80, servings_source=4, standard_serving_g=380,
        ingredients=[ing("pork_shoulder", 500, note="500 g Schweinefleisch (aus der Schulter)"), ing("rice_white", 250, note="250 g Langkornreis"),
                     ing("onion", g(2, "db_onion"), note="2 Stk Zwiebel"), ing("sunflower_oil", g(2, "ek_oil"), "fat", "2 EL Sonnenblumenöl"),
                     ing("paprika_ground", g(1.5, "ek_paprika"), "seasoning", "1,5 EL Paprikapulver edelsüß"), ing("tomato_paste", g(1, "ek_tomato_paste"), "seasoning", "1 EL Tomatenmark"),
                     ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Stk Knoblauch"), ing("caraway_seed", g(1, "tk_spice"), "seasoning", "1 TL Kümmel"),
                     *broth("veg_bouillon_powder", 700, "700 ml Gemüsesuppe (klar)")],
        cooking=dict(method="meat stewed in the paprika-onion base, rice and Suppe added, cooked covered until the rice has taken up the liquid", mass_change_g=-250,
                     note="estimate: the meat loses ~25 % water, the rice takes up almost all the Suppe, a little steams off; Majoran, salt, pepper left out"),
        flat_plate=dict(coverage=0.45, height_cm=3.0),
        sources=[src(GK + "reisfleisch-rezept-3897", R, "batch recipe: 500 g Schweinsschulter, 250 g Langkornreis, 2 Zwiebeln, 2 EL Öl, 1,5 EL Paprika, 1 EL Tomatenmark, 700 ml Gemüsesuppe, 4 Portionen"),
                 src(IK + "reisfleisch-rezept-2135", R, "cross-check: 600 g Kalbsschulter, 150 g Langkornreis, 200 g Zwiebeln, 80 g Öl, 2 EL Paprika, 1 1/2 l Kalbssuppe, Reibkäse, 4 Portionen")]),
    "krautwickel": dict(
        names={"hu": "Osztrák töltött káposzta (Krautwickel, friss káposztából)", "de": "Kohlrouladen (Krautwickel)", "de-AT": "Krautwickel", "en": "Austrian cabbage rolls (Krautwickel)"},
        matrix="liquid", servings_source=7, standard_serving_g=300,
        ingredients=[ing("white_cabbage", 700, note="21 Bl Kraut; ~33 g per blanched leaf is an estimate"), ing("mixed_minced", 500, note="500 g Faschiertes"),
                     ing("egg", g(1, "db_egg"), note="1 Ei"), ing("breadcrumbs", g(1, "ek_breadcrumbs"), note="1 EL Semmelbrösel"), ing("onion", 240, note="4 Stk Zwiebel, klein; 60 g each is an estimate"),
                     ing("mustard", g(1, "tk_mustard"), "seasoning", "1 TL Senf"), ing("paprika_ground", g(1, "tk_spice"), "seasoning", "1 TL Paprikapulver"),
                     ing("ketchup", g(1, "ek_ketchup"), "seasoning", "1 EL Ketchup"), ing("sunflower_oil", g(1, "ek_oil"), "fat", "1 EL Öl"),
                     *broth("veg_bouillon_powder", 1000, "1 l Gemüsebouillon"), ing("wheat_flour", g(1, "ek_flour"), "thickener", "1 EL Mehl, zum Binden"),
                     ing("water", 150, "liquid", "150 ml Wasser, zum Binden")],
        cooking=dict(method="rolls browned, braised ~45 min in the bouillon, sauce bound with flour", mass_change_g=-700,
                     note="estimate: the meat loses ~20 % water, about half of the bouillon evaporates or is left over; Muskat (MISSING), salt, pepper left out"),
        flat_plate=dict(coverage=0.40, height_cm=3.5),
        sources=[src(GK + "krautwickel-rezept-5584", R, "batch recipe: 21 Bl Kraut, 500 g Faschiertes, 1 Ei, 1 EL Brösel, 4 kleine Zwiebeln, Senf, Paprika, Ketchup, 1 l Gemüsebouillon, 1 EL Mehl, 7 Portionen"),
                 src(IK + "krautwickel-rezept-191461", R, "cross-check: 1 Kopf Kraut, 50 dag Faschiertes, 2 Semmeln, 1 Ei, Majoran, Knoblauch, Paprika, 1 Zwiebel, 4 Portionen")]),
    "linsen_mit_speck": dict(
        names={"hu": "Szalonnás lencsefőzelék (Linsen mit Speck)", "de": "Linsen mit Speck", "de-AT": "Linsen mit Speck", "en": "Austrian lentils with bacon"},
        matrix="liquid", servings_source=6, standard_serving_g=300,
        ingredients=[ing("lentils_dry", 500, note="500 g Linsen getrocknet"), ing("beef_broth", 1500, "liquid", "1 1/2 l Rindsuppe oder Kochsud"),
                     ing("smoked_bacon", 100, note="100 g Bauernspeck würfelig"), ing("onion", 50, note="50 g Zwiebel"),
                     ing("wheat_flour", 35, "thickener", "30-40 g Weizenmehl"), ing("butter", 40, "fat", "2 EL Butter oder Butterschmalz, ca. 40 g"),
                     ing("mustard", g(1, "tk_mustard"), "seasoning", "1 TL Senf"), ing("wine_vinegar", 20, "seasoning", "20 ml Weinessig"),
                     ing("garlic", g(1.5, "gerezd_garlic"), "seasoning", "1-2 Zehen Knoblauch"), ing("parsley_leaf", g(1, "ek_chopped_herbs"), "garnish", "1 EL Petersilie")],
        cooking=dict(method="lentils simmered in Rindsuppe, bound with a bacon-onion Einbrenn, soured with vinegar", mass_change_g=-300,
                     note="estimate: dry lentils take up about their own weight in liquid, the rest partly evaporates. The page's yield field reads '1 Portion' for 500 g dry lentils; 6 portions are assumed. 50 g Gurkerl-Kapern-Sardellen mix (MISSING plain gherkin), Crème fraîche 'nach Belieben', bay leaf, juniper, thyme, lemon zest, salt left out"),
        sources=[src(IK + "linsen-mit-speck-rezept-12539", R, "batch recipe: 500 g Linsen getrocknet, 1 1/2 l Rindsuppe, 100 g Bauernspeck, 50 g Zwiebel, 30-40 g Mehl, ca. 40 g Butter, Senf, 20 ml Weinessig"),
                 src(GK + "linsen-mit-speck-rezept-5574", R, "cross-check: 400 g Linsen (Dose), 200 g Speckwürfel, 1 Zwiebel, 2 EL Mehl, 1 EL Öl, 200 ml Suppe, 2 TL Essig, 4 Portionen")]),
}


def D(id, category, parts, served_in, tags, aliases, countries=("AT",), **kw):
    if kw.get("alias_side"):
        kw.setdefault("alias_side_locale", "de-AT")
    return dict(id=id, countries=list(countries), category=category, part_refs=parts, served_in=served_in, tags=tags, aliases=aliases, **kw)


T = "traditional"
DISHES = [
    D("at_kaerntner_kasnudeln", T, [("kaerntner_kasnudeln", 300)], "flat_plate", ["traditional", "vegetarian", "higher-carb"],
      {"de-AT": ["kärntner kasnudeln", "kasnudeln", "kasnudel", "kärntner nudeln"], "de": ["kärntner kasnudeln", "kärntner käsnudeln"], "hu": ["karintiai derelye", "kasnudeln"], "en": ["carinthian cheese dumplings", "kasnudeln"]}),
    D("at_kasnocken", T, [("kasnocken", 330)], "flat_plate", ["traditional", "vegetarian", "higher-carb"],
      {"de-AT": ["kasnocken", "pinzgauer kasnocken", "kasnockn", "käsnocken"], "de": ["kasnocken", "käsenocken"], "hu": ["sajtos galuska osztrák módra", "kasnocken"], "en": ["cheese dumplings", "kasnocken"]}),
    D("at_kaesespaetzle", T, [("kaesespaetzle", 280)], "flat_plate", ["traditional", "vegetarian", "higher-carb"],
      {"de-AT": ["käsespätzle", "käsknöpfle", "kässpätzle", "vorarlberger käsknöpfle"], "de": ["käsespätzle", "kässpätzle", "allgäuer käsespätzle"], "hu": ["sajtos nokedli", "käsespätzle"], "en": ["cheese spaetzle", "cheese spätzle"]},
      reference_check=dict(catalog="bls:X711412", name="Eier-Frischteigwaren Spätzle mit Käse (Käsespätzle)", kcal=155, fat=5.84, protein=8.0, net_carbs=16.6,
                           deviation="RECEPTKÜLÖNBSÉG: az osztrák recept 300 g hegyi sajtot és 60 g vajat tesz 300 g lisztre, a BLS-összetétel sokkal kevesebb sajttal és sok vízzel számol (155 kcal); nem hangoltuk.")),
    D("at_krautfleckerl", T, [("krautfleckerl", 300)], "flat_plate", ["traditional", "vegetarian", "higher-carb"],
      {"de-AT": ["krautfleckerl", "krautfleckerln", "fleckerl mit kraut"], "de": ["krautfleckerl", "krautnudeln", "nudeln mit weißkohl"], "hu": ["osztrák káposztás kocka"], "en": ["cabbage pasta", "krautfleckerl"]},
      review="A magyar káposztás tészta közeli rokona; az osztrák változat hagymával, köménnyel, tojásos Fleckerllel készül."),
    D("at_spinatknoedel", T, [("spinatknoedel", 330)], "flat_plate", ["traditional", "vegetarian", "higher-carb"],
      {"de-AT": ["spinatknödel", "spinatknödel mit parmesan", "spinatnocken"], "de": ["spinatknödel"], "hu": ["spenótos gombóc", "spenótgombóc"], "en": ["spinach dumplings"]}),
    D("at_speckknoedel", T, [("speckknoedel", 200)], "flat_plate", ["traditional", "higher-carb"],
      {"de-AT": ["speckknödel", "tiroler speckknödel", "speckknödl"], "de": ["speckknödel", "tiroler knödel"], "hu": ["szalonnás gombóc", "tiroli szalonnás gombóc"], "en": ["bacon dumplings", "tyrolean dumplings"]},
      side_options=[("sauerkraut_gedunstet", 150)], alias_side={"speckknödel mit sauerkraut": "sauerkraut_gedunstet", "speckknödel mit kraut": "sauerkraut_gedunstet"},
      reference_check=dict(catalog="bls:X981252", name="Tiroler Speckknödel", kcal=201, fat=9.0, protein=7.6, net_carbs=21.51),
      review="Adag = 2 gombóc; levesben a Speckknödelsuppe külön étel."),
    D("at_kaspressknoedel", T, [("kaspressknoedel", 190)], "flat_plate", ["traditional", "vegetarian", "fried"],
      {"de-AT": ["kaspressknödel", "kaspressknödl", "käsepressknödel", "pressknödel"], "de": ["kaspressknödel", "käseknödel gebraten"], "hu": ["sajtos lapított gombóc", "kaspressknödel"], "en": ["fried cheese dumplings", "kaspressknoedel"]},
      review="Adag = 2 lapos gombóc salátával vagy levesben (Kaspressknödelsuppe külön)."),
    D("at_semmelknoedel_schwammerlsauce", T, [("semmelknoedel", 200), ("schwammerlsauce", 200)], "flat_plate", ["traditional", "vegetarian"],
      {"de-AT": ["semmelknödel mit schwammerlsauce", "eierschwammerl mit knödel", "schwammerlsauce mit knödel", "eierschwammerlsauce mit semmelknödel", "schwammerl mit knödel"],
       "de": ["semmelknödel mit pilzrahmsauce", "pfifferlinge mit semmelknödel"], "hu": ["zsemlegombóc rókagombamártással", "gombamártás zsemlegombóccal"], "en": ["bread dumplings with chanterelle sauce"]},
      names={"hu": "Zsemlegombóc rókagomba-mártással", "de": "Semmelknödel mit Pfifferlingsrahmsauce", "de-AT": "Semmelknödel mit Schwammerlsauce", "en": "Bread dumplings with chanterelle cream sauce"}),
    D("at_semmelknoedel", T, [("semmelknoedel", 200)], "flat_plate", ["traditional", "vegetarian", "higher-carb"],
      {"de-AT": ["semmelknödel", "semmelknödl", "knödel", "serviettenknödel"], "de": ["semmelknödel", "semmelklöße", "brötchenknödel"], "hu": ["zsemlegombóc", "zsemlyegombóc"], "en": ["bread dumplings", "bread dumpling", "semmelknoedel"]},
      reference_check=dict(catalog="bls:X980112", name="Semmelknödel", kcal=179, fat=6.64, protein=7.49, net_carbs=21.66),
      review="Adag = 2 gombóc (~200 g); köretként a Schweinsbraten, Gulasch, Beuschel mellett külön választható. A 'Serviettenknödel' tésztája azonos, más formában."),
    D("at_reisfleisch", T, [("reisfleisch", 380)], "flat_plate", ["traditional", "higher-carb"],
      {"de-AT": ["reisfleisch", "serbisches reisfleisch", "reisfleisch mit parmesan"], "de": ["serbisches reisfleisch", "reisfleisch"], "hu": ["osztrák rizses hús", "szerb rizses hús"], "en": ["austrian rice stew", "serbian rice with pork"]},
      review="Reibkäse a tetején a felhasználó választása."),
    D("at_krautwickel", T, [("krautwickel", 300)], "flat_plate", ["traditional"],
      {"de-AT": ["krautwickel", "krautrouladen", "kohlrouladen"], "de": ["kohlrouladen", "krautwickel", "krautrouladen"], "hu": ["osztrák töltött káposzta", "friss káposztás töltelék"], "en": ["cabbage rolls", "stuffed cabbage leaves"]},
      side_options=[("petrezselymes_burgonya", 200)], alias_side={"krautwickel mit erdäpfeln": "petrezselymes_burgonya", "krautwickel mit salzerdäpfeln": "petrezselymes_burgonya"}),
    D("at_linsen_mit_speck_knoedel", T, [("linsen_mit_speck", 300), ("semmelknoedel", 100)], "deep_plate", ["traditional", "legumes"],
      {"de-AT": ["linsen mit speck und knödel", "linsen mit knödel", "linsen mit semmelknödel", "linsen mit speck"], "de": ["linsen mit speck und semmelknödel", "linseneintopf mit knödel"],
       "hu": ["szalonnás lencse gombóccal", "lencsefőzelék zsemlegombóccal"], "en": ["lentils with bacon and dumpling"]},
      names={"hu": "Szalonnás lencse zsemlegombóccal", "de": "Linsen mit Speck und Semmelknödel", "de-AT": "Linsen mit Speck und Knödel", "en": "Lentils with bacon and bread dumpling"},
      reference_check=dict(catalog="bls:X572143", name="Linsengemüse gekocht, mit Suppengrün und Speck", kcal=81, fat=1.8, protein=5.35, net_carbs=9.0,
                           deviation="RECEPTKÜLÖNBSÉG: a referencia gombóc nélküli, híg lencsefőzelék; az osztrák étel egy zsemlegombóccal és vajas Einbrennel készül; nem hangoltuk."),
      review="1 gombóc (~100 g) a lencse mellett."),
]

MISSING = [
    dict(food_key="gherkin_plain", names={"de-AT": "Essiggurkerl", "hu": "csemegeuborka", "en": "pickled gherkin"}, needed_for=["at_linsen_mit_speck_knoedel (50 g Gurkerl-Kapern-Sardellen)"],
         note="BLS 4.0 lists only Salzdillgurke (milchsauer, G890702) and sweet-sour Honig-/Senfgurke; an Austrian Essiggurkerl (vinegar-pickled) is none of these. Left out, as in hu-missing-foods."),
]
