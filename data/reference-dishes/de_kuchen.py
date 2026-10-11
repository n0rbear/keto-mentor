"""Germany phase 4: cakes and desserts (Kaffee und Kuchen), sources read
2026-10-11. Cakes are built from their recipes; one serving is one piece of
the source's tray or tin. Baking losses are estimates (marked)."""
from common import g, ing, src
from de_traditionell import part

R = "2026-10-11"
GK = "https://www.gutekueche.de/"
LK = "https://www.lecker.de/"

PARTS = {
    "schwarzwaelder_kirschtorte": part(
        {"hu": "Fekete-erdei meggytorta", "de": "Schwarzwälder Kirschtorte", "de-AT": "Schwarzwälder Kirschtorte", "en": "Black Forest gateau"}, 16, 150,
        [ing("egg", g(4, "db_egg"), note="4 Eier"), ing("sugar", 150 + g(1, "ek_sugar") + g(1, "tk_sugar"), note="150 g Zucker (sponge) + 1 EL + 1 TL Zucker (cherries)"),
         ing("wheat_flour", 80, note="80 g Mehl"), ing("corn_starch", 75 + 35, note="75 g Speisestärke (sponge) + 35 g (cherries)"), ing("cocoa_powder", 25, note="25 g Kakaopulver"),
         ing("baking_powder", g(3, "tl_baking_powder"), note="3 TL Backpulver, gestrichen"), ing("water", 75, "liquid", "5 EL Wasser"),
         ing("sour_cherry_jar", 350, note="1 Glas Kirschen, entsteint (720 ml jar): ~350 g drained cherries is an estimate"),
         ing("sour_cherry_juice", 250, "liquid", "the jar juice thickened with starch: ~250 ml, as sour cherry juice (estimate)"),
         ing("fruit_brandy", 150, note="10 EL Kirschwasser"), ing("cream_30", 1000, note="1000 g Schlagsahne"), ing("cream_stabilizer", g(1, "pkg_sahnesteif"), note="1 Pk Sahnesteif"),
         ing("vanilla_sugar", g(2, "pkg_vanilla_sugar"), note="2 Pk Vanillinzucker"), ing("dark_chocolate", 100, note="100 g Raspelschokolade")],
        -110, "chocolate sponge baked and cut in three, layered with Kirschwasser, thickened cherries and whipped cream, decorated with chocolate",
        "estimate: the sponge loses ~15 % while baking (~90 g), the cherry compote ~20 g; cinnamon stick and lemon peel removed, salt left out. 16 pieces",
        [src(GK + "schwarzwaelder-kirschtorte-rezept-1620", R, "batch recipe: 4 Eier, 150 g Zucker, 80 g Mehl, 75 g Speisestärke, 25 g Kakao, 3 TL Backpulver, 1 Glas Kirschen, 35 g Speisestärke, 10 EL Kirschwasser, 1000 g Schlagsahne, 1 Pk Sahnesteif, 2 Pk Vanillinzucker, 100 g Raspelschokolade, 16 Stück"),
         src(LK + "schwarzwaelder-kirschtorte-5133.html", R, "cross-check: 6 Eier, 175 g Zucker, 150 g Mehl, 185 g Speisestärke, 50 g Kakao, 12 TL Kirschwasser, 1 Glas Sauerkirschen, 800 g Schlagsahne, 12 Stücke")]),
    "kaesekuchen": part(
        {"hu": "Német túrótorta omlós tésztán (Käsekuchen)", "de": "Käsekuchen (mit Mürbeteig)", "de-AT": "Topfenkuchen (mit Mürbteig)", "en": "German quark cheesecake"}, 12, 185,
        [ing("wheat_flour", 300, note="300 g Weizenmehl, Type 405"), ing("butter", 200, "fat", "200 g Butterflöckchen, kalt"), ing("sugar", 100 + 150, note="100 g Zucker (Mürbeteig) + 150 g Zucker (filling)"),
         ing("egg", g(5, "db_egg"), note="1 Ei (Teig) + 4 Eier (filling)"), ing("quark_lean", 1000, note="1 kg Quark, Magerstufe"), ing("cream_30", g(2, "becher_200"), note="2 Bch Schlagsahne"),
         ing("pudding_powder_vanilla", g(1, "pkg_pudding_powder"), note="1 Pk Vanillepuddingpulver")],
        -190, "shortcrust lined in a springform, filled with quark-cream custard, baked ~70 min",
        "estimate: ~8 % baking loss; salt left out. 12 pieces",
        [src(GK + "kaesekuchen-mit-muerbteig-rezept-239", R, "batch recipe: 300 g Mehl, 200 g Butter, 100 g Zucker, 1 Ei; 1 kg Magerquark, 4 Eier, 2 Bch Schlagsahne, 1 Pk Vanillepuddingpulver, 150 g Zucker, 12 Stück"),
         src(GK + "kaesekuchen-rezept-936", R, "cross-check (small): 250 g Magerquark, 1 Ei, 45 ml Öl, 18 g Puddingpulver, 60 g Zucker, 3 Portionen")]),
    "bienenstich": part(
        {"hu": "Méhcsípés torta (Bienenstich)", "de": "Bienenstich mit Puddingfüllung", "de-AT": "Bienenstich", "en": "Bee sting cake (Bienenstich)"}, 20, 105,
        [ing("wheat_flour", 375, note="375 g Mehl"), ing("egg", g(3, "db_egg"), note="3 Eier"), ing("butter", 150 + 75, "fat", "150 g Butter (dough) + 75 g Butter (topping)"),
         ing("sugar", 150 + 100 + g(2, "ek_sugar"), note="150 g (dough) + 100 g (topping) + 2 EL Zucker (filling)"), ing("vanilla_sugar", g(1, "pkg_vanilla_sugar"), note="1 Pk Vanillezucker"),
         ing("baking_powder", g(0.5, "pkg_baking_powder"), note="0.5 Pk Backpulver"), ing("cream_30", 125 + 100, note="125 ml Sahne (dough) + 100 ml Sahne (topping)"),
         ing("honey", g(5, "ek_honey"), note="5 EL Honig"), ing("almond", 300, note="300 g Mandelsplitter"), ing("milk_whole", 515, "liquid", "0.5 l Milch (pudding filling)"),
         ing("pudding_powder_vanilla", g(1, "pkg_pudding_powder"), note="1 Pk Vanillepuddingpulver")],
        -150, "cake base baked under a honey-almond caramel, split and filled with vanilla pudding",
        "estimate: ~10 % baking loss; vanilla pod scraped (negligible). 20 pieces",
        [src(GK + "bienenstich-mit-pudding-rezept-3506", R, "batch recipe: 375 g Mehl, 3 Eier, 150 g Butter, 150 g Zucker, 125 ml Sahne, Backpulver; 5 EL Honig, 300 g Mandelsplitter, 100 ml Sahne, 100 g Zucker, 75 g Butter; 0.5 l Milch, 1 Pk Puddingpulver, 2 EL Zucker, 20 Stück"),
         src(GK + "bienenstich-rezept-2041", R, "cross-check: 5 Eier, 120 g Mehl, 200 g Zucker, 150 g Mandelblättchen, 3 EL Butter, 250 ml Milch, 1 Pk Puddingpulver, 250 ml Schlagsahne, 8 Stück")]),
    "streuselkuchen": part(
        {"hu": "Morzsás sütemény (Streuselkuchen)", "de": "Streuselkuchen vom Blech", "de-AT": "Streuselkuchen", "en": "Crumb cake (Streuselkuchen)"}, 16, 90,
        [ing("wheat_flour", 200 + 400, note="200 g Mehl (base) + 400 g Mehl (Streusel)"), ing("egg", g(4, "db_egg"), note="4 Eier"), ing("sugar", 250 + 260, note="250 g + 260 g Zucker"),
         ing("butter", 200, "fat", "200 g Butter"), ing("baking_powder", g(2, "tl_baking_powder"), note="2 TL Backpulver"), ing("cream_30", 100, note="100 ml Schlagsahne zum Beträufeln")],
        -150, "sponge base on a tray covered with butter crumbs, baked, drizzled with cream",
        "estimate: ~9 % baking loss. The source counts 8 large portions; one bakery-size piece (~90 g, 1/16) is the serving",
        [src(GK + "einfacher-streuselkuchen-rezept-2045", R, "batch recipe: 4 Eier, 200 g Mehl, 250 g Zucker, 2 TL Backpulver; 200 g Butter, 400 g Mehl, 260 g Zucker; 100 ml Schlagsahne, 8 Portionen"),
         src(GK + "pflaumenkuchen-mit-streusel-rezept-81", R, "cross-check (Streusel): 200 g Mehl, 200 g Butter, 150 g Zucker, 50 g Nüsse, 18 Stück")]),
    "pflaumenkuchen": part(
        {"hu": "Szilvás lepény (Zwetschgendatschi)", "de": "Pflaumenkuchen (Zwetschgenkuchen)", "de-AT": "Zwetschkenkuchen", "en": "Plum cake (Zwetschgenkuchen)"}, 12, 160,
        [ing("wheat_flour", 550, note="550 g Mehl"), ing("butter", 200, "fat", "200 g Butter, weich"), ing("egg", g(4, "db_egg"), note="4 Eier"), ing("yogurt_plain", 120, note="120 g Joghurt"),
         ing("sugar", 200, note="200 g Zucker"), ing("vanilla_sugar", g(1, "pkg_vanilla_sugar"), note="1 Pk Vanillezucker"), ing("baking_powder", g(2, "tl_baking_powder"), note="2 TL Backpulver"),
         ing("plum", 800, note="800 g Pflaumen oder Zwetschgen, pitted")],
        -180, "dough spread on a tray, densely topped with halved plums, baked ~45 min",
        "estimate: ~9 % baking loss (plum juice); salt left out. The source counts 8 portions; one piece (1/12) is the serving",
        [src(GK + "pflaumenkuchen-rezept-1601", R, "batch recipe: 2 TL Backpulver, 200 g Butter, 4 Eier, 120 g Joghurt, 550 g Mehl, 800 g Pflaumen, 200 g Zucker, 1 Pk Vanillezucker, 8 Portionen"),
         src(GK + "pflaumenkuchen-mit-streusel-rezept-81", R, "cross-check: 300 g Mehl, 150 g Butter, 2 Eier, 2 kg Pflaumen, Streusel, 18 Stück")]),
    "apfelkuchen_gedeckt": part(
        {"hu": "Fedett almás pite (gedeckter Apfelkuchen)", "de": "Gedeckter Apfelkuchen", "de-AT": "Gedeckter Apfelkuchen", "en": "Covered apple pie (German)"}, 8, 160,
        [ing("wheat_flour", 300, note="300 g Weizenmehl"), ing("butter", 200, "fat", "200 g Butter"), ing("sugar", 100, note="100 g Zucker"), ing("egg", g(1, "db_egg"), note="1 Ei"),
         ing("vanilla_sugar", g(0.5, "pkg_vanilla_sugar"), note="0.5 Pk Vanillezucker"), ing("apple_peeled", 750, note="5 Äpfel (Boskop), mittelgroß, peeled; 150 g each is an estimate"),
         ing("lemon_juice", 15, "seasoning", "1 EL Zitronensaft")],
        -130, "shortcrust base and lid around sliced apples, baked ~50 min", "estimate: ~9 % baking loss; salt left out. 8 pieces",
        [src(GK + "gedeckter-apfelkuchen-rezept-101", R, "batch recipe: 200 g Butter, 1 Ei, 0.5 Pk Vanillezucker, 300 g Mehl, 100 g Zucker, 5 Äpfel, 1 EL Zitronensaft, 8 Stück"),
         src(GK + "omas-apfelkuchen-rezept-15461", R, "cross-check: 250 g Mehl, 90 g Butter, 3 Eier, 150 g Zucker, 500 g Äpfel, 12 Stück")]),
    "donauwelle": part(
        {"hu": "Duna-hullám sütemény (Donauwelle)", "de": "Donauwelle", "de-AT": "Donauwelle", "en": "Danube wave cake (Donauwelle)"}, 20, 110,
        [ing("wheat_flour", 350, note="350 g Weizenmehl"), ing("sugar", 175 + g(2, "ek_sugar"), note="175 g Zucker + 2 EL (pudding)"), ing("egg", g(3, "db_egg"), note="3 Eier"),
         ing("milk_whole", 180 + 361, "liquid", "175 ml Milch (dough) + 350 ml Milch (pudding)"), ing("sunflower_oil", 161 + g(1, "ek_oil"), "fat", "175 ml Raps- oder Sonnenblumenöl + 1 EL Öl"),
         ing("baking_powder", g(0.5, "pkg_baking_powder"), note="0.5 Pk Backpulver"), ing("cocoa_powder", g(3, "ek_cocoa"), note="3 EL Kakaopulver"),
         ing("sour_cherry_jar", 350, note="1 Glas Sauerkirschen (720 ml): ~350 g drained is an estimate"), ing("butter", 250, "fat", "250 g Butter (cream)"),
         ing("pudding_powder_vanilla", g(1, "pkg_pudding_powder"), note="1 Pk Vanillepuddingpulver"), ing("water", 45, "liquid", "3 EL Wasser"),
         ing("nut_nougat_cream", 40, note="2 EL Nougat-Nuss-Creme; 20 g each is an estimate"), ing("dark_chocolate", 200, note="200 g Zartbitterschokolade")],
        -200, "marbled sponge with sour cherries baked on a tray, topped with butter-pudding cream and a chocolate glaze",
        "estimate: ~9 % baking loss. The source counts 10 portions; one bakery-size piece (1/20) is the serving",
        [src(GK + "donauwellen-rezept-1605", R, "batch recipe: 350 g Mehl, 175 g Zucker, 3 Eier, 175 ml Milch, 175 ml Öl, Backpulver, 3 EL Kakao, 1 Glas Sauerkirschen; 250 g Butter, 350 ml Milch, 1 Pk Puddingpulver; 200 g Schokolade, 2 EL Nougat-Nuss-Creme, 10 Portionen"),
         src(LK + "frankfurter-kranz-1587.html", R, "cross-check (butter-pudding cream): 1 Pk Puddingpulver, 1/2 l Milch, 250 g Butter")]),
    "rote_gruetze": part(
        {"hu": "Vörös gyümölcskocsonya (Rote Grütze)", "de": "Rote Grütze", "de-AT": "Rote Grütze", "en": "Red berry pudding (Rote Grütze)"}, 4, 150,
        [ing("strawberry", 125, note="250 g Beeren, gemischt (Erdbeeren, Blaubeeren): half strawberries is an estimate"), ing("blueberry", 125, note="half blueberries (estimate)"),
         ing("sweet_cherry", 250, note="250 g Kirschen, pitted"), ing("sour_cherry_juice", 100, "liquid", "100 ml Kirschsaft (sour cherry juice is the usual German Kirschsaft; judgement)"),
         ing("blackcurrant_juice", 150, "liquid", "150 ml Schwarzer Johannisbeersaft"), ing("corn_starch", 6, "thickener", "2 TL Speisestärke"), ing("sugar", g(2, "ek_sugar"), note="2 EL Zucker")],
        -30, "berries and cherries simmered briefly in the juices, thickened with starch, chilled",
        "estimate: ~4 % steam loss; blackcurrant liqueur (4 cl, MISSING), ginger, orange peel, vanilla, cinnamon left out",
        [src(GK + "rote-gruetze-mit-vanillesauce-rezept-14312", R, "batch recipe: 250 g Beeren, 250 g Kirschen, 100 ml Kirschsaft, 4 cl Johannisbeerlikör, 150 ml Johannisbeersaft, 2 TL Speisestärke, 2 EL Zucker; Vanillesauce, 4 Portionen"),
         src(GK + "rote-gruetze-rezept-1891", R, "cross-check: 200 g Erdbeeren, 200 g Himbeeren, 200 g Sauerkirschen, 250 ml Fruchtnektar, 2 Pk Puddingpulver, 300 g Zucker, 4 Portionen")],
        matrix="liquid"),
    "vanillesauce": part(
        {"hu": "Vaníliamártás", "de": "Vanillesoße", "de-AT": "Vanillesauce", "en": "Vanilla custard sauce"}, 4, 100,
        [ing("milk_whole", 515, "liquid", "500 ml Milch"), ing("egg_yolk", 54, note="3 Eigelb"), ing("corn_starch", 20, "thickener", "20 g Speisestärke"), ing("sugar", 60, note="60 g Zucker")],
        -30, "milk with vanilla brought to the boil, thickened with starch and yolks", "estimate: ~5 % steam loss; vanilla pod (negligible) left out",
        [src(GK + "vanillesauce-rezept-1814", R, "batch recipe: 3 Eigelb, 500 ml Milch, 20 g Speisestärke, 1 Vanilleschote, 60 g Zucker, 4 Portionen"),
         src(GK + "omas-vanillesauce-rezept-15061", R, "cross-check: 4 Eigelb, 375 ml Milch, Vanillemark, 75 g Zucker, 4 Portionen")],
        matrix="liquid"),
    "dampfnudeln": part(
        {"hu": "Gőzgombóc (Dampfnudeln)", "de": "Dampfnudeln", "de-AT": "Dampfnudeln", "en": "Steamed yeast buns (Dampfnudeln)"}, 4, 200,
        [ing("wheat_flour", 500, note="500 g Mehl"), ing("yeast_fresh", 25, note="25 g Hefe, frisch"), ing("milk_whole", 129, "liquid", "125 ml Milch, lauwarm"),
         ing("butter", 60 + g(1, "ek_butter"), "fat", "60 g Butter + 1 EL Butter für die Pfanne"), ing("egg", g(2, "db_egg"), note="2 Eier"), ing("sugar", g(3, "ek_sugar"), note="3 EL Zucker"),
         ing("water", 300, "liquid", "2 Tassen Wasser in the pan")],
        -350, "yeast dough buns steamed covered in a buttered pan with salted water until a crust forms",
        "estimate: the pan water evaporates and the dough loses ~5 %; salt left out. 2 Dampfnudeln per serving",
        [src(GK + "dampfnudeln-rezept-2318", R, "batch recipe: 500 g Mehl, 25 g Hefe, 125 ml Milch, 60 g Butter + 1 EL, 2 Eier, 3 EL Zucker, 2 Tassen Wasser, 4 Portionen"),
         src(GK + "dampfnudeln-mit-vanillesauce-rezept-16605", R, "cross-check: 125 g Mehl, 5 g Hefe, 60 ml Milch, 25 g Butter, 1 Ei, 40 g Zucker; Vanillesauce from 230 ml Milch, 1 Eigelb")]),
}


