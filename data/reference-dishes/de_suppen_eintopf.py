"""Germany phase 4: soups and Eintöpfe (sources read 2026-10-11).

Instant Brühe follows the Austrian rule (at_knoedel_nudeln.broth: 2 g powder
per 100 ml); a strained homemade broth is the BLS composite of that broth.
Bay leaves, peppercorns, cloves and juniper flavour the pot and are fished
out or eaten in traces; like salt they are left out without a note."""
from common import g, ing, src
from at_knoedel_nudeln import broth

R = "2026-10-11"
GK = "https://www.gutekueche.de/"
LK = "https://www.lecker.de/"


def suppengruen(n=1, note="Bund Suppengrün"):
    """One German Bund Suppengrün split into its usual roots (common.MEASURE_G)."""
    word = f"{n:g} {note}"
    return [ing("carrot", round(150 * n), note=f"{word}: Möhre, 150 g per Bund (estimate)"),
            ing("celeriac", round(150 * n), note=f"{word}: Knollensellerie, 150 g per Bund (estimate)"),
            ing("leek", round(100 * n), note=f"{word}: Lauch, 100 g per Bund (estimate)")]


def eintopf(names, servings, std, ingredients, change, method, note, sources):
    return dict(names=names, matrix="liquid", servings_source=servings, standard_serving_g=std, ingredients=ingredients,
                cooking=dict(method=method, mass_change_g=change, note=note), sources=sources)


