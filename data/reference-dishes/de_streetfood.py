"""Germany phase 4: street food - Currywurst stand, Bratwurst grill, Fischbude,
Kirmes and Weihnachtsmarkt (sources read 2026-10-11). Sausage piece weights
come from retail packs; grilling yields from the BLS raw -> gegrillt pairs.
Currypulver has no BLS 4.0 record (as in Austria), so the curry sauce is
counted without it (MISSING)."""
from common import breaded, g, ing, src
from de_traditionell import part

R = "2026-10-11"
GK = "https://www.gutekueche.de/"
LK = "https://www.lecker.de/"
REWE = "https://www.rewe.de/shop/p/"

S_BROETCHEN = [src("https://www.supermarktcheck.de/product/181802-gut-guenstig-gute-laune-weizenbroetchen-360g", R, "Gut & Günstig Weizenbrötchen 360 g, 6 Stück (60 g)"),
               src("https://www.test.de/Aufbackbroetchen-Die-besten-zum-Fruehstueck-4206027-5707401/detail/330000012640!14/", R, "Lidl Grafschafter Weizenbrötchen, 6 Stück 360 g (60 g)")]
ROLL = "1 Brötchen, 60 g (de_backwaren broetchen)"


def grilled(names, key, raw_g, yield_, yield_note, sources, extra=(), servings=1):
    loss = round(raw_g * (1 - yield_))
    return part(names, servings, (raw_g + sum(i["raw_g"] for i in extra) - loss) / servings, [ing(key, raw_g, note=sources[0]["note"]), *extra], -loss,
                "grilled or pan-fried at the stand", f"{yield_note}; the fat that renders out stays on the grill (drippings)", sources, drippings="grill")


