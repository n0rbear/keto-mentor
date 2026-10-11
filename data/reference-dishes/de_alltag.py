"""Germany phase 4: everyday home and canteen dishes and salads (sources
read 2026-10-11)."""
from common import boiled_uptake, g, ing, src
from at_knoedel_nudeln import broth
from de_traditionell import part

R = "2026-10-11"
GK = "https://www.gutekueche.de/"
LK = "https://www.lecker.de/"

PARTS = {
    "nudelauflauf": part(
        {"hu": "Sonkás-sajtos rakott tészta tejszínnel (Nudelauflauf)", "de": "Nudelauflauf mit Schinken", "de-AT": "Schinkennudelauflauf", "en": "Pasta bake with ham and cheese"}, 6, 350,
        [ing("pasta_durum_dry", 300, note="300 g Nudeln (dry), boiled al dente"), ing("water", boiled_uptake("pasta_durum_dry", 300), "liquid", "water taken up by the boiled pasta (common.BOILED_YIELD)"),
         ing("ham_cooked", 120, note="120 g Schinken, gekocht am Stück"), ing("green_peas", 260, note="2 Tassen Erbsen, TK; 130 g per Tasse is an estimate"),
         ing("cream_30", g(2, "becher_200"), note="2 Bch Sahne"), ing("emmentaler", 100, note="100 g Emmentaler, gerieben"), ing("parmesan", 5, note="1 EL Parmesan, gerieben"),
         ing("tomato_paste", 5, "seasoning", "1 TL Tomatenmark"), ing("water", 150, "liquid", "1 Tasse Wasser"), ing("parsley_leaf", g(3, "ek_chopped_herbs"), "garnish", "3 EL Petersilie, gehackt")],
        -120, "boiled pasta mixed with ham, peas and cream sauce, topped with cheese, baked ~30 min",
        "estimate: ~8 % baking loss; Kräuterbutter (1 TL, MISSING) left out",
        [src(GK + "nudelauflauf-mit-schinken-rezept-2605", R, "batch recipe: 100 g Emmentaler, 2 Tassen Erbsen, 1 TL Kräuterbutter, 300 g Nudeln, Parmesan, Petersilie, 2 Bch Sahne, 120 g Schinken, 1 TL Tomatenmark, 1 Tasse Wasser, 6 Portionen"),
         src(GK + "schinkennudeln-rezept-4387", R, "cross-check: 500 g Spiralnudeln, 250 g Kochschinken, 200 ml Sahne, 300 ml Gemüsebrühe, 1 EL Mehl, Zwiebel, 4 Portionen")],
        flat=(0.30, 3.5)),
    "kartoffelgratin": part(
        {"hu": "Tejszínes rakott burgonya sajttal (Kartoffelgratin)", "de": "Kartoffelgratin", "de-AT": "Erdäpfelgratin", "en": "Potato gratin"}, 2, 250,
        [ing("potato", 500, note="500 g Kartoffeln, sliced raw"), ing("milk_whole", 129, "liquid", "125 ml Milch"), ing("cream_30", 125, note="125 ml Sahne"),
         ing("emmentaler", 35, note="5 EL Käse, gerieben, z.B. Emmentaler; 7 g per EL is an estimate"), ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Knoblauchzehe"),
         ing("butter", g(1, "ek_butter"), "fat", "1 EL Butter für die Form")],
        -80, "potato slices layered in a buttered dish with garlic milk-cream, topped with cheese, baked ~50 min",
        "estimate: ~10 % baking loss; rosemary, nutmeg (MISSING), salt, pepper left out",
        [src(GK + "kartoffelgratin-mit-sahne-rezept-741", R, "batch recipe: 1 EL Butter, 500 g Kartoffeln, 5 EL Käse, Knoblauch, 125 ml Milch, Muskat, Rosmarin, 125 ml Sahne, 2 Portionen"),
         src(GK + "kartoffelgratin-rezept-2677", R, "cross-check: 6 große Kartoffeln, 4 Stg Lauch, 100 g Speck, 500 ml Schlagsahne, 1 Tasse Rinderbrühe, Käse, 4 Portionen")],
        flat=(0.28, 3.5)),
    "nudelsalat": part(
        {"hu": "Német tésztasaláta Fleischwursttal (Nudelsalat)", "de": "Nudelsalat (mit Fleischwurst und Mayonnaise)", "de-AT": "Nudelsalat mit Extrawurst", "en": "German pasta salad with sausage"}, 4, 200,
        [ing("pasta_durum_dry", 200, note="200 g Nudeln (Hörnchen), dry, boiled"), ing("water", boiled_uptake("pasta_durum_dry", 200), "liquid", "water taken up by the boiled pasta (common.BOILED_YIELD)"),
         ing("fleischwurst", 100, note="100 g Fleischwurst am Stück"), ing("egg", g(2, "db_egg"), note="2 Eier, hart gekocht"), ing("egg_yolk", 18, note="1 Eigelb (home-made mayonnaise)"),
         ing("sunflower_oil", 115, "fat", "125 ml Salatöl (home-made mayonnaise)"), ing("vinegar", g(1, "ek_vinegar"), "seasoning", "1 EL Essig"),
         ing("mustard", g(2, "tk_mustard"), "seasoning", "2 TL Senf, mittelscharf"), ing("sugar", g(1, "tk_sugar"), "seasoning", "1 TL Zucker")],
        0, "boiled pasta, diced sausage and eggs folded into home-made mayonnaise", "no cooking after boiling; Gewürzgurken and Gurkenwasser (MISSING), salt left out",
        [src(GK + "klassischer-nudelsalat-rezept-2669", R, "batch recipe: 2 Eier, 100 g Fleischwurst, 2 Gewürzgurken, 200 g Nudeln, 1 Eigelb, 1 EL Essig, 1 EL Gurkenwasser, 125 ml Salatöl, 2 TL Senf, 1 TL Zucker, 4 Portionen"),
         src(GK + "klassischer-nudelsalat-rezept-5673", R, "cross-check: 300 g Fusilli, 150 g Fleischwurst, 200 g Erbsen, 150 g Mais, 1 Eigelb, 150 g Joghurt, 100 ml Sonnenblumenöl, 3 EL Essig, 4 Portionen")],
        matrix="dry", bulk=0.65, flat=(0.25, 3.0)),
    "eiersalat": part(
        {"hu": "Tojássaláta majonézzel", "de": "Eiersalat", "de-AT": "Eiaufstrich (Eiersalat)", "en": "Egg salad"}, 4, 125,
        [ing("egg", g(6, "db_egg"), note="6 Eier, hart gekocht"), ing("mayonnaise", 200, note="200 g Mayonnaise"), ing("mustard", g(1, "tk_mustard"), "seasoning", "1 TL Senf"),
         ing("soy_sauce", 15, "seasoning", "1 EL Sojasauce"), ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Knoblauchzehe"), ing("sugar", g(1, "tk_sugar"), "seasoning", "1 TL Zucker")],
        0, "chopped hard-boiled eggs folded into seasoned mayonnaise", "no cooking; cayenne, salt left out",
        [src(GK + "eiersalat-rezept-1593", R, "batch recipe: 6 Eier, 200 g Mayonnaise, 1 TL Senf, 1 EL Sojasauce, Knoblauch, 1 TL Zucker, Cayenne, 4 Portionen"),
         src(GK + "eiersalat-rezept-3686", R, "cross-check: 5 Eier, 80 g Emmentaler, Paprika, Zwiebel, 3 EL Öl, 2 EL Weißweinessig, 4 Portionen")]),
    "putengeschnetzeltes": part(
        {"hu": "Tejszínes-mustáros pulykaragu (Putengeschnetzeltes)", "de": "Putengeschnetzeltes in Rahmsoße", "de-AT": "Putengeschnetzeltes in Rahmsauce", "en": "Turkey strips in cream sauce"}, 4, 300,
        [ing("turkey_breast", 500, note="500 g Putenbrustfilet, in strips"), ing("rapeseed_oil", g(2, "ek_oil"), "fat", "2 EL Rapsöl"), ing("onion", g(2, "db_onion"), note="2 Zwiebeln"),
         ing("mustard", g(3, "ek_mustard"), note="3 EL Senf, mittelscharf"), *broth("veg_bouillon_powder", 200, "200 ml Gemüsebrühe"), ing("cream_30", g(1, "becher_200"), note="1 Bch Schlagsahne")],
        -180, "turkey strips seared, onions sweated, deglazed with broth, simmered with cream and mustard",
        "estimate: turkey loses ~20 % (~100 g), ~80 g sauce reduces; white wine (MISSING), thyme, paprika, salt, pepper left out",
        [src(GK + "putengeschnetzeltes-rezept-1775", R, "batch recipe: 500 g Putenbrustfilet, 2 EL Rapsöl, 3 EL Senf, 2 Zwiebeln, 200 ml Gemüsebrühe, 1 Bch Schlagsahne, 100 ml Weißwein, 4 Portionen"),
         src(GK + "rahmgeschnetzeltes-rezept-654", R, "cross-check: 450 g Kalbsgeschnetzeltes, 300 g Champignons, 4 Schalotten, 1 Bch Schlagsahne, 2 EL Butterschmalz, 4 Portionen")],
        matrix="liquid", flat=(0.30, 2.5)),
    "pellkartoffeln_quark": part(
        {"hu": "Héjában főtt burgonya túrókrémmel és lenmagolajjal", "de": "Pellkartoffeln mit Quark und Leinöl", "de-AT": "Erdäpfel in der Schale mit Topfen und Leinöl", "en": "Jacket potatoes with quark and linseed oil"}, 4, 450,
        [ing("potato", 1200, note="1,2 kg festkochende Kartoffeln, boiled in their skin and peeled at the table"), ing("quark_lean", 500, note="500 g Magerquark"),
         ing("sour_cream_20_bls", 500, note="500 g Schmand"), ing("linseed_oil", g(2, "ek_oil"), "fat", "2 EL Leinöl"), ing("onion", g(2, "db_onion"), note="2 Zwiebeln"),
         ing("chives", g(1, "bund_herb"), "garnish", "1 Bund Schnittlauch"), ing("lemon_juice", 20, "seasoning", "Saft von 1/2 Zitrone")],
        0, "potatoes boiled in their skins; quark whipped with Schmand, onion, chives and lemon, drizzled with linseed oil",
        "no net mass change for the boiled potatoes (estimate); sugar, salt, pepper left out",
        [src(LK + "pellkartoffeln-mit-quark-2158.html", R, "batch recipe: 1,2 kg Kartoffeln, 2 Zwiebeln, 500 g Magerquark, 500 g Schmand, 2 EL Leinöl, Schnittlauch, 1/2 Zitrone, 4 Personen"),
         src(GK + "pellkartoffeln-mit-quark-rezept-1658", R, "cross-check: 1 kg Kartoffeln, 500 g Quark 20 %, 250 g Quark, Milch, 2 Zwiebeln, Schnittlauch, 4 Portionen")],
        flat=(0.32, 3.0)),
    "ofenkartoffel": part(
        {"hu": "Sült burgonya héjában (Ofenkartoffel)", "de": "Ofenkartoffel", "de-AT": "Ofenerdäpfel", "en": "Baked potato"}, 4, 150,
        [ing("potato", 700, note="700 g Kartoffeln, mehligkochend, with skin (counted as peeled potato)"), ing("olive_oil", g(2, "ek_oil"), "fat", "2 EL Olivenöl"),
         ing("parsley_leaf", g(2, "ek_chopped_herbs"), "garnish", "2 EL Kräuter (parsley is an estimate)")],
        -110, "potatoes halved, brushed with oil and herbs, baked ~45 min", "estimate: ~15 % baking loss; salt left out",
        [src(GK + "ofenkartoffeln-rezept-2260", R, "batch recipe: 700 g mehligkochende Kartoffeln, 2 EL Kräuter, 2 EL Olivenöl, 2 TL Salz, 4 Portionen"),
         src(GK + "folienkartoffeln-rezept-1752", R, "cross-check: 8 große Kartoffeln, 4 Knoblauchzehen, 8 TL Olivenöl, Rosmarin, 4 Portionen")]),
    "kraeuterquark": part(
        {"hu": "Snidlinges túrókrém (Kräuterquark)", "de": "Kräuterquark", "de-AT": "Kräutertopfen", "en": "Herb quark"}, 4, 75,
        [ing("quark_40", 250, note="250 g Quark (40 %)"), ing("milk_whole", 46, "liquid", "45 ml Milch"), ing("chives", g(0.5, "bund_herb"), "garnish", "0.5 Bund Schnittlauch")],
        0, "quark stirred smooth with milk and chives", "no cooking; salt, pepper left out",
        [src(GK + "kraeuterquark-rezept-9333", R, "batch recipe: 45 ml Milch, 250 g Quark (40 %), 0.5 Bund Schnittlauch, 4 Portionen"),
         src(GK + "pellkartoffeln-mit-quark-rezept-1658", R, "cross-check: Quark mit Milch und Schnittlauch zu Kartoffeln, 4 Portionen")]),
    "obstsalat": part(
        {"hu": "Gyümölcssaláta", "de": "Obstsalat", "de-AT": "Obstsalat", "en": "Fruit salad"}, 4, 250,
        [ing("pineapple", 300, note="300 g Ananas"), ing("apple", 300, note="2 Äpfel; 150 g each is an estimate"), ing("raspberry", 120, note="120 g Himbeeren"),
         ing("kiwi", 160, note="2 Kiwis; 80 g each peeled is an estimate"), ing("mango", 250, note="1 Mango; 250 g flesh is an estimate"), ing("nectarine", 260, note="2 Nektarinen; 130 g each is an estimate"),
         ing("watermelon", 400, note="400 g Wassermelone"), ing("honey", 28, "seasoning", "4 TL Honig; 7 g per TL is an estimate")],
        0, "fruit cut and mixed with honey and lime juice", "no cooking; lime juice and mint (MISSING) left out",
        [src(GK + "obstsalat-rezept-1456", R, "batch recipe: 300 g Ananas, 2 Äpfel, 120 g Himbeeren, 4 TL Honig, 2 Kiwis, Limette, Mango, Minze, 2 Nektarinen, 400 g Wassermelone, 4 Portionen"),
         src(GK + "obstsalat-rezept-24062", R, "cross-check: 1/2 Banane, 1 Kiwi, 30 g Johannisbeeren, 1 EL Dickmilch, 1 Portion")],
        matrix="dry", bulk=0.65),
    "kaese_lauch_suppe": part(
        {"hu": "Sajtos-póréhagymás leves darált hússal (Käse-Lauch-Suppe)", "de": "Käse-Lauch-Suppe mit Hackfleisch", "de-AT": "Käse-Lauch-Suppe mit Faschiertem", "en": "Cheese and leek soup with minced meat"}, 4, 400,
        [ing("mixed_minced", 500, note="500 g Hackfleisch, gemischt"), ing("leek", 500, note="2 Stg Lauch, groß; 250 g each is an estimate"), ing("onion", 150, note="1 Zwiebel, groß; 150 g is an estimate"),
         ing("rapeseed_oil", g(2, "ek_oil"), "fat", "2 EL Rapsöl"), *broth("veg_bouillon_powder", 750, "750 ml Gemüsebrühe"),
         ing("processed_cheese_spread", 400, note="400 g Schmelzkäse (BLS Schmelzkäsezubereitung 45-52 % F. i. Tr.)")],
        -150, "mince browned with onion, leek simmered in broth, processed cheese melted in",
        "estimate: the mince loses ~15 % (~75 g) and ~75 g broth evaporates; salt, pepper left out",
        [src(GK + "kaese-lauch-suppe-mit-hackfleisch-rezept-19299", R, "batch recipe: 750 ml Gemüsebrühe, 500 g Hackfleisch gemischt, 2 Stg Lauch, 2 EL Rapsöl, 400 g Schmelzkäse, 1 Zwiebel, 4 Portionen"),
         src(GK + "kaese-lauchsuppe-mit-hackfleisch-rezept-2265", R, "cross-check: 1 l Gemüsebrühe, 500 g Hackfleisch, 3 Stg Lauch, 250 g Schmelzkäse, 200 g Crème fraîche, 3 Zwiebeln, 4 Portionen")],
        matrix="liquid"),
    "bockwurst": part(
        {"hu": "Bockwurst (nagy virsli)", "de": "Bockwurst", "de-AT": "Bockwurst (Knacker-Art)", "en": "Bockwurst (large frankfurter)"}, 1, 95,
        [ing("bockwurst", 95, note="1 Bockwurst = mean of Henrici 4 Stück ca. 440 g (110 g) and Halberstädter 5 Stück 400 g (80 g)")],
        0, "heated in hot water", "no mass change",
        [src("https://www.rewe.de/shop/p/metzgerei-henrici-bockwurst-ca-440g-4-stueck/8631300", R, "Metzgerei Henrici Bockwurst ca. 440 g, 4 Stück"),
         src("https://www.mein-deal.com/?p=1437789", R, "Halberstädter Bockwurst, 5 Stück im Glas 400 g")]),
    "muesli_milch": part(
        {"hu": "Müzli tejjel", "de": "Müsli mit Milch", "de-AT": "Müsli mit Milch", "en": "Muesli with milk"}, 1, 169,
        [ing("muesli", 40, note="40 g Müsli: one portion as declared on Kölln Hafer-Müsli (BLS Müslimischung mit Trockenfrüchten, gesüßt)"),
         ing("milk_whole", 129, "liquid", "125 ml Milch, the usual label portion for breakfast cereal (whole milk is an estimate)")],
        0, "assembled, no cooking", "no cooking",
        [src("https://www.rewe.de/shop/p/koelln-fruchtiges-hafer-muesli-1200g/9551252", R, "Kölln Fruchtiges Hafer-Müsli: Portion 40 g"),
         src("https://www.fatsecret.fr/calories-nutrition/kelloggs/corn-flakes/1-portion-125-ml-de-lait-demi-ecreme", R, "cross-check: 1 Portion Frühstücksflocken (30 g) mit 125 ml Milch")]),
    "cornflakes_milch": part(
        {"hu": "Kukoricapehely tejjel", "de": "Cornflakes mit Milch", "de-AT": "Cornflakes mit Milch", "en": "Cornflakes with milk"}, 1, 159,
        [ing("cornflakes", 30, note="30 g Cornflakes (label portion; BLS Cornflakes gesüßt)"), ing("milk_whole", 129, "liquid", "125 ml Milch (whole milk is an estimate; the label uses semi-skimmed)")],
        0, "assembled, no cooking", "no cooking",
        [src("https://www.fatsecret.fr/calories-nutrition/kelloggs/corn-flakes/1-portion-125-ml-de-lait-demi-ecreme", R, "Kellogg's Corn Flakes: 1 Portion 30 g mit 125 ml Milch"),
         src("https://fddb.info/db/de/lebensmittel/kelloggs_cornflakes_die_originalen/index.html", R, "Kellogg's Cornflakes die Originalen: Portion 30 g")]),
}


def D(id, parts, aliases, served_in="flat_plate", tags=("everyday",), countries=("DE",), **kw):
    return dict(id=id, countries=list(countries), category="everyday", part_refs=parts, served_in=served_in, tags=list(tags), aliases=aliases, **kw)


DISHES = [
    D("de_wiener_kartoffelsalat", [("frankfurter_wuerstel", 122.5), ("kartoffelsalat_nord", 250)],
      {"de": ["würstchen mit kartoffelsalat", "wiener mit kartoffelsalat", "wiener würstchen mit kartoffelsalat", "kartoffelsalat mit würstchen"], "de-AT": ["frankfurter mit erdäpfelsalat"],
       "hu": ["virsli krumplisalátával", "virsli majonézes krumplisalátával"], "en": ["sausages with potato salad", "frankfurters with potato salad"]},
      names={"hu": "Két virsli majonézes krumplisalátával", "de": "Wiener Würstchen mit Kartoffelsalat", "de-AT": "Frankfurter mit Erdäpfelsalat", "en": "Wiener sausages with potato salad"},
      optional_toppings=[{"food_key": "mustard", "g": 15, "hu": "mustár"}], tags=("everyday", "traditional"),
      review="Két virsli (2 x 61,25 g, at_alltag frankfurter_wuerstel) északi majonézes krumplisalátával; déli (ecetes) salátával is gyakori."),
    D("de_nudelauflauf", [("nudelauflauf", 350)],
      {"de": ["nudelauflauf", "nudelauflauf mit schinken", "schinkennudelauflauf", "nudelauflauf mit käse"], "de-AT": ["nudelauflauf"], "hu": ["sonkás rakott tészta", "tejszínes rakott tészta"], "en": ["pasta bake", "ham and cheese pasta bake"]},
      tags=("everyday", "higher-carb")),
    D("de_kartoffelgratin", [("kartoffelgratin", 250)],
      {"de": ["kartoffelgratin", "gratin dauphinois", "kartoffelauflauf mit sahne", "überbackene kartoffeln"], "de-AT": ["erdäpfelgratin"], "hu": ["tejszínes rakott burgonya", "burgonyagratin"], "en": ["potato gratin", "gratin dauphinois"]},
      tags=("everyday", "vegetarian", "higher-carb")),
    D("de_nudelsalat", [("nudelsalat", 200)],
      {"de": ["nudelsalat", "klassischer nudelsalat", "nudelsalat mit fleischwurst", "nudelsalat mit mayonnaise", "omas nudelsalat"], "de-AT": ["nudelsalat"], "hu": ["tésztasaláta", "majonézes tésztasaláta"], "en": ["pasta salad", "german pasta salad"]},
      tags=("everyday", "salad", "higher-carb"),
      reference_check=dict(catalog="bls:X1A3020", name="Salat aus Eierteigwaren, würzig, mit Mayonnaise, gestreckt mit Joghurt", kcal=141, fat=9.17, protein=2.6, net_carbs=11.0,
                           deviation="RECEPTKÜLÖNBSÉG: a recept házi majonézt kever 125 ml olajból, a BLS-referencia joghurttal hígított majonézzel készül; nem hangoltuk.")),
    D("de_eiersalat", [("eiersalat", 125)],
      {"de": ["eiersalat", "eiersalat mit mayonnaise", "eiersalatbrot"], "de-AT": ["eiaufstrich"], "hu": ["tojássaláta", "majonézes tojássaláta"], "en": ["egg salad", "egg mayonnaise"]},
      tags=("everyday", "eggs", "low-carb-friendly")),
    D("de_putengeschnetzeltes", [("putengeschnetzeltes", 300)],
      {"de": ["putengeschnetzeltes", "putengeschnetzeltes in rahmsoße"], "de-AT": ["putengeschnetzeltes"], "hu": ["tejszínes pulykaragu", "pulykacsíkok tejszínes mártásban"], "en": ["turkey strips in cream sauce", "creamy turkey"]},
      side_options=[("parolt_rizs", 180), ("spaetzle", 200)], alias_side_locale="de",
      alias_side={"geschnetzeltes mit reis": "parolt_rizs", "putengeschnetzeltes mit reis": "parolt_rizs", "geschnetzeltes mit spätzle": "spaetzle"},
      served_in="deep_plate", tags=("everyday", "poultry", "low-carb-friendly"),
      review="A bare 'Geschnetzeltes' (Zürcher, borjú) és a csirkés változat nem ide mutat: ez pulykamellből készül."),
    D("de_pellkartoffeln_quark", [("pellkartoffeln_quark", 450)],
      {"de": ["pellkartoffeln mit quark", "pellkartoffeln mit quark und leinöl", "kartoffeln mit quark", "quark mit leinöl und kartoffeln", "kräuterquark mit kartoffeln"], "de-AT": ["erdäpfel mit topfen"],
       "hu": ["héjában főtt krumpli túróval", "krumpli túrókrémmel"], "en": ["jacket potatoes with quark", "potatoes with quark and linseed oil"]},
      tags=("everyday", "vegetarian")),
]

DISHES += [
    D("de_kaese_lauch_suppe", [("kaese_lauch_suppe", 400)],
      {"de": ["käse-lauch-suppe", "käse lauch suppe", "käse-lauch-suppe mit hackfleisch", "partysuppe", "käse-porree-suppe"], "de-AT": ["käse-lauch-suppe"], "hu": ["sajtos póréhagyma-leves", "sajtos-darálthúsos leves"], "en": ["cheese leek soup", "cheesy leek and mince soup"]},
      served_in="deep_plate", tags=("everyday", "soup", "low-carb-friendly")),
    D("de_bockwurst_kartoffelsalat", [("bockwurst", 95), ("kartoffelsalat_nord", 250)],
      {"de": ["bockwurst mit kartoffelsalat", "bockwurst und kartoffelsalat"], "de-AT": ["bockwurst mit erdäpfelsalat"], "hu": ["bockwurst krumplisalátával"], "en": ["bockwurst with potato salad"]},
      names={"hu": "Bockwurst majonézes krumplisalátával", "de": "Bockwurst mit Kartoffelsalat", "de-AT": "Bockwurst mit Erdäpfelsalat", "en": "Bockwurst with potato salad"},
      optional_toppings=[{"food_key": "mustard", "g": 15, "hu": "mustár"}]),
    D("de_muesli_milch", [("muesli_milch", 169)],
      {"de": ["müsli mit milch", "müsli", "schüssel müsli", "früchtemüsli mit milch"], "de-AT": ["müsli mit milch"], "hu": ["müzli tejjel"], "en": ["muesli with milk", "bowl of muesli"]},
      served_in="deep_plate", tags=("breakfast", "higher-carb")),
    D("de_cornflakes_milch", [("cornflakes_milch", 159)],
      {"de": ["cornflakes mit milch", "cornflakes", "schüssel cornflakes"], "de-AT": ["cornflakes mit milch"], "hu": ["kukoricapehely tejjel", "cornflakes tejjel"], "en": ["cornflakes with milk", "bowl of cornflakes"]},
      served_in="deep_plate", tags=("breakfast", "higher-carb")),
    D("de_ofenkartoffel_kraeuterquark", [("ofenkartoffel", 250), ("kraeuterquark", 100)],
      {"de": ["ofenkartoffel mit kräuterquark", "folienkartoffel mit kräuterquark", "baked potato mit quark", "ofenkartoffel mit quark", "kartoffel mit kräuterquark"], "de-AT": ["ofenerdäpfel mit kräutertopfen"],
       "hu": ["sült krumpli snidlinges túrókrémmel"], "en": ["baked potato with herb quark", "jacket potato with quark"]},
      names={"hu": "Sült burgonya snidlinges túrókrémmel", "de": "Ofenkartoffel mit Kräuterquark", "de-AT": "Ofenerdäpfel mit Kräutertopfen", "en": "Baked potato with herb quark"},
      tags=("everyday", "vegetarian")),
    D("de_obstsalat", [("obstsalat", 250)],
      {"de": ["obstsalat", "fruchtsalat", "frischer obstsalat"], "de-AT": ["obstsalat"], "hu": ["gyümölcssaláta"], "en": ["fruit salad"]},
      served_in="deep_plate", tags=("everyday", "sweet", "vegetarian")),
    D("de_bratkartoffeln_spiegelei", [("bratkartoffeln", 250), ("tukortojas", 106)],
      {"de": ["bratkartoffeln mit spiegelei", "bratkartoffeln mit ei", "bratkartoffeln mit spiegeleiern"], "de-AT": ["geröstete erdäpfel mit spiegelei"], "hu": ["pirított burgonya tükörtojással"], "en": ["fried potatoes with fried egg"]},
      names={"hu": "Pirított burgonya szalonnával és tükörtojással", "de": "Bratkartoffeln mit Spiegelei", "de-AT": "Geröstete Erdäpfel mit Spiegelei", "en": "German fried potatoes with fried eggs"},
      tags=("everyday", "eggs", "higher-carb")),
]

MISSING = [
    dict(food_key="mint_lime_juice", names={"hu": "menta, limelé", "de": "Minze, Limettensaft", "en": "mint, lime juice"}, needed_for=["obstsalat (5 Bl Minze, 1 Limette)"],
         note="No mint record and no lime-juice record in BLS 4.0 or the catalog (only the whole Limette); left out."),
    dict(food_key="herb_butter", names={"hu": "fűszervaj", "de": "Kräuterbutter", "en": "herb butter"}, needed_for=["nudelauflauf (1 TL)"],
         note="No Kräuterbutter record in BLS 4.0 or the catalog; left out (not replaced by plain butter)."),
]