PARTS = {
    "erbsensuppe": eintopf(
        {"hu": "Német sárgaborsó-főzelékleves virslivel (Erbseneintopf)", "de": "Erbseneintopf mit Wiener Würstchen", "de-AT": "Erbseneintopf mit Würstel", "en": "German split pea stew with sausages"},
        6, 450,
        [ing("split_peas_dry", 500, note="500 g getrocknete Erbsen (dry weight)"), ing("potato", 500, note="500 g Kartoffeln"), ing("carrot", 250, note="250 g Möhren"),
         ing("celeriac", 150, note="150 g Knollensellerie"), ing("onion", 150, note="1 große Zwiebel; 150 g is an estimate"),
         ing("pork_shoulder", 500, note="500 g Schweineschulter ohne Schwarte"), ing("kochmettwurst", 200, note="2 Kochwürste; 100 g each is an estimate"),
         ing("butter", g(2, "ek_butter"), "fat", "2 EL Butter"), ing("beef_broth", 3000, "liquid", "ca. 3 l Rinderbrühe (BLS Fleischbrühe Rind)"),
         ing("parsley_leaf", g(0.5, "bund_herb"), "garnish", "1/2 Bund Petersilie"), ing("frankfurter", 350, note="6-8 Wiener Würstchen: 7 x 50 g is an estimate")],
        -700, "peas simmered ~1.5 h with the meat in broth, vegetables and sausages added for the last 30 min",
        "estimate: ~25 % of the broth evaporates in the open pot; the dried peas take their water from the batch. Bay leaf left out",
        [src(LK + "erbsensuppe-mit-wienerle-15395.html", R, "batch recipe: 500 g Kartoffeln, 250 g Möhren, 150 g Sellerie, 1 Zwiebel, 500 g Schweineschulter, 2 Kochwürste, 2 EL Butter, 500 g getrocknete Erbsen, ca. 3 l Rinderbrühe, Petersilie, 6-8 Wiener Würstchen, 6 Personen"),
         src(GK + "deftiger-erbseneintopf-rezept-4794", R, "cross-check: 500 g Schälerbsen, 300 g Kartoffeln, 100 g Karotten, 100 g Sellerie, Porree, 2 Zwiebeln, 20 g Öl, 2 l Wasser, 4 Portionen")]),
    "linseneintopf": eintopf(
        {"hu": "Német lencsefőzelékleves virslivel (Linseneintopf)", "de": "Linseneintopf mit Würstchen", "de-AT": "Linseneintopf mit Würstel", "en": "German lentil stew with sausages"},
        4, 450,
        [ing("lentils_dry", 500, note="500 g Berglinsen, braun (dry weight)"), ing("carrot", 200, note="200 g Karotten"), ing("potato", 450, note="450 g Kartoffeln, festkochend"),
         ing("rapeseed_oil", g(2, "ek_oil"), "fat", "2 EL Rapsöl"), ing("celery_stalk", 80, note="2 Stg Staudensellerie; 40 g each is an estimate"),
         ing("water", 1250, "liquid", "1.250 ml Wasser"), ing("frankfurter", 200, note="4 Wiener Würstchen; 50 g each is an estimate"),
         ing("onion", g(2, "db_onion"), note="2 Zwiebeln"), ing("cider_vinegar", g(2, "ek_vinegar"), "seasoning", "2 EL Apfelessig"),
         ing("maple_syrup", g(1, "ek_honey"), "seasoning", "1 EL Ahornsirup")],
        -250, "lentils and vegetables simmered ~35 min, sausages warmed in the stew, seasoned with vinegar",
        "estimate: ~20 % of the water evaporates; the lentils take their water from the batch. Liebstöckel (MISSING) left out",
        [src(GK + "linseneintopf-mit-wuerstchen-rezept-12483", R, "batch recipe: 500 g Berglinsen, 200 g Karotten, 450 g Kartoffeln, 2 EL Rapsöl, 2 Stg Staudensellerie, 1.250 ml Wasser, 4 Wiener Würstchen, 2 Zwiebeln, 2 EL Apfelessig, 1 EL Ahornsirup, 20 g Liebstöckel, 4 Portionen"),
         src(GK + "linseneintopf-rezept-1608", R, "cross-check: 150 g Tellerlinsen, 2 Kartoffeln, 2 Möhren, 1 l Fleischbrühe, 1 Paar Wiener Würstchen, Essig, Senf, 2 Portionen")]),
    "kartoffelsuppe": eintopf(
        {"hu": "Tejszínes burgonyakrémleves (Kartoffelsuppe)", "de": "Kartoffelsuppe", "de-AT": "Erdäpfelsuppe (cremig)", "en": "German potato soup"},
        4, 400,
        [ing("potato", 800, note="800 g Kartoffeln"), ing("onion", 200, note="200 g Zwiebel"), ing("butter", g(1, "ek_butter"), "fat", "1 EL Butter"),
         *broth("veg_bouillon_powder", 800, "800 ml Brühe (vegetable instant broth is an estimate)"),
         ing("cream_30", g(1, "becher_200"), note="1 Bch Sahne (200 g, Schlagsahne 30 %)")],
        -100, "onion sweated in butter, potatoes simmered ~20 min in the broth, puréed with the cream",
        "estimate: ~10 % of the broth evaporates; salt, pepper left out",
        [src(GK + "kartoffelsuppe-rezept-1876", R, "batch recipe: 800 ml Brühe, 1 EL Butter, 800 g Kartoffeln, 1 Bch Sahne, 200 g Zwiebel, 4 Portionen"),
         src(GK + "kartoffelsuppe-mit-speck-rezept-909", R, "cross-check: 1 l Gemüsebrühe, 6 Kartoffeln, Lauch, 2 Möhren, 200 g Speck, Zwiebel, 4 Portionen"),
         src(LK + "kartoffelsuppe-1379.html", R, "cross-check: 500 g Kartoffeln, 200 g Möhren, 200 g Porree, 200 g Sellerie, 1 l Gemüsebrühe, 4 Wiener Würstchen à 80 g, 4 Personen")]),
    "wiener_einlage": dict(
        names={"hu": "Virsli levesbetétnek (2 db)", "de": "Wiener Würstchen als Einlage (2 Stück)", "de-AT": "Frankfurter als Einlage (2 Stück)", "en": "Two wiener sausages for the soup"},
        matrix="solid", servings_source=1, standard_serving_g=100,
        ingredients=[ing("frankfurter", 100, note="2 Wiener Würstchen; 50 g each is an estimate (lecker.de uses 80 g pieces)")],
        cooking=dict(method="warmed in the soup", mass_change_g=0, note="no mass change"),
        sources=[src(LK + "kartoffelsuppe-1379.html", R, "4 Wiener Würstchen à 80 g in 1 l Kartoffelsuppe, 4 Personen"),
                 src(GK + "linseneintopf-rezept-1608", R, "1 Paar Wiener Würstchen for 2 Portionen Linseneintopf")]),
    "steckruebeneintopf": eintopf(
        {"hu": "Karórépás egytálétel kolbásszal (Steckrübeneintopf)", "de": "Steckrübeneintopf mit Mettenden", "de-AT": "Kohlrübeneintopf mit Würsten", "en": "Swede stew with smoked sausage"},
        4, 450,
        [ing("swede", 800, note="1 kleine Steckrübe (ca. 800 g)"), ing("onion", g(2, "db_onion"), note="2 Zwiebeln"), ing("carrot", 200, note="2 Möhren (à ca. 100 g)"),
         ing("potato", 400, note="4 Kartoffeln (ca. 400 g)"), ing("sunflower_oil", g(1, "ek_oil"), "fat", "1 EL Öl"), ing("smoked_bacon", 100, note="100 g Speckwürfel"),
         *broth("veg_bouillon_powder", 1000, "1 l Gemüsebrühe"), ing("leek", g(1, "stg_lauch"), note="1 Stange (ca. 200 g) Lauch"),
         ing("kochmettwurst", 240, note="3 Mettenden; 80 g each is an estimate"), ing("parsley_leaf", g(0.5, "bund_herb"), "garnish", "1/2 Bund Petersilie"),
         ing("vinegar", g(3, "ek_vinegar"), "seasoning", "ca. 3 EL Essig")],
        -200, "bacon and onions browned, roots simmered ~25 min in broth, Mettenden heated in the stew",
        "estimate: ~20 % of the broth evaporates; sugar, nutmeg (MISSING) left out",
        [src(LK + "steckruebeneintopf-10763.html", R, "batch recipe: 1 Steckrübe (ca. 800 g), 2 Zwiebeln, 2 Möhren, 4 Kartoffeln, 1 EL Öl, 100 g Speckwürfel, 1 l Gemüsebrühe, 1 Stange Lauch, 3 Mettenden, Petersilie, Essig, 4 Personen"),
         src(GK + "klassischer-steckruebeneintopf-rezept-15073", R, "cross-check: 1 kg Steckrübe, 300 g Kartoffeln, 500 g Lauch, 250 g Möhren, 500 ml Gemüsebrühe, 4 Kochwürste, 4 Portionen")]),
    "bohneneintopf": eintopf(
        {"hu": "Zöldbabos egytálétel marhaszegyvel (Bohneneintopf)", "de": "Grüner Bohneneintopf mit Rindfleisch", "de-AT": "Fisoleneintopf mit Rindfleisch", "en": "Green bean stew with beef"},
        4, 450,
        [ing("smoked_bacon", 100, note="100 g Bauchspeck, durchwachsen, geräuchert"), ing("green_bean", 700, note="700 g Bohnen, grün"),
         ing("potato", g(4, "db_potato"), note="4 Stk Kartoffel"), ing("wheat_flour", g(2, "ek_flour"), "thickener", "2 EL Mehl, zum Binden"),
         ing("parsley_leaf", g(1, "bund_herb"), "garnish", "1 Bund Petersilie"), ing("beef_brisket", 1000, note="1 kg Rindfleisch, Bruststück"),
         *suppengruen(1), ing("water", 2000, "liquid", "2 l Wasser"), ing("onion", g(2, "db_onion"), note="2 Stk Zwiebel")],
        -800, "brisket simmered ~1.5 h with Suppengrün, beans and potatoes cooked in the broth, meat cut back into the pot",
        "estimate: the brisket loses ~30 % (~300 g) and ~25 % of the water evaporates (~500 g); Bohnenkraut (MISSING) left out",
        [src(GK + "bohneneintopf-rezept-2561", R, "batch recipe: 100 g Bauchspeck, 700 g grüne Bohnen, Bohnenkraut, 4 Kartoffeln, 2 EL Mehl, Petersilie, 1 kg Rinderbrust, 1 Bund Suppengrün, 2 l Wasser, 2 Zwiebeln, 4 Portionen"),
         src(GK + "schnibbelbohneneintopf-rezept-7316", R, "cross-check: 400 g Stangenbohnen, 200 g Kartoffeln, 100 g Frühstücksspeck, 150 g Zwiebeln, 600 ml Geflügelfond, Sahne, 4 Portionen")]),
    "gaisburger_marsch": eintopf(
        {"hu": "Gaisburgi marhahúsos egytál spätzlével és burgonyával (Gaisburger Marsch)", "de": "Gaisburger Marsch", "de-AT": "Gaisburger Marsch (Rindfleischeintopf mit Spätzle)", "en": "Gaisburger Marsch (Swabian beef stew with Spätzle and potatoes)"},
        4, 450,
        [ing("onion", g(4, "db_onion"), note="4 Zwiebeln (2 for the broth, 2 browned in butter)"), ing("beef_brisket", 500, note="500 g Rinderbrust"),
         *suppengruen(1), ing("potato", 500, note="500 g Kartoffeln"), ing("egg_pasta_dry", 125, note="125 g Spätzle (dry egg pasta, cooked in the broth)"),
         ing("parsley_leaf", g(1, "bund_herb"), "garnish", "1 Bund Petersilie"), ing("butter", 40, "fat", "40 g Butter oder Margarine (butter)"),
         ing("water", 1500, "liquid", "water for the beef broth; the source gives no amount, 1.5 l is an estimate")],
        -500, "brisket simmered ~2 h with marrow bones and Suppengrün, potatoes and Spätzle cooked in the strained broth, topped with onions browned in butter",
        "estimate: the brisket loses ~30 % (~150 g), ~350 g water evaporates; the Spätzle take their water from the broth (common.BOILED_YIELD note). Marrow bones not eaten; nutmeg (MISSING) left out",
        [src(LK + "gaisburger-marsch-8858.html", R, "batch recipe: 4 Zwiebeln, 500 g Rinderbrust, 2 Markknochen, 1 Bund Suppengrün, 500 g Kartoffeln, 125 g Spätzle, Petersilie, 40 g Butter, 4 Personen"),
         src(GK + "gaisburger-marsch-rezept-5043", R, "cross-check: 500 g Rinderbug, 1 kg Rinderknochen, Sellerie, Lauch, 2 Möhren, 2 Petersilienwurzeln, 400 g Salzkartoffeln, 400 g Spätzle (gekocht), 4 Portionen")]),
    "hochzeitssuppe": eintopf(
        {"hu": "Lakodalmi húsleves fasírtgombóccal és tojáspudinggal (Hochzeitssuppe)", "de": "Hochzeitssuppe (Hühnerbrühe mit Eierstich und Fleischklößchen)", "de-AT": "Hochzeitssuppe (Hühnersuppe mit Eierstich und Fleischknöderl)", "en": "Wedding soup (chicken broth with royale and meatballs)"},
        7, 350,
        [ing("chicken_broth", 1750, "liquid", "2 l Wasser with 1 Suppenhuhn (ca. 2 kg) simmered 2 h; the hen is taken out (not eaten, per the source); ~1.75 l strained broth is an estimate"),
         *suppengruen(1, "Bund Suppengrün, diced, cooked in the broth"), ing("egg", g(5, "db_egg"), note="5 Eier for the Eierstich"),
         ing("milk_whole", 52, "liquid", "1 Schuss Milch; 50 ml is an estimate"), ing("mixed_minced", 250, note="250 g Hackfleisch, gemischt (Fleischklößchen)")],
        0, "Eierstich set in a water bath and diced, small meatballs poached, both heated in the degreased broth",
        "the broth is counted as finished (BLS Hühnerbrühe); egg custard and meatballs change little; nutmeg (MISSING), herbs for garnish left out",
        [src(GK + "hochzeitssuppe-grundrezept-rezept-2489", R, "batch recipe: 1 Suppenhuhn (ca. 2 kg), 1 Bund Suppengrün, 2 l Wasser, 5 Eier, 1 Schuss Milch, 250 g Hackfleisch gemischt, 7 Portionen"),
         src(GK + "holsteiner-hochzeitssuppe-rezept-5674", R, "cross-check: Suppenhuhn, 1 kg Suppenfleisch, Markknochen, Gemüse, Kalbsbratwürste, Eierstich (3 Eier, 100 ml Milch), Grießklößchen, 10 Portionen")]),
    "pichelsteiner": eintopf(
        {"hu": "Pichelsteini egytál háromféle hússal (Pichelsteiner)", "de": "Pichelsteiner Eintopf", "de-AT": "Pichelsteiner Eintopf", "en": "Pichelsteiner stew (three meats and vegetables)"},
        4, 450,
        [*broth("bouillon_cube", 1200, "1.2 l Fleischbrühe, Instant"), ing("potato", 300, note="300 g Kartoffeln, festkochend"), ing("celeriac", 200, note="200 g Knollensellerie"),
         ing("lamb_shoulder", 200, note="200 g Lammfleisch, mager (BLS Lamm Bug/Schulter)"), ing("leek", 250, note="250 g Lauch"), ing("carrot", 200, note="200 g Möhren"),
         ing("sunflower_oil", g(4, "ek_oil"), "fat", "4 EL Öl"), ing("parsley_leaf", g(3, "ek_chopped_herbs"), "garnish", "3 EL Petersilie, gehackt"),
         ing("beef_chuck", 350, note="350 g Rindfleisch (shoulder cut is an estimate)"), ing("pork_leg", 350, note="350 g Schweineschnitzel (Oberschale)"),
         ing("white_cabbage", 250, note="250 g Weißkohl"), ing("onion", 300, note="300 g Zwiebeln")],
        -525, "meat browned in oil, layered with the vegetables, braised ~1.5 h in the broth",
        "estimate: the meat loses ~25 % (~225 g), ~300 g broth evaporates; thyme (MISSING) left out",
        [src(GK + "pichelsteiner-eintopf-rezept-7315", R, "batch recipe: 1.2 l Fleischbrühe, 300 g Kartoffeln, 200 g Sellerie, 200 g Lammfleisch, 250 g Lauch, 200 g Möhren, 4 EL Öl, Petersilie, 350 g Rindfleisch, 350 g Schweineschnitzel, 250 g Weißkohl, 300 g Zwiebeln, 4 Portionen"),
         src(LK + "pichelsteiner-eintopf-45249.html", R, "cross-check: 1 kg Querrippe, 3 Möhren, Petersilienwurzel, Sellerie, 600 g Kartoffeln, 600 g Wirsing, Porree, 4 Personen")]),
    "pfefferpotthast": eintopf(
        {"hu": "Vesztfáliai borsos marharagu (Pfefferpotthast)", "de": "Westfälischer Pfefferpotthast", "de-AT": "Pfefferpotthast (Rindfleisch-Zwiebel-Ragout)", "en": "Westphalian peppered beef and onion stew"},
        4, 350,
        [ing("clarified_butter", g(4, "ek_lard"), "fat", "4 EL Butterschmalz"), ing("beef_broth", 1000, "liquid", "1 l Fleischbrühe (BLS Fleischbrühe Rind)"),
         ing("breadcrumbs", g(6, "ek_breadcrumbs"), "thickener", "3 + 3 EL Paniermehl"), ing("beef_leg", 850, note="850 g Rindfleisch, mager (aus der Keule)"),
         ing("onion", 500, note="500 g Zwiebeln"), ing("lemon_juice", 15, "seasoning", "1 Bio-Zitrone: juice for seasoning; 15 g is an estimate")],
        -455, "beef browned in Butterschmalz, braised ~2 h with onions in the broth, thickened with breadcrumbs, peppered",
        "estimate: the beef loses ~30 % (~255 g), ~200 g broth evaporates; cloves, caraway, bay, pepper left out",
        [src(GK + "klassischer-pfefferpotthast-rezept-21134", R, "batch recipe: 4 EL Butterschmalz, 1 l Fleischbrühe, 6 EL Paniermehl, 850 g Rindfleisch (Keule), 500 g Zwiebeln, Zitrone, Gewürze, 4 Portionen"),
         src(LK + "westfaelischer-pfefferpotthast-2776.html", R, "cross-check: 750 g Zwiebeln, 750 g Rindfleisch, 30 g Schweineschmalz, 800 ml Rinderfond, 2 EL Paniermehl, Zitronensaft, 4 Personen")]),
    "blindhuhn": eintopf(
        {"hu": "Vesztfáliai babos-gyümölcsös egytál szalonnával (Blindhuhn)", "de": "Westfälisches Blindhuhn", "de-AT": "Blindhuhn (Bohneneintopf mit Obst und Speck)", "en": "Westphalian bean, fruit and bacon stew (Blindhuhn)"},
        4, 450,
        [ing("dry_bean", 200, note="200 g Bohnenkerne, weiß: dry weight, soaked 24 h (per the method)"),
         ing("water", 1200, "liquid", "soaking and cooking water; the source gives no amount, 1.2 l is an estimate"),
         ing("smoked_bacon", 400, note="400 g Speck, durchwachsen (smoked, as the cross-check)"), ing("green_bean", 300, note="300 g Brechbohnen"),
         ing("potato", 250, note="250 g Kartoffeln, festkochend"), ing("carrot", 250, note="250 g Möhren"), ing("apple_peeled", 200, note="200 g Äpfel, peeled (per the method)"),
         ing("pear", 200, note="200 g Birnen, fest"), ing("parsley_leaf", g(0.5, "bund_herb"), "garnish", "0.5 Bund Petersilie")],
        -300, "white beans simmered ~1.5 h with the bacon, vegetables, then apples and pears added for the last minutes",
        "estimate: ~25 % of the water evaporates; the beans take their water from the batch",
        [src(GK + "blindhuhn-rezept-7082", R, "batch recipe: 200 g Äpfel, 200 g Birnen, 200 g weiße Bohnenkerne, 300 g Brechbohnen, 250 g Kartoffeln, 250 g Möhren, Petersilie, 400 g Speck, 4 Portionen"),
         src(LK + "westfaelisches-blindhuhn-13297.html", R, "cross-check: 2 Zwiebeln, 300 g geräucherter Speck, 400 g grüne Bohnen, 300 g Kartoffeln, 300 g Möhren, 2 Äpfel, 2 Birnen, 1 Dose Bohnenkerne, 1 l Gemüsebrühe, 4 Personen")]),
}


