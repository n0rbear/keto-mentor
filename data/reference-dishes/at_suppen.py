"""Austria phase 3: soups and soup garnishes (Suppeneinlagen), sources read
2026-10-05. The clear Rindsuppe is the BLS composite 'Fleischbrühe (Rind)'."""
from common import g, ing, src
from at_knoedel_nudeln import broth

R = "2026-10-05"
GK = "https://www.gutekueche.at/"
IK = "https://www.ichkoche.at/"

PARTS = {
    "rindsuppe": dict(
        names={"hu": "Tiszta marhahúsleves (Rindsuppe)", "de": "Klare Rinderbrühe", "de-AT": "Klare Rindsuppe", "en": "Clear beef broth (Rindsuppe)"},
        matrix="liquid", servings_source=4, standard_serving_g=300,
        ingredients=[ing("beef_broth", 1000, "liquid", "1 l Rindsuppe (klar), the strained broth: BLS Fleischbrühe (Rind)"),
                     ing("chives", 5, "garnish", "Schnittlauch zum Bestreuen; 5 g is an estimate")],
        cooking=dict(method="homemade from bones, beef and roots, strained (sources); the finished clear broth is the catalog record", mass_change_g=0,
                     note="1 l Suppe for 4 bowls in the soup recipes below (Speckknödelsuppe, Frittatensuppe); a bowl of clear soup with its garnish is ~300 g broth"),
        sources=[src(IK + "rindsuppe-rezept-2589", R, "Rindsuppe: 800 g Rindsknochen, 400 g Rindfleisch, 250 g Wurzelgemüse, Zwiebel, Lauch, 8 Portionen"),
                 src(GK + "speckknoedelsuppe-rezept-25110", R, "1 l Rindersuppe for 4 Portionen Speckknödelsuppe"),
                 src(IK + "frittatensuppe-rezept-4533", R, "1 l Suppe for 4 Portionen Frittatensuppe")]),
    "frittaten": dict(
        names={"hu": "Palacsintacsíkok levesbe (Frittaten)", "de": "Flädle (Pfannkuchenstreifen)", "de-AT": "Frittaten", "en": "Pancake strips for soup (Frittaten)"},
        matrix="dry", bulk_density_g_ml=0.45, servings_source=4, standard_serving_g=65,
        ingredients=[ing("wheat_flour", 75, note="75 g Mehl glatt"), ing("milk_whole", 129, "liquid", "125 ml Milch"), ing("egg", g(2, "db_egg"), note="2 Eier"),
                     ing("butter", 10, "fat", "'Butter' for the pan; ~10 g is an estimate")],
        cooking=dict(method="thin pancakes baked in butter, rolled and cut in fine strips", mass_change_g=-45, note="estimate: ~15 % of the batter water steams off; salt left out"),
        sources=[src(IK + "frittatensuppe-rezept-4533", R, "batch recipe: 75 g Mehl, 125 ml Milch, 2 Eier, Butter, 1 l Suppe, 4 Portionen"),
                 src(GK + "frittatensuppe-rezept-1349", R, "cross-check: 125 g Mehl, 250 ml Milch, 1 Ei, 2 EL Öl, 1 l Rindsuppe, Schnittlauch, 4 Portionen")]),
    "leberknoedel": dict(
        names={"hu": "Májgombóc", "de": "Leberknödel", "de-AT": "Leberknödel", "en": "Liver dumpling"},
        matrix="dry", bulk_density_g_ml=0.70, servings_source=8, standard_serving_g=115,
        ingredients=[ing("wheat_roll", g(4, "stk_semmel"), note="4 Semmeln altbacken"), ing("milk_whole", 129, "liquid", "125 ml Milch lauwarm"),
                     ing("calf_liver", 250, note="250 g Leber (Kalbsleber, as in the cross-check)"), ing("onion", g(1, "db_onion"), note="1 Zwiebel"),
                     ing("parsley_leaf", 10, "seasoning", "1 Bund Petersilie; 10 g is an estimate"), ing("butter", 30, "fat", "30 g Butter"), ing("egg", g(2, "db_egg"), note="2 Eier"),
                     ing("breadcrumbs", 20, "thickener", "Semmelbrösel zum Binden nach Bedarf; 20 g is an estimate")],
        cooking=dict(method="minced liver-bread dough, 8 Knödel simmered ~15 min in Suppe", mass_change_g=40, note="estimate: dumplings take up ~5 % liquid; Majoran, Muskat (MISSING), salt, pepper left out"),
        sources=[src(IK + "leberknoedel-rezept-16406", R, "batch recipe: 4 Semmeln, 125 ml Milch, 250 g Leber, 1 Zwiebel, Petersilie, 30 g Butter, 2 Eier, Brösel, 1 l Rindsuppe, 4 Portionen (2 Knödel each)"),
                 src(GK + "leberknoedel-rezept-1290", R, "cross-check: 100 g Kalbsleber, 1 Ei, 4 EL Mehl, 1/2 Scheibe Weißbrot, 1 Schalotte, Butter, Petersilie, 4 Portionen")]),
    "griessnockerl": dict(
        names={"hu": "Grízgaluska (Grießnockerl)", "de": "Grießklößchen (Grießnockerl)", "de-AT": "Grießnockerl", "en": "Semolina dumplings (Grießnockerl)"},
        matrix="dry", bulk_density_g_ml=0.60, servings_source=4, standard_serving_g=73,
        ingredients=[ing("butter", 30, "fat", "30 g Butter (weich)"), ing("egg", g(1, "db_egg"), note="1 Ei (Größe M)"), ing("durum_semolina", 80, note="80 g Hartweizengrieß")],
        cooking=dict(method="dough rested, 8 Nockerl shaped with two spoons, simmered ~20 min and left to swell", mass_change_g=130,
                     note="estimate: the Nockerl roughly double while they swell; nutmeg (MISSING) and salt left out. 2 Nockerl per bowl"),
        sources=[src(GK + "griessnockerl-rezept-8257", R, "batch recipe: 30 g Butter, 1 Ei, 80 g Hartweizengrieß, 8 Stück"),
                 src(IK + "griessnockerl-rezept-15425", R, "cross-check: 85 g Hartweizengrieß, 1 Ei, 30 g Butter, 4 Portionen")]),
    "backerbsen": dict(
        names={"hu": "Levesgyöngy (Backerbsen)", "de": "Backerbsen (Suppenperlen)", "de-AT": "Backerbsen", "en": "Fried batter pearls for soup (Backerbsen)"},
        matrix="dry", bulk_density_g_ml=0.30, servings_source=4, standard_serving_g=30,
        ingredients=[ing("egg", g(1, "db_egg"), note="1 Ei (Größe M)"), ing("milk_whole", g(2, "ek_milk"), "liquid", "2 EL Milch"), ing("wheat_flour", 50, note="50 g Weizenmehl"),
                     ing("sunflower_oil", 20, "absorbed_fat", "1 Tasse Sonnenblumenöl zum Frittieren; ~20 g taken up is an estimate")],
        cooking=dict(method="batter dripped through a sieve into hot oil, fried golden", mass_change_g=-20, note="estimate: ~15 % water loss while frying; salt left out"),
        sources=[src(GK + "backerbsen-rezept-9124", R, "batch recipe: 1 Ei, 2 EL Milch, 50 g Mehl, Sonnenblumenöl zum Frittieren, 4 Portionen"),
                 src(IK + "backerbsen-rezept-3117", R, "cross-check: 80 g Mehl, 1 Ei, 1/8 l Milch, 2 EL Öl, Pflanzenöl zum Herausbacken")]),
    "gulaschsuppe": dict(
        names={"hu": "Bécsi gulyásleves (Gulaschsuppe)", "de": "Gulaschsuppe (Wiener Art)", "de-AT": "Gulaschsuppe", "en": "Viennese goulash soup"},
        matrix="liquid", servings_source=2, standard_serving_g=400,
        ingredients=[ing("beef_chuck", 250, note="250 g Rindfleisch von der Schulter"), ing("onion", 150, note="1 Zwiebel groß; 150 g is an estimate"),
                     ing("bell_pepper_red", 300, note="2 Paprika; 150 g each is an estimate"), ing("sunflower_oil", g(2, "ek_oil"), "fat", "2 EL Öl"),
                     ing("tomato_paste", g(2, "ek_tomato_paste"), "seasoning", "2 EL Paradeismark"), ing("paprika_ground", g(2, "ek_paprika"), "seasoning", "1 EL scharf + 1 EL edelsüß"),
                     ing("beef_broth", 650, "liquid", "650 ml Rindsuppe"), ing("potato", 250, note="250 g Erdäpfel"),
                     ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Knoblauchzehe"), ing("caraway_seed", g(1, "tk_spice"), "seasoning", "1 TL Kümmel")],
        cooking=dict(method="beef braised in the paprika-onion base, Suppe and potatoes added, simmered ~1.5 h", mass_change_g=-250,
                     note="estimate: meat loses ~25 % water, some broth evaporates. 125 ml Rotwein (MISSING dry_red_wine), lemon zest, salt left out"),
        sources=[src(IK + "gulaschsuppe-rezept-18043", R, "batch recipe: 250 g Rindfleisch (Schulter), 1 große Zwiebel, 2 Paprika, 2 EL Öl, 2 EL Paradeismark, 2 EL Paprikapulver, 125 ml Rotwein, 650 ml Rindsuppe, 250 g Erdäpfel, 2 Portionen"),
                 src(IK + "gulaschsuppe-rezept-4598", R, "cross-check: 2 Zwiebeln, 50 g Schweineschmalz, 1 EL Paprika, 1 l Rindsuppe, 1/4 l Rotwein, Paprika, 1 EL Tomatenmark, 50 g Reis, 4 Portionen")]),
    "wiener_erdaepfelsuppe": dict(
        names={"hu": "Bécsi krumplileves (Wiener Erdäpfelsuppe)", "de": "Wiener Kartoffelsuppe", "de-AT": "Wiener Erdäpfelsuppe", "en": "Viennese potato soup"},
        matrix="liquid", servings_source=4, standard_serving_g=400,
        ingredients=[ing("potato", 200, note="200 g Erdäpfel roh und geschält"), ing("onion", g(1, "db_onion"), note="1 Zwiebel"), ing("smoked_bacon", 50, note="50 g Frühstücksspeck"),
                     ing("carrot", 50, note="100 g Wurzelwerk (Karotten und Sellerie): half each is an estimate"), ing("celeriac", 50),
                     ing("sunflower_oil", g(4, "ek_oil"), "fat", "4 EL Pflanzenöl oder Butterschmalz"), ing("wheat_flour", 20, "thickener", "20 g Mehl"),
                     ing("beef_broth", 1250, "liquid", "1 1/4 l Rindsuppe"), ing("caraway_seed", 6, "seasoning", "1 EL Kümmel; ~6 g is an estimate"),
                     ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Zehe Knoblauch"), ing("parsley_leaf", g(1, "ek_chopped_herbs"), "garnish", "1 EL Petersilie"),
                     ing("porcini_dried", 10, note="10 g Steinpilz getrocknet"), ing("cider_vinegar", g(1, "ek_vinegar"), "seasoning", "1 EL Apfelessig"),
                     ing("sauerrahm", g(2, "ek_sour_cream"), "thickener", "2 EL Sauerrahm")],
        cooking=dict(method="bacon, onion and roots sweated, dusted, Suppe and potatoes simmered ~25 min, soured, finished with Sauerrahm", mass_change_g=-250,
                     note="estimate: ~20 % of the Suppe evaporates; Majoran, Selleriegrün, Lorbeer, salt, pepper left out"),
        sources=[src(IK + "wiener-erdaepfelsuppe-rezept-3122", R, "batch recipe: 200 g Erdäpfel, 1 Zwiebel, 50 g Frühstücksspeck, 100 g Wurzelwerk, 4 EL Öl, 20 g Mehl, 1 1/4 l Rindsuppe, 10 g getrocknete Steinpilze, Apfelessig, 2 EL Sauerrahm, 4 Portionen"),
                 src(GK + "alt-wiener-erdaepfelsuppe-rezept-6743", R, "cross-check: 200 g Kartoffeln, 2 Karotten, 1 Pastinake, Sellerie, 70 g Speck, 30 g Butter, 30 g Mehl, 1 l Rindsuppe, 6 Portionen")]),
    "schwammerlsuppe": dict(
        names={"hu": "Tejfölös gombaleves (Schwammerlsuppe)", "de": "Pilzsuppe mit Sauerrahm", "de-AT": "Schwammerlsuppe", "en": "Austrian mushroom soup"},
        matrix="liquid", servings_source=6, standard_serving_g=300,
        ingredients=[ing("butter", 40, "fat", "40 g Butter"), *broth("veg_bouillon_powder", 1000, "1 l Gemüsesuppe (klar)"),
                     ing("potato", 160, note="2 Stk Kartoffel (klein); 80 g each is an estimate"), ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Knoblauchzehe"),
                     ing("parsley_leaf", g(1, "ek_chopped_herbs"), "garnish", "1 EL Petersilie"), ing("chanterelle", 300, note="300 g Pilze (z.B. Steinpilz oder Eierschwammerl): Eierschwammerl"),
                     ing("sauerrahm", g(1, "becher_sour_cream"), "thickener", "1 Becher Sauerrahm (250 g)"), ing("wheat_flour", g(2, "ek_flour"), "thickener", "2 EL Weizenmehl"),
                     ing("onion", g(1, "db_onion"), note="1 Stk Zwiebel (mittelgroß)")],
        cooking=dict(method="onion and mushrooms sweated in butter, dusted, simmered with Suppe and potatoes, finished with Sauerrahm", mass_change_g=-150,
                     note="estimate: some evaporation; Majoran, Muskat (MISSING), salt, pepper left out"),
        sources=[src(GK + "schwammerlsuppe-rezept-7338", R, "batch recipe: 40 g Butter, 1 l Gemüsesuppe, 2 kleine Kartoffeln, 300 g Pilze, 1 Becher Sauerrahm, 2 EL Mehl, 1 Zwiebel, 6 Portionen"),
                 src(IK + "schwammerlsuppe-rezept-9559", R, "cross-check: 150 g Pilze, 50 g Butter, 30 g Mehl, 1 Zwiebel, 750 ml Gemüsesuppe, 250 ml Schlagobers, 2 Eigelb")]),
    "kuerbiscremesuppe": dict(
        names={"hu": "Stájer sütőtökkrémleves tökmagolajjal", "de": "Kürbiscremesuppe mit Kürbiskernöl", "de-AT": "Steirische Kürbiscremesuppe", "en": "Styrian pumpkin cream soup"},
        matrix="liquid", servings_source=4, standard_serving_g=350,
        ingredients=[ing("pumpkin", 600, note="600 g Kürbisfleisch"), ing("onion", g(1, "db_onion"), note="1 Zwiebel"),
                     ing("clarified_butter", g(2, "ek_oil"), "fat", "2 EL Butterschmalz"), ing("wheat_flour", g(1, "ek_flour"), "thickener", "1 EL Mehl"),
                     ing("beef_broth", 750, "liquid", "750 ml Rindsuppe"), ing("cream_36", 250, "thickener", "250 ml Schlagobers"),
                     ing("pumpkin_seeds", 16, "garnish", "2 EL Kürbiskerne, geröstet; 8 g per EL is an estimate"),
                     ing("pumpkin_seed_oil", 18, "garnish", "'Kürbiskernöl zum Garnieren'; 1 TL per bowl is an estimate")],
        cooking=dict(method="pumpkin and onion sweated, simmered in Suppe, blended with Obers", mass_change_g=-150,
                     note="estimate: some evaporation. 67 ml Welschriesling (MISSING dry_white_wine), nutmeg (MISSING), salt, pepper left out"),
        sources=[src(IK + "kuerbiscremesuppe-rezept-4152", R, "batch recipe: 600 g Kürbisfleisch, 1 Zwiebel, 2 EL Butterschmalz, 1 EL Mehl, 67 ml Weißwein, 750 ml Rindsuppe, 250 ml Schlagobers, 2 EL Kürbiskerne, Kürbiskernöl, 4 Portionen"),
                 src(IK + "kuerbiscremesuppe-rezept-683", R, "cross-check: 400 g Kürbisfleisch, 3/4 l Rindsuppe, 50 g Butterschmalz, 1 Zwiebel, 1 EL Mehl, 1/4 l Schlagobers, 2 EL Kürbiskernöl, 4 Portionen")]),
    "knoblauchsuppe": dict(
        names={"hu": "Fokhagymakrémleves", "de": "Knoblauchcremesuppe", "de-AT": "Knoblauchsuppe (Knoblauchcremesuppe)", "en": "Garlic cream soup"},
        matrix="liquid", servings_source=4, standard_serving_g=350,
        ingredients=[ing("onion", g(1, "db_onion"), note="1 Zwiebel mittelgroß"), ing("garlic", 50, "seasoning", "1 Knolle Knoblauch; ~50 g is an estimate"),
                     ing("lard", 40, "fat", "40 g Schmalz"), ing("wheat_flour", 20, "thickener", "20 g Mehl glatt"),
                     ing("beef_broth", 1500, "liquid", "1 1/2 l Rindsuppe fertig"), ing("creme_fraiche", 125, "thickener", "125 ml Crème fraîche")],
        cooking=dict(method="onion and garlic sweated in Schmalz, dusted, simmered in Suppe, blended with crème fraîche", mass_change_g=-200,
                     note="estimate: ~13 % of the Suppe evaporates; Worcestersauce, salt, pepper left out; croutons are an optional garnish"),
        sources=[src(IK + "knoblauchsuppe-rezept-158", R, "batch recipe: 1 Zwiebel, 1 Knolle Knoblauch, 40 g Schmalz, 20 g Mehl, 1 1/2 l Rindsuppe, 125 ml Crème fraîche, 4 Portionen"),
                 src(IK + "knoblauchsuppe-rezept-3123", R, "cross-check: 4-6 Knoblauchzehen, 100 g Zwiebeln, 40 g Butter, 1 1/4 l Salzwasser, 4 Scheiben Schwarzbrot, 4 Portionen")]),
    "kaspressknoedelsuppe": dict(
        names={"hu": "Sajtos lapított gombócleves (Kaspressknödelsuppe)", "de": "Kaspressknödelsuppe", "de-AT": "Kaspressknödelsuppe", "en": "Fried cheese dumpling soup"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("bergkaese", 400, note="400 g Bergkäse"), ing("butter", 50, "fat", "100 g Butter für die Pfanne; ~50 g taken up is an estimate"),
                     ing("egg", g(4, "db_egg"), note="4 Eier (Größe M)"), ing("milk_whole", 257, "liquid", "250 ml Milch"),
                     ing("parsley_leaf", g(4, "ek_chopped_herbs"), "seasoning", "2 + 2 EL Petersilie"), ing("wheat_roll", 400, note="400 g Semmelwürfel - BLS Weizenbrötchen"),
                     ing("wheat_flour", g(4, "ek_flour"), "thickener", "4 EL Weizenmehl"), ing("onion", g(1, "db_onion"), note="1 Zwiebel (mittelgroß)"),
                     ing("sunflower_oil", g(2, "ek_oil"), "fat", "2 EL Pflanzenöl zum Anbraten"), *broth("veg_bouillon_powder", 2000, "2 l Gemüsesuppe (klar)")],
        cooking=dict(method="4 large cheese Knödel pressed flat, fried golden, served in hot Suppe", mass_change_g=-200, note="estimate: ~10 % frying loss and a little evaporation; Majoran, salt, pepper left out"),
        sources=[src(GK + "kaspressknoedelsuppe-rezept-6278", R, "batch recipe: 400 g Bergkäse, 100 g Butter, 4 Eier, 250 ml Milch, 400 g Semmelwürfel, 4 EL Mehl, 1 Zwiebel, 2 l Gemüsesuppe, 2 EL Öl, 4 Stück"),
                 src(GK + "kaspressknoedelsuppe-rezept-6127", R, "cross-check: 6 harte Semmeln, 3 Eier, 3 EL Mehl, 250 ml Milch, 200 g Tilsiter, 2 EL Grieß, 1,5 l Suppe, 4 Portionen")]),
    "huehnersuppe_nudeln": dict(
        names={"hu": "Tyúkhúsleves csigatésztával", "de": "Hühnersuppe mit Nudeln", "de-AT": "Hühnersuppe mit Nudeln (Hendlsuppe)", "en": "Chicken noodle soup"},
        matrix="liquid", servings_source=4, standard_serving_g=400,
        ingredients=[ing("stewing_hen", 550, note="1 Suppenhuhn (etwa 1 Kilo); ~55 % edible meat and skin is an estimate"),
                     ing("carrot", 120, note="1 Bund Suppengrün: carrot 120, celeriac 100, leek 80 g is an estimate"), ing("celeriac", 100), ing("leek", 80),
                     ing("onion", g(1, "db_onion"), note="1 Zwiebel"), ing("egg_pasta_dry", 150, note="150 g Suppennudeln, cooked in the soup"),
                     ing("parsley_leaf", 10, "garnish", "0,5 Bund Petersilie; estimate"), ing("chives", 5, "garnish", "0,5 Bund Schnittlauch; estimate"),
                     ing("water", 2000, "liquid", "2 l Wasser")],
        cooking=dict(method="hen simmered ~2 h with roots, meat picked off, noodles cooked in the soup", mass_change_g=-400,
                     note="estimate: ~20 % of the water evaporates; the noodles take their water from the soup. Liebstöckel, bay leaf, juniper, pepper, salt left out"),
        sources=[src(GK + "huehnersuppe-mit-nudeln-rezept-53503", R, "batch recipe: 1 Suppenhuhn (etwa 1 Kilo), 1 Bund Suppengrün, 1 Zwiebel, 150 g Suppennudeln, 2 l Wasser, 4 Portionen"),
                 src(IK + "huehnersuppe-mit-nudeln-rezept-8898", R, "cross-check: 300 g Hendlbrustfilets, 200 g Brokkoli, 2 l Wasser, 8 EL Suppengemüse, 120 g Suppennudeln")]),
    "klachelsuppe": dict(
        names={"hu": "Stájer csülökleves (Klachelsuppe)", "de": "Klachelsuppe (saure Schweinshaxensuppe)", "de-AT": "Steirische Klachelsuppe", "en": "Styrian sour pork hock soup"},
        matrix="liquid", servings_source=4, standard_serving_g=450,
        ingredients=[ing("pork_hock", 600, note="1 kg Schweinshaxen in Scheiben; ~60 % edible is an estimate"),
                     ing("carrot", 120, note="1 Bund Suppengrün: carrot 120, celeriac 100, leek 80 g is an estimate"), ing("celeriac", 100), ing("leek", 80),
                     ing("onion", g(1, "db_onion"), note="1 Zwiebel"), ing("water", 2000, "liquid", "2 l Wasser"),
                     ing("wheat_flour", 30, "thickener", "30 g Mehl"), ing("sauerrahm", g(2, "ek_sour_cream"), "thickener", "2 EL Sauerrahm"),
                     ing("horseradish", 40, "garnish", "4 EL Kren frisch gerieben; 10 g per EL is an estimate")],
        cooking=dict(method="hock slices simmered ~2 h with roots, soup bound with flour and Sauerrahm, Kren on top", mass_change_g=-450,
                     note="estimate: the meat loses ~25 % and ~15 % of the water evaporates; vinegar (ichkoche), Majoran, juniper, salt left out"),
        sources=[src(GK + "klachelsuppe-rezept-985", R, "batch recipe: 1 kg Schweinshaxen, 1 Bund Suppengrün, 1 Zwiebel, 2 l Wasser, 30 g Mehl, 2 EL Sauerrahm, 4 EL Kren, 4 Portionen"),
                 src(IK + "klachelsuppe-rezept-1528", R, "cross-check: 1 kg Schweinshaxerl, 3 Schalotten, Karotte, gelbe Rübe, 100 g Sellerie, 150 g Sauerrahm, 1 EL Mehl, Apfelessig, 4 Portionen")]),
}


def D(id, parts, aliases, names=None, **kw):
    d = dict(id=id, countries=["AT"], category="traditional", part_refs=parts, served_in="deep_plate", tags=["soup", "traditional"], aliases=aliases, **kw)
    if names:
        d["names"] = names
    return d


def clear_soup(id, garnish, grams, de_at, de, hu, en, al_at, al_de, al_hu, al_en, **kw):
    return D(id, [("rindsuppe", 300), (garnish, grams)],
             {"de-AT": al_at, "de": al_de, "hu": al_hu, "en": al_en},
             names={"hu": hu, "de": de, "de-AT": de_at, "en": en}, **kw)


DISHES = [
    clear_soup("at_frittatensuppe", "frittaten", 65, "Frittatensuppe", "Flädlesuppe (Rinderbrühe mit Pfannkuchenstreifen)", "Frittatensuppe (húsleves palacsintacsíkokkal)", "Frittaten soup (beef broth with pancake strips)",
               ["frittatensuppe", "frittaten suppe", "frittatensupp", "rindsuppe mit frittaten"], ["flädlesuppe", "pfannkuchensuppe", "frittatensuppe"], ["frittatensuppe", "palacsintás húsleves", "húsleves palacsintacsíkokkal"], ["pancake soup", "frittaten soup", "beef broth with pancake strips"]),
    clear_soup("at_leberknoedelsuppe", "leberknoedel", 115, "Leberknödelsuppe", "Leberknödelsuppe", "Májgombócleves", "Liver dumpling soup",
               ["leberknödelsuppe", "leberknödel suppe", "rindsuppe mit leberknödel", "leberknödelsupp"], ["leberknödelsuppe", "leberknödelsuppe bayerisch"], ["májgombócleves", "májgombócos leves"], ["liver dumpling soup"],
               reference_check=dict(catalog="bls:X427363", name="Leberknödelsuppe", kcal=69, fat=3.7, protein=4.71, net_carbs=4.03,
                                    deviation="RECEPTKÜLÖNBSÉG: egy gombóc (115 g) 300 g tiszta levesben, ahogy étteremben tálalják; a BLS-összetétel több gombócot számol a léhez képest; nem hangoltuk."),
               review="A forrás 2 gombócot számol adagonként; a szokásos osztrák tálalás 1 nagy gombóc."),
    clear_soup("at_griessnockerlsuppe", "griessnockerl", 73, "Grießnockerlsuppe", "Grießklößchensuppe", "Grízgaluska-leves", "Semolina dumpling soup",
               ["grießnockerlsuppe", "griessnockerlsuppe", "grießnockerl suppe", "rindsuppe mit grießnockerl"], ["grießklößchensuppe", "grießnockerlsuppe"], ["grízgaluskaleves", "daragaluska-leves", "grízgaluska leves"], ["semolina dumpling soup"]),
    clear_soup("at_backerbsensuppe", "backerbsen", 30, "Backerbsensuppe", "Rinderbrühe mit Backerbsen", "Húsleves levesgyönggyel (Backerbsensuppe)", "Beef broth with fried batter pearls",
               ["backerbsensuppe", "rindsuppe mit backerbsen", "suppe mit backerbsen"], ["backerbsensuppe", "brühe mit backerbsen"], ["levesgyöngyös húsleves"], ["soup with soup pearls"]),
    clear_soup("at_speckknoedelsuppe", "speckknoedel", 100, "Speckknödelsuppe", "Speckknödelsuppe", "Szalonnás gombócleves", "Bacon dumpling soup",
               ["speckknödelsuppe", "knödelsuppe", "rindsuppe mit speckknödel"], ["speckknödelsuppe", "knödelsuppe"], ["szalonnás gombócleves"], ["bacon dumpling soup", "dumpling soup"]),
    D("at_kaspressknoedelsuppe", [("kaspressknoedelsuppe", 450)],
      {"de-AT": ["kaspressknödelsuppe", "kaspressknödel suppe", "suppe mit kaspressknödel"], "de": ["kaspressknödelsuppe", "käseknödelsuppe"], "hu": ["sajtos gombócleves"], "en": ["cheese dumpling soup"]}),
    D("at_gulaschsuppe", [("gulaschsuppe", 400)],
      {"de-AT": ["gulaschsuppe", "wiener gulaschsuppe", "gulaschsupp"], "de": ["gulaschsuppe", "gulaschsuppe mit kartoffeln"], "hu": ["bécsi gulyásleves", "osztrák gulyásleves"], "en": ["viennese goulash soup", "goulash soup austrian"]},
      reference_check=dict(catalog="bls:X456133", name="Gulaschsuppe ungarisch, mit Rindfleisch, Fleischbrühe, Tomaten und Kartoffeln", kcal=59, fat=3.8, protein=2.8, net_carbs=3.0,
                           deviation="RECEPTKÜLÖNBSÉG: a forrás 2 adagra 250 g húst és 250 g burgonyát főz 650 ml levesben (sűrű, húsos gulyásleves); a BLS-összetétel híg leves kevés hússal; nem hangoltuk."),
      review="A magyar gulyásleves (hu_gulyasleves) külön étel; a bécsi változat paprikával, paradicsompürével, burgonyával."),
    D("at_wiener_erdaepfelsuppe", [("wiener_erdaepfelsuppe", 400)],
      {"de-AT": ["erdäpfelsuppe", "wiener erdäpfelsuppe", "erdäpfelsuppe mit schwammerl", "kartoffelsuppe"], "de": ["wiener kartoffelsuppe", "kartoffelsuppe mit pilzen"], "hu": ["bécsi krumplileves"], "en": ["viennese potato soup", "potato soup"]},
      reference_check=dict(catalog="bls:X449613", name="Kartoffelsuppe mit Gemüsebrühe, gebunden", kcal=62, fat=1.8, protein=1.11, net_carbs=10.0)),
    D("at_schwammerlsuppe", [("schwammerlsuppe", 300)],
      {"de-AT": ["schwammerlsuppe", "eierschwammerlsuppe", "pilzsuppe", "schwammerlsupp"], "de": ["pilzsuppe", "pfifferlingsuppe", "pilzrahmsuppe"], "hu": ["tejfölös gombaleves", "rókagombaleves"], "en": ["mushroom soup", "chanterelle soup"]}),
    D("at_kuerbiscremesuppe", [("kuerbiscremesuppe", 350)],
      {"de-AT": ["kürbiscremesuppe", "kürbissuppe", "steirische kürbiscremesuppe", "kürbiscremesuppe mit kernöl"], "de": ["kürbiscremesuppe", "kürbissuppe"], "hu": ["sütőtökkrémleves tökmagolajjal", "stájer tökkrémleves"], "en": ["pumpkin cream soup", "styrian pumpkin soup"]},
      reference_check=dict(catalog="bls:X445863", name="Kürbiscremesuppe", kcal=69, fat=5.2, protein=0.95, net_carbs=4.0,
                           deviation="RECEPTKÜLÖNBSÉG: a forrás 250 ml 36 %-os tejszínt, Butterschmalzot, tökmagot és tökmagolajat tesz 4 adagra; a BLS-összetétel kevesebb zsiradékkal számol; nem hangoltuk."),
      review="A magyar sütőtökkrémleves (hu_sutotokkremleves) más recept; az osztrák változat tökmagolajjal."),
    D("at_knoblauchsuppe", [("knoblauchsuppe", 350)],
      {"de-AT": ["knoblauchsuppe", "knoblauchcremesuppe", "knofelsuppe"], "de": ["knoblauchcremesuppe", "knoblauchsuppe"], "hu": ["fokhagymakrémleves", "fokhagymaleves"], "en": ["garlic soup", "garlic cream soup"]}),
    D("at_huehnersuppe_nudeln", [("huehnersuppe_nudeln", 400)],
      {"de-AT": ["hühnersuppe", "hühnersuppe mit nudeln", "hendlsuppe", "nudelsuppe", "hühnernudelsuppe"], "de": ["hühnersuppe", "hühnernudelsuppe", "nudelsuppe"], "hu": ["tyúkhúsleves tésztával", "csirkeleves tésztával"], "en": ["chicken noodle soup", "chicken soup"]},
      reference_check=dict(catalog="bls:X4A1020", name="Hühnersuppe mit Hühnerfleisch und Suppengemüse", kcal=56, fat=3.5, protein=5.5, net_carbs=0.4,
                           deviation="RECEPTKÜLÖNBSÉG: a forrás 150 g levestésztát főz a levesbe és bőrös tyúkhúst ad (tésztás leves); a BLS-referencia tészta nélküli; nem hangoltuk.")),
    D("at_klachelsuppe", [("klachelsuppe", 450)],
      {"de-AT": ["klachelsuppe", "steirische klachelsuppe", "klachlsuppe"], "de": ["klachelsuppe", "saure schweinshaxensuppe"], "hu": ["stájer csülökleves"], "en": ["styrian pork hock soup"]}),
]

MISSING = []