PARTS = {
    "currysauce": part(
        {"hu": "Curryszósz (ketchup alapú, Currywursthoz)", "de": "Currysoße (für Currywurst)", "de-AT": "Currysauce (für Currywurst)", "en": "Curry ketchup sauce (for Currywurst)"}, 6, 80,
        [ing("ketchup", 570, note="500 ml Tomatenketchup (1.14 g/ml)"), ing("onion", g(2, "db_onion"), note="2 Zwiebeln, mittelgroß"), ing("olive_oil", g(2, "ek_oil"), "fat", "2 EL Olivenöl"),
         ing("honey", g(1, "ek_honey"), "seasoning", "1 EL Honig"), ing("soy_sauce", 10, "seasoning", "1 Schuss Sojasauce; 10 g is an estimate"), ing("tomato_paste", 5, "seasoning", "1 TL Tomatenmark"),
         ing("brown_sugar", 4, "seasoning", "1 TL Zucker, braun"), ing("water", 30, "liquid", "1 Schuss Wasser; 30 ml is an estimate")],
        -60, "onions sweated in oil, simmered with ketchup and the seasonings", "estimate: ~7 % reduction; Currypulver (2 EL, MISSING), Balsamico (3 EL, MISSING), chili left out. ~80 g sauce on one Currywurst (estimate)",
        [src(GK + "currysauce-fuer-die-currywurst-rezept-1796", R, "batch recipe: 500 ml Tomatenketchup, 2 Zwiebeln, 2 EL Olivenöl, 2 EL Currypulver, 3 EL Balsamico, 1 EL Honig, Sojasauce, 1 TL Tomatenmark, 1 TL brauner Zucker, 6 Portionen"),
         src(GK + "currywurst-sauce-rezept-7754", R, "cross-check: 500 g Tomaten (Dose), 2 EL Tomatenmark, 5 EL Öl, Currypulver, Ananassaft, Zwiebel, 6 Portionen")],
        matrix="liquid"),
    "currywurst_ohne_darm": grilled(
        {"hu": "Berlini curry-kolbász bőr nélkül", "de": "Currywurst ohne Darm (Berliner Art)", "de-AT": "Currywurst ohne Darm", "en": "Skinless Berlin curry sausage"},
        "currybratwurst", 100, 0.889, "yield 0.889 from BLS W221300 -> W221372 gegrillt (protein 10.92 -> 12.28)",
        [src(REWE + "mischau-berliner-currywurst-ohne-darm-2x100g/7957159", R, "Mischau Berliner Currywurst ohne Darm 2 x 100 g"),
         src("https://lebensmittelpraxis.de/fleisch/39699-ohne-darm-currywurst-unter-schutz.html", R, "cross-check: 'Berliner Currywurst ohne Darm' is a protected Berlin Brühwurst (Mischau one of the producers)")]),
    "currywurst_darm": grilled(
        {"hu": "Grillezett sütnivaló kolbász bőrrel (Currywursthoz)", "de": "Bratwurst mit Darm (für Currywurst)", "de-AT": "Bratwurst (für Currywurst)", "en": "Grilled bratwurst with skin (for Currywurst)"},
        "bratwurst", 135, 0.889, "yield 0.889 from BLS W222100 -> W222172 gegrillt (protein 15.2 -> 17.1)",
        [src(LK + "pommes-schranke-mit-bratwurst-63294.html", R, "4 Bratwürste à ca. 150 g for Pommes Schranke mit Bratwurst; 135 g = mean with the next source"),
         src("https://www.ichkoche.at/currywurst-rezept-89404", "2026-10-05", "4 Bratwürste, 480 g, for 4 Currywurst (120 g each)")]),
    "thueringer_rostbratwurst": grilled(
        {"hu": "Grillezett türingiai kolbász (Thüringer Rostbratwurst)", "de": "Thüringer Rostbratwurst (gegrillt)", "de-AT": "Thüringer Rostbratwurst", "en": "Grilled Thuringian sausage"},
        "rostbratwurst", 100, 0.879, "yield 0.879 from BLS W222600 -> W222672 gegrillt (protein 15.9 -> 18.09)",
        [src(REWE + "thueringer-original-thueringer-rostbratwurst-5x100g-500g/2229314", R, "Thüringer Original Thüringer Rostbratwurst 5 x 100 g"),
         src("https://www.supermarktcheck.de/product/387294-die-thueringer-rostbratwurst-5-x100g", R, "Die Thüringer Rostbratwurst 5 x 100 g")]),
    "nuernberger_drei": grilled(
        {"hu": "Három grillezett nürnbergi kolbászka", "de": "Drei Nürnberger Rostbratwürstchen (gegrillt)", "de-AT": "Drei Nürnberger Würstel", "en": "Three grilled Nuremberg sausages"},
        "rostbratwurst", 67.5, 0.879, "3 x 22.5 g; yield 0.879 from BLS W222600 -> W222672 gegrillt (the BLS Rostbratwurst record covers Nürnberger too)",
        [src("https://world.openfoodfacts.org/product/22152480/nurenberger-rostbradwurste-howe", R, "Nürnberger Rostbratwürstchen, 6 Stück 125 g (~21 g)"),
         src("https://www.mf58.de/en/products/original-nuernberger-bratwurst", R, "Original Nürnberger Rostbratwurst: 7-9 cm, 20-25 g per piece; 22.5 g = mean")]),
    "broetchen_street": part(
        {"hu": "Német zsemle (Brötchen)", "de": "Brötchen", "de-AT": "Semmel", "en": "Bread roll"}, 1, 60, [ing("wheat_roll", 60, note=ROLL)], 0, "bought baked", "no cooking", S_BROETCHEN),
    "fischbroetchen_matjes": part(
        {"hu": "Matjesheringes zsemle hagymával", "de": "Fischbrötchen mit Matjes", "de-AT": "Matjessemmel", "en": "Matjes herring roll"}, 1, 135,
        [ing("wheat_roll", 60, note=ROLL), ing("matjes", 60, note="1 Matjesfilet; 60 g is an estimate (4 Matjesfilets for 4 Brötchen in the source)"),
         ing("onion", 15, note="Zwiebelringe; 15 g is an estimate")],
        0, "assembled, no cooking", "no cooking; lettuce, gherkin (MISSING) left out",
        [src(LK + "sylter-fischbroetchen-matjes-mit-sansibar-geheimnis-77221.html", R, "4 Brötchen, 4 Matjesfilets, Salat, Gewürzgurken, 4 Stück"),
         src(LK + "fischbroetchen-selber-machen-so-gehts-59074.html", R, "cross-check: Fischbrötchen mit Matjes oder Bismarckhering, Zwiebelringen und Salat")]),
    "fischbroetchen_bismarck": part(
        {"hu": "Bismarck-heringes zsemle hagymával", "de": "Fischbrötchen mit Bismarckhering", "de-AT": "Semmel mit Bismarckhering", "en": "Bismarck herring roll"}, 1, 135,
        [ing("wheat_roll", 60, note=ROLL), ing("bismarck_herring", 60, note="1 Bismarckfilet; 60 g is an estimate"), ing("onion", 15, note="Zwiebelringe; 15 g is an estimate")],
        0, "assembled, no cooking", "no cooking; lettuce, gherkin (MISSING) left out",
        [src(LK + "fischbroetchen-selber-machen-so-gehts-59074.html", R, "Fischbrötchen mit Matjes oder Bismarckhering, Zwiebelringen und Salat"),
         src(LK + "rheinischer-heringsstipp-28593.html", R, "cross-check: doppelte Bismarckherings-Filets (fillet size)")]),
    "backfischbroetchen": part(
        {"hu": "Rántott halas zsemle (Backfischbrötchen)", "de": "Backfischbrötchen", "de-AT": "Backfischsemmel", "en": "Battered fish roll"}, 4, 200,
        [ing("wheat_roll", 240, note="4 Brötchen, 60 g each"), ing("pollock_saithe", 500, note="500 g Fischfilet ohne Haut (Seelachs)"), ing("egg", g(1, "db_egg"), note="1 Ei (Bierteig)"),
         ing("wheat_flour", 75, note="75 g Mehl (Bierteig)"), ing("corn_starch", 30, note="30 g Speisestärke (Bierteig)"), ing("beer_lager", 125, "liquid", "125 ml Bier (Bierteig)"),
         ing("sunflower_oil", 65, "absorbed_fat", "4-6 EL Öl zum Ausbacken: 65 g, all taken up (estimate)"), ing("creme_fraiche", g(3, "ek_sour_cream"), note="3 EL Crème fraîche"),
         ing("beetroot_juice", 15, "seasoning", "3 TL Bete-Saft")],
        -150, "fish pieces in beer batter fried, laid in the rolls with pink crème fraîche",
        "estimate: fish and batter lose ~15 % while frying; dill, lemon zest, salt left out. 1 Brötchen per serving",
        [src(LK + "sylter-fischbroetchen-backfisch-im-bierteig-77142.html", R, "batch recipe: 1 Ei, 75 g Mehl, 30 g Speisestärke, 125 ml Bier, 500 g Seelachsfilet, 4-6 EL Öl, 3 EL Crème fraîche, 3 TL Bete-Saft, 4 Brötchen, 4 Stück"),
         src(LK + "knuspriger-backfisch-mit-remoulade-16688.html", R, "cross-check: 700 g Kabeljau in Bierteig (1 Ei, 75 g Mehl, 50 g Stärke, 150-175 ml Bier), 150 ml Öl, Remoulade, 4 Personen")]),
    "krabbenbroetchen": part(
        {"hu": "Északi-tengeri garnélás zsemle (Krabbenbrötchen)", "de": "Krabbenbrötchen (Büsumer Art)", "de-AT": "Krabbensemmel", "en": "North Sea shrimp roll"}, 2, 245,
        [ing("multigrain_roll", 125, note="2 Mehrkorn- oder Roggenbrötchen; 62.5 g each (de_backwaren koernerbroetchen)"), ing("butter", g(2, "ek_butter"), "fat", "2 EL Butter"),
         ing("lettuce", 40, note="4 Bl Kopfsalat; 10 g each is an estimate"), ing("shrimp_north_sea", 240, note="240 g Nordseekrabben"), ing("remoulade", 60, note="4 EL Remoulade"),
         ing("parsley_leaf", 2, "garnish", "2 zw Petersilie")],
        0, "assembled, no cooking", "no cooking",
        [src(GK + "buesumer-krabbenbroetchen-rezept-16919", R, "batch recipe: 2 EL Butter, 4 Bl Kopfsalat, 2 Mehrkorn- oder Roggenbrötchen, 240 g Nordseekrabben, Petersilie, 4 EL Remoulade, 2 Portionen"),
         src(LK + "krabbenbroetchen-75751.html", R, "cross-check: 4 Brötchen, 40 g Butter, 400 g Nordsee-Krabbenfleisch, 150 g Salat-Mayonnaise, Salat, Gurke, 4 Personen")]),
    "butterbrezel": part(
        {"hu": "Vajas lúgos perec (Butterbrezel)", "de": "Butterbrezel", "de-AT": "Butterbreze", "en": "Buttered soft pretzel"}, 1, 101,
        [ing("pretzel_roll", 86, note="1 Laugenbrezel, 86 g (mean of SPAR 82 g and 90 g, at_fruehstueck)"), ing("butter", 15, "fat", "butter, sliced brezel spread; 15 g is an estimate")],
        0, "sliced and buttered", "no cooking",
        [src("https://www.spar.at/produktwelt/spar-naturpur-bio-laugenbreze/p/2020003447693", "2026-10-05", "SPAR Natur*pur Bio-Laugenbreze 82 g"),
         src("https://www.spar.at/produktwelt/s-budget-laugenbreze/p/7904356", "2026-10-05", "S-BUDGET Laugenbreze 90 g"),
         src(GK + "brezeln-selbst-gemacht-rezept-4060", R, "cross-check: Laugenbrezeln selbst gemacht")]),
    "reibekuchen": part(
        {"hu": "Rajnai burgonyalepény (Reibekuchen)", "de": "Reibekuchen (Kartoffelpuffer)", "de-AT": "Erdäpfelpuffer (Reibekuchen)", "en": "Potato pancakes (Reibekuchen)"}, 4, 200,
        [ing("potato", 1000, note="1 kg Kartoffeln, überwiegend festkochend, grated"), ing("onion", 120, note="2 Zwiebeln, klein; 60 g each is an estimate"), ing("egg", g(2, "db_egg"), note="2 Eier, Gr. M"),
         ing("wheat_flour", g(1, "ek_flour"), note="1 EL Mehl"), ing("breadcrumbs", g(4, "ek_breadcrumbs"), note="2 + 2 EL Paniermehl"),
         ing("sunflower_oil", 90, "absorbed_fat", "1 Schuss Pflanzenöl for shallow frying: ~90 g taken up is an estimate (BLS Reibekuchen gebraten ~12.6 % fat)")],
        -470, "grated potato with onion, egg and crumbs, squeezed, fried in flat cakes",
        "estimate: the grated potato is squeezed and loses ~40 % water while frying; salt left out",
        [src(GK + "kartoffelpuffer-mit-apfelmus-rezept-2017", R, "batch recipe: 1 kg Kartoffeln, 2 Eier, 1 EL Mehl, 4 EL Paniermehl, Pflanzenöl, 2 Zwiebeln, 400 g Apfelmus, 4 Portionen"),
         src(GK + "reibekuchen-rezept-1867", R, "cross-check: 1 kg Kartoffeln, 2 Eier, 1 EL Mehl, 1 Zwiebel, Öl, 3 Portionen")]),
    "apfelmus": part(
        {"hu": "Almapüré", "de": "Apfelmus", "de-AT": "Apfelmus", "en": "Apple sauce"}, 4, 100,
        [ing("apple_sauce", 400, note="400 g Apfelmus (store-bought, sweetened: judgement)")], 0, "served cold", "no cooking",
        [src(GK + "kartoffelpuffer-mit-apfelmus-rezept-2017", R, "400 g Apfelmus for 4 Portionen Kartoffelpuffer"),
         src(GK + "reibekuchen-rezept-1867", R, "Reibekuchen (served with Apfelmus or Rübenkraut)")]),
    "flammkuchen": part(
        {"hu": "Elzászi lepény (Flammkuchen)", "de": "Flammkuchen (Elsässer Art)", "de-AT": "Flammkuchen", "en": "Tarte flambée (Flammkuchen)"}, 4, 360,
        [ing("wheat_flour", 420, note="420 g Mehl"), ing("yeast_fresh", 12, note="12 g Hefe, frisch"), ing("water", 250, "liquid", "250 ml Wasser, lauwarm"),
         ing("creme_fraiche", 200, note="200 g Crème fraîche"), ing("quark_40", 300, note="300 g Sahnequark (BLS Speisequark Fettstufe 40 % F. i. Tr.)"),
         ing("smoked_bacon", 150, note="150 g Speck"), ing("onion", 250, note="250 g Zwiebeln")],
        -150, "thin yeast dough spread with crème fraîche and quark, topped with onion and bacon, baked very hot",
        "estimate: ~10 % baking loss; salt left out. One Flammkuchen (1/4) per serving",
        [src(GK + "original-franzoesischer-flammkuchen-rezept-856", R, "batch recipe: 12 g Hefe, 420 g Mehl, 250 ml Wasser, 200 g Crème fraîche, 300 g Sahnequark, 150 g Speck, 250 g Zwiebeln, 4 Portionen"),
         src(GK + "flammkuchen-rezept-2133", R, "cross-check: 200 g Mehl, 125 ml Milch, 150 g Speckwürfel, 150 g saure Sahne, Zwiebel, 2 EL Öl, 2 Portionen")]),
    "schaschlik": part(
        {"hu": "Saslik nyárs paradicsomos szószban (Imbiss)", "de": "Schaschlik in Soße", "de-AT": "Schaschlik mit Sauce", "en": "Schaschlik skewers in sauce"}, 4, 350,
        [ing("pork_neck", 1000, note="1 kg Schweinefleisch (Schweinenacken)"), ing("bell_pepper_red", 150, note="2 Paprika, gelb und rot: one red"), ing("yellow_bell_pepper", 150, note="one yellow; 150 g each is an estimate"),
         ing("onion", 350, note="2 + 0.5 + 1 Zwiebeln"), ing("olive_oil", g(2, "ek_oil"), "fat", "2 EL Olivenöl"), ing("tomato_canned", 400, note="1 Dose Tomaten, geschält (400 g)"),
         ing("tomato_passata", 500, note="1 Dose Tomaten, passiert (500 g)"), ing("ketchup", g(1, "ek_ketchup"), "seasoning", "1 EL Ketchup"), ing("mustard", g(1, "ek_mustard"), "seasoning", "1 EL Senf")],
        -450, "pork, pepper and onion skewers fried, then braised in a tomato sauce (Imbiss style)",
        "estimate: the pork loses ~25 % (~250 g) and ~200 g sauce reduces; curry powder (MISSING), salsa sauce, salt, pepper left out. 2 Spieße with sauce per serving",
        [src(GK + "schaschlik-rezept-1811", R, "batch recipe: 1 kg Schweinenacken, 2 Paprika, 3.5 Zwiebeln, 2 EL Olivenöl, 1 Dose geschälte und 1 Dose passierte Tomaten, Ketchup, Senf, Curry, 4 Portionen"),
         src(GK + "schaschlik-spiesse-rezept-2688", R, "cross-check: 2 kg Schweinenacken, 10 Schb Speck, 4 Paprika, 5 rote Zwiebeln, 2 EL Öl, Schaschlik-Sauce, 8 Portionen")],
        matrix="liquid"),
    "crepe_nutella": part(
        {"hu": "Mogyorókrémes palacsinta (crêpe, utcai)", "de": "Crêpe mit Nutella", "de-AT": "Crêpe mit Nuss-Nougat-Creme", "en": "Crêpe with chocolate hazelnut spread"}, 6, 200,
        [ing("wheat_flour", 250, note="250 g Mehl"), ing("egg", g(4, "db_egg"), note="4 Eier, Gr. M"), ing("milk_whole", 515, "liquid", "500 ml Milch"), ing("butter", 50, "fat", "50 g Butter"),
         ing("sunflower_oil", g(3, "tk_oil"), "fat", "3 TL Pflanzenöl"), ing("vanilla_sugar", g(1, "pkg_vanilla_sugar"), note="1 Pk Vanillezucker"),
         ing("nut_nougat_cream", 80, note="4 EL Nutella (Schokocreme); 20 g each is an estimate"), ing("banana", 240, note="2 Bananen; 120 g each is an estimate")],
        -150, "thin crêpes baked in butter, spread with Nutella and banana slices, folded",
        "estimate: ~11 % steam loss; salt left out",
        [src(GK + "crepes-mit-nutella-rezept-11184", R, "batch recipe: 2 Bananen, 50 g Butter, 4 Eier, 250 g Mehl, 500 ml Milch, 4 EL Nutella, 3 TL Öl, 1 Pk Vanillezucker, 6 Portionen"),
         src(GK + "crepes-grundrezept-rezept-11178", R, "cross-check: 1 Ei, 100 g Mehl, 200 ml Milch, Öl, 6 Portionen")]),
    "gebrannte_mandeln": part(
        {"hu": "Pörkölt cukros mandula (gebrannte Mandeln)", "de": "Gebrannte Mandeln", "de-AT": "Gebrannte Mandeln", "en": "Candied roasted almonds"}, 4, 100,
        [ing("almond", 200, note="200 g Mandeln"), ing("sugar", 200, note="200 g Zucker"), ing("vanilla_sugar", g(1, "pkg_vanilla_sugar"), note="1 Pk Vanillezucker"),
         ing("water", 130, "liquid", "130 ml Wasser")],
        -130, "almonds boiled in sugar water until the sugar caramelises around them", "the water evaporates. One 100 g Tüte per serving (fairground bag size, estimate)",
        [src(GK + "gebrannte-mandeln-rezept-2067", R, "batch recipe: 200 g Mandeln, 1 Pk Vanillezucker, 130 ml Wasser, 200 g Zucker"),
         src(GK + "gebrannte-mandeln-rezept-1616", R, "cross-check: 200 g Mandeln, 125 ml Wasser, 250 g Zucker, Zimt")]),
    "rot_weiss": part(
        {"hu": "Ketchup és majonéz (piros-fehér)", "de": "Ketchup und Mayonnaise (rot-weiß)", "de-AT": "Ketchup und Mayonnaise", "en": "Ketchup and mayonnaise"}, 1, 40,
        [ing("ketchup", 20, note="Ketchup, ~20 g (estimate)"), ing("salad_mayonnaise", 20, note="Salatmayonnaise, ~20 g (estimate; 4 EL for 4 portions in the source)")],
        0, "served on the fries", "no cooking",
        [src(LK + "pommes-schranke-mit-bratwurst-63294.html", R, "Pommes Schranke: 4 EL Salatmayonnaise and curry-ketchup sauce for 4 portions"),
         src(GK + "pommes-frites-rezept-6753", R, "Pommes frites (served with Ketchup or Mayonnaise)")]),
}