def D(id, parts, aliases, tags=("soup", "traditional"), countries=("DE",), **kw):
    return dict(id=id, countries=list(countries), category="traditional", part_refs=parts, served_in="deep_plate", tags=list(tags), aliases=aliases, **kw)


SIDE_WITH = {"wiener_einlage": {"hu": "virslivel", "de": "mit Wiener Würstchen", "de-AT": "mit Würstel", "en": "with sausages"}}

DISHES = [
    D("de_erbsensuppe", [("erbsensuppe", 450)],
      {"de": ["erbsensuppe", "erbseneintopf", "erbsensuppe mit würstchen", "erbseneintopf mit wiener", "erbsensuppe mit wiener"], "de-AT": ["erbsensuppe mit würstel"],
       "hu": ["sárgaborsóleves virslivel", "német borsóleves"], "en": ["pea soup", "split pea soup with sausages", "german pea stew"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X464433", name="Erbsensuppe mit Gemüsebrühe, Suppengrün, Speck und Wiener Würstchen", kcal=103, fat=6.3, protein=5.38, net_carbs=5.0)),
    D("de_linseneintopf", [("linseneintopf", 450)],
      {"de": ["linseneintopf", "linsensuppe", "linseneintopf mit würstchen", "linsensuppe mit würstchen", "linsen mit würstchen"], "de-AT": ["linseneintopf mit würstel"],
       "hu": ["lencseleves virslivel", "német lencsefőzelék"], "en": ["lentil stew", "lentil soup with sausages"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X461913", name="Linsen-Eintopf mit Suppengemüse und Kartoffeln", kcal=122, fat=2, protein=6.84, net_carbs=16.2)),
    D("de_kartoffelsuppe", [("kartoffelsuppe", 400)],
      {"de": ["kartoffelsuppe", "kartoffelcremesuppe", "omas kartoffelsuppe"], "de-AT": ["erdäpfelcremesuppe"], "hu": ["burgonyakrémleves", "német krumplileves"], "en": ["potato soup", "creamy potato soup"]},
      side_options=[("wiener_einlage", 100)], alias_side_locale="de",
      alias_side={"kartoffelsuppe mit würstchen": "wiener_einlage", "kartoffelsuppe mit wiener": "wiener_einlage", "kartoffelsuppe mit wienern": "wiener_einlage"},
      reference_check=dict(catalog="bls:X449023", name="Kartoffelsuppe mit Gemüsebrühe", kcal=57, fat=1.8, protein=1.01, net_carbs=9.0,
                           deviation="RECEPTKÜLÖNBSÉG: a gutekueche-recept 200 g tejszínnel és kevés lével készül (sűrű krémleves); a BLS-összetétel tejszín nélküli híg leves; nem hangoltuk."),
      review="A virsli választható betét (de_kartoffelsuppe__wiener_einlage); a forrás maga virsli nélküli krémleves."),
    D("de_steckruebeneintopf", [("steckruebeneintopf", 450)],
      {"de": ["steckrübeneintopf", "steckrübensuppe", "steckrübeneintopf mit mettenden", "wruken-eintopf", "kohlrübeneintopf"], "de-AT": ["kohlrübeneintopf mit würsten"],
       "hu": ["karórépa-egytál", "karórépás egytál kolbásszal"], "en": ["swede stew", "rutabaga stew"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X461243", name="Kohlrüben-Eintopf mit Kasseler und Kartoffeln", kcal=76, fat=2.7, protein=6.8, net_carbs=5.34,
                           deviation="RECEPTKÜLÖNBSÉG: a lecker-recept Speckwürfellel és három Mettendével (zsíros főzőkolbász) készül, a BLS sovány Kasselerrel; nem hangoltuk.")),
    D("de_bohneneintopf", [("bohneneintopf", 450)],
      {"de": ["bohneneintopf", "grüner bohneneintopf", "bohnensuppe", "eintopf mit grünen bohnen", "grüne bohnensuppe"], "de-AT": ["fisoleneintopf"],
       "hu": ["zöldbabos egytál", "zöldbableves marhahússal"], "en": ["green bean stew", "green bean soup with beef"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X465713", name="Grüne-Bohnen-Eintopf mit Gemüsebrühe und Kartoffeln", kcal=46, fat=0.6, protein=1.5, net_carbs=8.0,
                           deviation="RECEPTKÜLÖNBSÉG: a forrás 1 kg marhaszegyet és füstölt szalonnát főz bele, a BLS-összetétel hús nélküli zöldbab-egytál; nem hangoltuk.")),
    D("de_gaisburger_marsch", [("gaisburger_marsch", 450)],
      {"de": ["gaisburger marsch", "gaisburger", "kartoffelschnitz und spätzle"], "de-AT": ["gaisburger marsch"], "hu": ["gaisburgi egytál", "sváb marhahúsos egytál"], "en": ["gaisburger marsch", "swabian beef stew"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X468713", name="Gaisburger Marsch", kcal=79, fat=2.6, protein=6.75, net_carbs=6.7)),
    D("de_hochzeitssuppe", [("hochzeitssuppe", 350)],
      {"de": ["hochzeitssuppe", "hühnersuppe mit eierstich und klößchen", "suppe mit eierstich"], "de-AT": ["hochzeitssuppe"], "hu": ["lakodalmi leves", "lakodalmas húsleves"], "en": ["wedding soup", "german wedding soup"]}),
    D("de_pichelsteiner", [("pichelsteiner", 450)],
      {"de": ["pichelsteiner", "pichelsteiner eintopf", "pichelsteiner topf"], "de-AT": ["pichelsteiner"], "hu": ["pichelsteini egytál", "háromhúsos egytál"], "en": ["pichelsteiner stew", "bavarian three meat stew"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X462023", name="Gemüse-Eintopf/Gemüsepichelsteiner, mit Rind- und Schweinefleisch", kcal=94, fat=5.1, protein=5.17, net_carbs=6.0,
                           deviation="RECEPTKÜLÖNBSÉG: a forrás sovány húsokat (sovány bárány, sertésszelet, marha) és sok levet használ, a BLS-összetétel zsírosabb húsokkal és kevesebb lével számol; nem hangoltuk.")),
    D("de_pfefferpotthast", [("pfefferpotthast", 350)],
      {"de": ["pfefferpotthast", "westfälischer pfefferpotthast", "pfeffer-potthast"], "de-AT": ["pfefferpotthast"], "hu": ["borsos marharagu", "vesztfáliai marharagu"], "en": ["pfefferpotthast", "peppered beef stew"]},
      tags=("stew", "traditional", "low-carb-friendly"),
      reference_check=dict(catalog="bls:Y146113", name="Westfälischer Pfefferpotthast mit Rindfleisch und Sauce", kcal=122, fat=6.2, protein=12.45, net_carbs=3.44)),
    D("de_blindhuhn", [("blindhuhn", 450)],
      {"de": ["blindhuhn", "westfälisches blindhuhn", "bohneneintopf mit birnen und äpfeln"], "de-AT": ["blindhuhn"], "hu": ["vesztfáliai babos egytál gyümölccsel"], "en": ["blindhuhn", "westphalian bean and fruit stew"]},
      tags=("soup", "stew", "traditional"),
      reference_check=dict(catalog="bls:X468453", name="Westfälischer Bohnen-Eintopf (mit weißen und grünen Bohnen, Kartoffeln, Speck, Kernobst)", kcal=98, fat=3, protein=5.29, net_carbs=10.1)),
]

MISSING = []