def D(id, parts, aliases, served_in="flat_plate", tags=("sweet", "cake", "higher-carb"), countries=("DE",), **kw):
    return dict(id=id, countries=list(countries), category="traditional", part_refs=parts, served_in=served_in, tags=list(tags), aliases=aliases, **kw)


SIDE_WITH = {"vanillesauce": {"hu": "vaníliamártással", "de": "mit Vanillesoße", "de-AT": "mit Vanillesauce", "en": "with vanilla sauce"}}

DISHES = [
    D("de_schwarzwaelder_kirschtorte", [("schwarzwaelder_kirschtorte", 150)],
      {"de": ["schwarzwälder kirschtorte", "schwarzwälder", "kirschtorte", "ein stück schwarzwälder kirschtorte", "schwarzwaelder kirschtorte"], "de-AT": ["schwarzwälder kirschtorte"],
       "hu": ["fekete-erdő torta", "fekete-erdei meggytorta", "schwarzwaldi torta"], "en": ["black forest gateau", "black forest cake", "black forest cherry cake"]}),
    D("de_kaesekuchen", [("kaesekuchen", 185)],
      {"de": ["käsekuchen", "quarkkuchen", "käsekuchen mit boden", "ein stück käsekuchen", "kaesekuchen"], "de-AT": ["topfenkuchen"], "hu": ["túrótorta", "német túrós sütemény"], "en": ["cheesecake", "german cheesecake", "quark cheesecake"]},
      reference_check=dict(catalog="bls:D480200", name="Käsekuchen/Quarkkuchen (Mürbeteig)", kcal=261, fat=12.1, protein=8.4, net_carbs=28.9)),
    D("de_bienenstich", [("bienenstich", 105)],
      {"de": ["bienenstich", "ein stück bienenstich", "bienenstich mit pudding"], "de-AT": ["bienenstich"], "hu": ["méhcsípés torta", "bienenstich"], "en": ["bee sting cake", "bienenstich"]},
      reference_check=dict(catalog="bls:D461300", name="Bienenstich (Hefeteig)", kcal=332, fat=19.34, protein=6.44, net_carbs=32.0)),
    D("de_streuselkuchen", [("streuselkuchen", 90)],
      {"de": ["streuselkuchen", "streuselkuchen vom blech", "ein stück streuselkuchen", "butterstreuselkuchen"], "de-AT": ["streuselkuchen"], "hu": ["morzsás sütemény", "morzsás lepény"], "en": ["crumb cake", "streusel cake"]},
      reference_check=dict(catalog="bls:D461500", name="Streuselkuchen (Hefeteig)", kcal=425, fat=17.97, protein=7.27, net_carbs=57.0)),
    D("de_pflaumenkuchen", [("pflaumenkuchen", 160)],
      {"de": ["pflaumenkuchen", "zwetschgenkuchen", "zwetschgendatschi", "zwetschenkuchen", "datschi", "quetschekuchen"], "de-AT": ["zwetschkenkuchen"], "hu": ["szilvás lepény", "szilvás sütemény"], "en": ["plum cake", "german plum cake"]},
      reference_check=dict(catalog="bls:D482200", name="Zwetschgenkuchen (Mürbeteig)", kcal=216, fat=9.61, protein=3.21, net_carbs=28.12,
                           deviation="RECEPTKÜLÖNBSÉG: a gutekueche-recept vajas-joghurtos kevert tésztája vastag (550 g liszt, 200 g vaj 800 g szilvára), a BLS-referencia vékony omlós tészta több gyümölccsel; nem hangoltuk.")),
    D("de_apfelkuchen_gedeckt", [("apfelkuchen_gedeckt", 160)],
      {"de": ["gedeckter apfelkuchen", "apfelkuchen", "ein stück apfelkuchen", "omas apfelkuchen", "apfelkuchen gedeckt"], "de-AT": ["gedeckter apfelkuchen"], "hu": ["fedett almás pite", "almás pite"], "en": ["apple pie", "covered apple cake"]},
      reference_check=dict(catalog="bls:D181300", name="Apfelkuchen gedeckt (Mürbeteig)", kcal=219, fat=9.9, protein=3.7, net_carbs=27.4,
                           deviation="RECEPTKÜLÖNBSÉG: a recept gazdag omlós tésztát használ (200 g vaj 300 g lisztre), a BLS-referencia soványabb; nem hangoltuk.")),
    D("de_donauwelle", [("donauwelle", 110)],
      {"de": ["donauwelle", "donauwellen", "ein stück donauwelle", "schneewittchenkuchen"], "de-AT": ["donauwelle"], "hu": ["duna-hullám", "donauwelle"], "en": ["danube wave cake", "donauwelle"]}),
    D("de_rote_gruetze", [("rote_gruetze", 150), ("vanillesauce", 80)],
      {"de": ["rote grütze mit vanillesoße", "rote grütze", "rote grütze mit vanillesauce", "grütze mit vanillesoße"], "de-AT": ["rote grütze mit vanillesauce"], "hu": ["vörös gyümölcskocsonya vaníliamártással"], "en": ["red berry pudding with custard", "rote grutze"]},
      names={"hu": "Vörös gyümölcskocsonya vaníliamártással (Rote Grütze)", "de": "Rote Grütze mit Vanillesoße", "de-AT": "Rote Grütze mit Vanillesauce", "en": "Red berry pudding with vanilla sauce"},
      served_in="deep_plate", tags=("sweet", "dessert"),
      reference_check=dict(catalog="bls:Y855743", name="Rote Grütze mit Vanillesauce", kcal=95, fat=1.8, protein=2.1, net_carbs=16.2)),
    D("de_dampfnudeln", [("dampfnudeln", 200), ("vanillesauce", 100)],
      {"de": ["dampfnudeln", "dampfnudeln mit vanillesoße", "dampfnudel", "dampfnudeln mit vanillesauce", "pfälzer dampfnudeln"], "de-AT": ["dampfnudeln mit vanillesauce"], "hu": ["gőzgombóc vaníliamártással", "dampfnudel"], "en": ["steamed yeast dumplings with custard", "dampfnudeln"]},
      names={"hu": "Gőzgombóc vaníliamártással (Dampfnudeln)", "de": "Dampfnudeln mit Vanillesoße", "de-AT": "Dampfnudeln mit Vanillesauce", "en": "Steamed yeast buns with vanilla sauce"},
      served_in="deep_plate", tags=("sweet", "higher-carb"),
      review="Az osztrák Germknödel (at_germknoedel) mákkal és szilvalekvárral töltött; a pfalzi/bajor Dampfnudel sós-vajas kéreggel, vaníliamártással."),
]

MISSING = [
    dict(food_key="blackcurrant_liqueur", names={"hu": "feketeribizli-likőr", "de": "Johannisbeerlikör", "en": "blackcurrant liqueur"},
         needed_for=["rote_gruetze (4 cl)"], note="No liqueur record of this kind in BLS 4.0 or the catalog; left out."),
]

# Frankfurter Kranz needs 500 g Haselnusskrokant on the gutekueche/lecker
# recipes; BLS 4.0 has no Krokant record (only Sesam-Krokant), so the
# home-made cake is not built; the bakery slice (BLS D441300) is in de_backwaren.