def D(id, parts, aliases, served_in="handheld", tags=("street_food",), countries=("DE",), **kw):
    return dict(id=id, countries=list(countries), category="street_food", part_refs=parts, served_in=served_in, tags=list(tags), aliases=aliases, **kw)


SIDE_WITH = {"broetchen_street": {"hu": "zsemlével", "de": "mit Brötchen", "de-AT": "mit Semmel", "en": "with a bread roll"},
             "apfelmus": {"hu": "almapürével", "de": "mit Apfelmus", "de-AT": "mit Apfelmus", "en": "with apple sauce"}}
CURRY_SIDES = [("hasabburgonya", 170), ("broetchen_street", 60)]

DISHES = [
    D("de_currywurst", [("currywurst_ohne_darm", 89), ("currysauce", 80)],
      {"de": ["currywurst", "currywurst ohne darm", "berliner currywurst", "curry ohne", "eine currywurst", "currywurst mit soße"], "de-AT": ["berliner currywurst"],
       "hu": ["currywurst", "berlini currywurst"], "en": ["currywurst", "berlin currywurst", "curry sausage"]},
      names={"hu": "Berlini currywurst (bőr nélkül, curryszósszal)", "de": "Currywurst ohne Darm (Berliner Art)", "de-AT": "Currywurst ohne Darm", "en": "Berlin currywurst (skinless)"},
      side_options=CURRY_SIDES, alias_side_locale="de",
      alias_side={"currywurst mit pommes": "hasabburgonya", "currywurst pommes": "hasabburgonya", "currywurst mit brötchen": "broetchen_street", "curry pommes": "hasabburgonya"},
      tags=("street_food", "low-carb-friendly"),
      review="A bare 'currywurst' választás: a DE bőr nélküli és bőrös változat, valamint az osztrák at_currywurst (mind natív igény). Curry nélkül számolva (MISSING)."),
    D("de_currywurst_darm", [("currywurst_darm", 120), ("currysauce", 80)],
      {"de": ["currywurst mit darm", "currywurst", "ruhrpott currywurst", "curry mit darm", "bratwurst mit currysoße"], "de-AT": ["currywurst mit darm"], "hu": ["currywurst bőrrel"], "en": ["currywurst with skin", "bratwurst currywurst"]},
      names={"hu": "Currywurst bőrös sütnivaló kolbászból", "de": "Currywurst mit Darm", "de-AT": "Currywurst mit Darm", "en": "Currywurst with skin (bratwurst)"},
      side_options=CURRY_SIDES, alias_side_locale="de",
      alias_side={"currywurst mit darm und pommes": "hasabburgonya", "currywurst mit darm mit pommes": "hasabburgonya"},
      tags=("street_food", "low-carb-friendly")),
    D("de_pommes_rot_weiss", [("hasabburgonya", 170), ("rot_weiss", 40)],
      {"de": ["pommes rot-weiß", "pommes rot weiß", "pommes schranke", "pommes mit ketchup und mayo", "pommes mit mayo und ketchup", "pommes spezial"], "de-AT": ["pommes mit ketchup und mayonnaise"],
       "hu": ["sült krumpli ketchuppal és majonézzel"], "en": ["fries with ketchup and mayonnaise"]},
      names={"hu": "Sült krumpli ketchuppal és majonézzel (rot-weiß)", "de": "Pommes rot-weiß", "de-AT": "Pommes mit Ketchup und Mayonnaise", "en": "Fries with ketchup and mayonnaise"},
      tags=("street_food", "higher-carb")),
    D("de_thueringer_broetchen", [("thueringer_rostbratwurst", 88), ("broetchen_street", 60)],
      {"de": ["thüringer rostbratwurst", "thüringer", "thüringer im brötchen", "rostbratwurst im brötchen", "thüringer bratwurst"], "de-AT": ["thüringer rostbratwurst"], "hu": ["türingiai kolbász zsemlében"], "en": ["thuringian sausage in a roll", "thuringian bratwurst"]},
      names={"hu": "Türingiai grillkolbász zsemlében", "de": "Thüringer Rostbratwurst im Brötchen", "de-AT": "Thüringer Rostbratwurst in der Semmel", "en": "Thuringian sausage in a bread roll"},
      optional_toppings=[{"food_key": "mustard", "g": 15, "hu": "mustár"}], tags=("street_food",),
      reference_check=dict(catalog="bls:Y945062", name="Rostbratwurst mit Brötchen und Senf", kcal=222, fat=10.28, protein=15.27, net_carbs=16.36)),
    D("de_drei_im_weggla", [("nuernberger_drei", 59.5), ("broetchen_street", 60)],
      {"de": ["drei im weggla", "3 im weggla", "drei im weckla", "nürnberger im brötchen", "drei nürnberger im brötchen"], "de-AT": ["drei nürnberger in der semmel"], "hu": ["három nürnbergi kolbász zsemlében"], "en": ["three nuremberg sausages in a roll"]},
      names={"hu": "Három nürnbergi kolbászka zsemlében (Drei im Weggla)", "de": "Drei im Weggla (Nürnberger im Brötchen)", "de-AT": "Drei Nürnberger in der Semmel", "en": "Three Nuremberg sausages in a roll"},
      optional_toppings=[{"food_key": "mustard", "g": 15, "hu": "mustár"}], tags=("street_food",)),
    D("de_bockwurst_broetchen", [("bockwurst", 95), ("broetchen_street", 60)],
      {"de": ["bockwurst mit brötchen", "bockwurst im brötchen", "bockwurst mit senf und brötchen"], "de-AT": ["bockwurst mit semmel"], "hu": ["bockwurst zsemlével"], "en": ["bockwurst with a roll"]},
      names={"hu": "Bockwurst zsemlével", "de": "Bockwurst mit Brötchen", "de-AT": "Bockwurst mit Semmel", "en": "Bockwurst with a bread roll"},
      optional_toppings=[{"food_key": "mustard", "g": 15, "hu": "mustár"}], tags=("street_food",)),
    D("de_fischbroetchen_matjes", [("fischbroetchen_matjes", 135)],
      {"de": ["fischbrötchen mit matjes", "matjesbrötchen", "matjes-brötchen", "fischbrötchen", "matjes im brötchen"], "de-AT": ["matjessemmel"], "hu": ["matjesheringes zsemle", "halas zsemle"], "en": ["matjes herring roll", "fish roll"]},
      tags=("street_food", "fish"),
      reference_check=dict(catalog="bls:Y610512", name="Matjes-Brötchen", kcal=187, fat=8.21, protein=11.87, net_carbs=15.2),
      review="A bare 'fischbrötchen' választás: Matjes, Bismarck vagy Backfisch."),
    D("de_fischbroetchen_bismarck", [("fischbroetchen_bismarck", 135)],
      {"de": ["fischbrötchen mit bismarckhering", "bismarckbrötchen", "bismarck-brötchen", "fischbrötchen", "brötchen mit bismarckhering"], "de-AT": ["semmel mit bismarckhering"], "hu": ["bismarck-heringes zsemle", "halas zsemle"], "en": ["bismarck herring roll", "fish roll"]},
      tags=("street_food", "fish")),
    D("de_backfischbroetchen", [("backfischbroetchen", 200)],
      {"de": ["backfischbrötchen", "fischbrötchen mit backfisch", "backfisch im brötchen", "fischbrötchen"], "de-AT": ["backfischsemmel"], "hu": ["rántott halas zsemle"], "en": ["battered fish roll", "fried fish sandwich", "fish roll"]},
      tags=("street_food", "fish", "fried")),
    D("de_krabbenbroetchen", [("krabbenbroetchen", 245)],
      {"de": ["krabbenbrötchen", "büsumer krabbenbrötchen", "nordseekrabbenbrötchen", "brötchen mit krabben"], "de-AT": ["krabbensemmel"], "hu": ["garnélás zsemle", "északi-tengeri garnélás zsemle"], "en": ["shrimp roll", "north sea shrimp roll"]},
      tags=("street_food", "fish")),
    D("de_butterbrezel", [("butterbrezel", 101)],
      {"de": ["butterbrezel", "butterbrezn", "brezel mit butter", "brezn mit butter", "butterbreze"], "de-AT": ["butterbreze"], "hu": ["vajas perec", "vajas lúgos perec"], "en": ["buttered pretzel", "pretzel with butter"]},
      tags=("street_food", "breakfast", "higher-carb")),
    D("de_reibekuchen", [("reibekuchen", 200), ("apfelmus", 100)],
      {"de": ["reibekuchen mit apfelmus", "kartoffelpuffer mit apfelmus", "reibekuchen", "reibeplätzchen", "rievkooche", "kartoffelpuffer", "reiberdatschi mit apfelmus"], "de-AT": ["erdäpfelpuffer mit apfelmus"],
       "hu": ["burgonyalepény almapürével", "tócsni almaszósszal"], "en": ["potato pancakes with apple sauce", "reibekuchen"]},
      names={"hu": "Rajnai burgonyalepény almapürével", "de": "Reibekuchen mit Apfelmus", "de-AT": "Erdäpfelpuffer mit Apfelmus", "en": "Potato pancakes with apple sauce"},
      tags=("street_food", "fried", "higher-carb"),
      reference_check=dict(catalog="bls:X655022", name="Kartoffelpuffer/Reibekuchen, gebraten", kcal=206, fat=12.61, protein=4.23, net_carbs=18.08,
                           deviation="RECEPTKÜLÖNBSÉG: a referencia csak a lepény, az étel 100 g cukrozott almapürével együtt van számolva; nem hangoltuk."),
      review="A 'kartoffelpuffer' és 'reibekuchen' német alias korábban az osztrák at_erdaepfelpuffer-é volt (de alias, nem natív); most a DE étel natív igénye."),
    D("de_flammkuchen", [("flammkuchen", 360)],
      {"de": ["flammkuchen", "elsässer flammkuchen", "flammkuchen mit speck und zwiebeln", "flammkuchen klassisch"], "de-AT": ["flammkuchen"], "hu": ["elzászi lepény", "flammkuchen"], "en": ["tarte flambee", "flammkuchen"]},
      tags=("street_food", "higher-carb"),
      reference_check=dict(catalog="bls:X934412", name="Flammkuchen Elsässer Art", kcal=233, fat=11.3, protein=8.74, net_carbs=23.0)),
    D("de_schaschlik", [("schaschlik", 350)],
      {"de": ["schaschlik", "schaschlik in soße", "schaschlikspieß", "zigeunerspieß"], "de-AT": ["schaschlik"], "hu": ["saslik", "saslik nyárs szósszal"], "en": ["shashlik", "schaschlik skewer"]},
      side_options=[("hasabburgonya", 170)], alias_side_locale="de", alias_side={"schaschlik mit pommes": "hasabburgonya"},
      served_in="flat_plate", tags=("street_food", "low-carb-friendly")),
    D("de_crepe_nutella", [("crepe_nutella", 200)],
      {"de": ["crêpe mit nutella", "crepe mit nutella", "crêpes mit nutella", "nutella-crêpe", "crêpe mit nutella und banane"], "de-AT": ["crêpe mit nutella"], "hu": ["nutellás palacsinta", "nutellás crêpe"], "en": ["nutella crepe", "crepe with nutella"]},
      tags=("street_food", "sweet", "higher-carb")),
    D("de_gebrannte_mandeln", [("gebrannte_mandeln", 100)],
      {"de": ["gebrannte mandeln", "tüte gebrannte mandeln", "kandierte mandeln"], "de-AT": ["gebrannte mandeln"], "hu": ["pörkölt cukros mandula", "égetett mandula"], "en": ["candied almonds", "roasted sugared almonds"]},
      tags=("street_food", "sweet", "higher-carb")),
]

MISSING = [
    dict(food_key="curry_powder", names={"hu": "curry fűszerpor", "de": "Currypulver", "en": "curry powder"}, needed_for=["currysauce (2 EL)", "schaschlik (a pinch)"],
         note="BLS 4.0 has curry only in composite foods (Curryketchup, Currysauce); left out (as in at-missing-foods)."),
    dict(food_key="balsamic_vinegar", names={"hu": "balzsamecet", "de": "Balsamico-Essig", "en": "balsamic vinegar"}, needed_for=["currysauce (3 EL)"],
         note="No Aceto balsamico record in BLS 4.0 or the catalog; left out."),
    dict(food_key="dill", names={"hu": "kapor", "de": "Dill", "en": "dill"}, needed_for=["backfischbroetchen (4 Stiel)"],
         note="No dill record in BLS 4.0 or the catalog; left out."),
]
