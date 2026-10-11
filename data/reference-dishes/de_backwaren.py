"""Germany phase 4: bakery items, Abendbrot (open sandwiches) and breakfast
(sources read 2026-10-11). Rolls and pastries bought at the bakery are BLS
bakery records with a piece weight from retail products; assembled
sandwiches use marked estimates for the topping amounts (as at_fruehstueck)."""
from common import g, ing, src
from de_traditionell import part

R = "2026-10-11"
GK = "https://www.gutekueche.de/"
LK = "https://www.lecker.de/"
REWE = "https://www.rewe.de/shop/p/"

S_BROETCHEN = [src("https://www.supermarktcheck.de/product/181802-gut-guenstig-gute-laune-weizenbroetchen-360g", R, "Gut & Günstig Weizenbrötchen 360 g, 6 Stück (60 g)"),
               src("https://www.test.de/Aufbackbroetchen-Die-besten-zum-Fruehstueck-4206027-5707401/detail/330000012640!14/", R, "Lidl Grafschafter Unsere besten Weizenbrötchen, 6 Stück 360 g (60 g)")]
S_BROT = [src(REWE + "harry-1688-steinofenbrot-500g/4923456", R, "Harry 1688 Steinofenbrot (Roggenmischbrot) 500 g: 1 Scheibe = 56 g"),
          src("https://www.spar.at/produktwelt/spar-vital-walnuss-vollkornbrot-5-scheiben/p/1595482", "2026-10-05", "SPAR Vital Vollkornbrot 5 Scheiben 250 g: 50 g per slice (slice size, as at_fruehstueck)")]
BROT = "1 Scheibe Graubrot (Roggenmischbrot), 53 g: mean of Harry 56 g and SPAR 50 g slices"


def bakery(names, food_key, grams, sources, note):
    return part(names, 1, grams, [ing(food_key, grams, note=note)], 0, "bought baked, eaten as is", "no cooking", sources)


def brot(names, ingredients, sources):
    total = sum(i["raw_g"] for i in ingredients)
    return part(names, 1, total, ingredients, 0, "assembled, no cooking", "no cooking", sources)


PARTS = {
    # ---- rolls and pastries ----------------------------------------------------------------
    "broetchen": bakery({"hu": "Német zsemle (Brötchen, Schrippe)", "de": "Brötchen (Weizenbrötchen)", "de-AT": "Semmel (deutsches Brötchen)", "en": "German bread roll (Brötchen)"},
                        "wheat_roll", 60, S_BROETCHEN, "1 Weizenbrötchen = 60 g (two retail products); BLS Weizenbrötchen"),
    "koernerbroetchen": bakery({"hu": "Magvas zsemle (Körnerbrötchen)", "de": "Körnerbrötchen (Mehrkornbrötchen)", "de-AT": "Mehrkornweckerl", "en": "Multigrain roll"},
                               "multigrain_roll", 62.5, [src("https://www.rewe.de/produkte/2795493/", R, "Coppenrath & Wiese 6 Mehrkorn-Brötchen 300 g (50 g)"),
                                                         src("https://www.memolife.de/herzberger-bio-mehrkornbroetchen-zum-aufbacken-4er-pack-h4735", R, "Herzberger Bio-Mehrkornbrötchen, 4 Brötchen à 75 g")],
                               "1 Körnerbrötchen = mean of 50 g and 75 g; BLS Mehrkornbrötchen"),
    "franzbroetchen": bakery({"hu": "Hamburgi fahéjas péksütemény (Franzbrötchen)", "de": "Franzbrötchen", "de-AT": "Franzbrötchen (Zimtplunder)", "en": "Franzbrötchen (Hamburg cinnamon pastry)"},
                             "franzbroetchen", 70, [src(REWE + "back-bord-bio-2-stueck-franzbroetchen-140g/7347192", R, "Back Bord Bio 2 Stück Franzbrötchen 140 g (70 g)"),
                                                    src("https://utopia.de/ratgeber/franzbroetchen-rezept-so-machst-du-das-norddeutsche-zimtgebaeck-selber/", R, "cross-check (home-made): 500 g Mehl dough for ca. 10 Franzbrötchen")],
                             "1 Franzbrötchen = 70 g (one retail product; the home-made cross-check gives a similar size - estimate); BLS Franzbrötchen (Plunderteig)"),
    "rosinenbroetchen": bakery({"hu": "Mazsolás zsemle (Rosinenbrötchen)", "de": "Rosinenbrötchen", "de-AT": "Rosinenweckerl", "en": "Raisin bun"},
                               "raisin_roll", 51, [src(REWE + "harry-rosinen-brioche-broetchen-4-stueck-250g/9937246", R, "Harry Rosinen Brioche Brötchen 4 Stück 250 g (62.5 g)"),
                                                   src("https://fddb.info/db/de/lebensmittel/krakend_vers_bv_rosinen_broetchen_441199/index.html", R, "Rosinenbrötchen, 1 Stück 40 g")],
                               "1 Rosinenbrötchen = mean of 62.5 g and 40 g; BLS Rosinenbrötchen (Hefeteig)"),
    # ---- Abendbrot -------------------------------------------------------------------------
    "butterbrot_de": brot({"hu": "Vajas kenyér (rozsos vegyes kenyérből)", "de": "Butterbrot (Graubrot mit Butter)", "de-AT": "Butterbrot", "en": "Bread and butter (rye-wheat bread)"},
                          [ing("rye_mixed_bread", 53, note=BROT), ing("butter", 10, "fat", "butter spread, 10 g per slice (estimate)")], S_BROT),
    "leberwurstbrot": brot({"hu": "Májaskenyér", "de": "Leberwurstbrot", "de-AT": "Leberwurstbrot", "en": "Liver sausage sandwich"},
                           [ing("rye_mixed_bread", 53, note=BROT), ing("leberwurst", 30, note="Leberwurst spread, 30 g (estimate); BLS Delikatess Leberwurst")], S_BROT),
    "teewurstbrot": brot({"hu": "Teewurst-os kenyér", "de": "Teewurstbrot", "de-AT": "Teewurstbrot", "en": "Teewurst sandwich"},
                         [ing("rye_mixed_bread", 53, note=BROT), ing("teewurst", 30, note="Teewurst spread, 30 g (estimate)")], S_BROT),
    "schmalzbrot_de": brot({"hu": "Zsíros kenyér rozsos kenyérből (Schmalzbrot)", "de": "Schmalzbrot (Graubrot)", "de-AT": "Schmalzbrot", "en": "Lard sandwich on rye-wheat bread"},
                           [ing("rye_mixed_bread", 53, note=BROT), ing("lard", 15, "fat", "Schweineschmalz, 15 g (estimate)")], S_BROT),
    "salamibroetchen": brot({"hu": "Szalámis zsemle", "de": "Salamibrötchen", "de-AT": "Salamisemmel", "en": "Salami roll"},
                            [ing("wheat_roll", 60, note="1 Brötchen (60 g)"), ing("butter", 10, "fat", "butter, 10 g (estimate)"), ing("salami", 30, note="5 Scheiben Salami ~30 g (estimate)")], S_BROETCHEN),
    "nutellabroetchen": brot({"hu": "Mogyorókrémes zsemle", "de": "Brötchen mit Nuss-Nougat-Creme", "de-AT": "Semmel mit Nuss-Nougat-Creme", "en": "Bread roll with chocolate hazelnut spread"},
                             [ing("wheat_roll", 60, note="1 Brötchen (60 g)"), ing("butter", 8, "fat", "butter, 8 g (estimate)"), ing("nut_nougat_cream", 20, note="Nuss-Nougat-Creme, 1 EL ~20 g (estimate)")], S_BROETCHEN),
    "fleischsalatbroetchen": brot({"hu": "Húsalátás zsemle (Fleischsalat)", "de": "Fleischsalatbrötchen", "de-AT": "Semmel mit Fleischsalat", "en": "German meat salad roll"},
                                  [ing("wheat_roll", 60, note="1 Brötchen (60 g)"), ing("fleischsalat", 50, note="Fleischsalat, 50 g (estimate); BLS Fleischsalat mit Salatmayonnaise und Gurke")], S_BROETCHEN),
    "mettbroetchen": part(
        {"hu": "Nyers darált sertéshúsos zsemle (Mettbrötchen)", "de": "Mettbrötchen (Hackepeter)", "de-AT": "Mettsemmel", "en": "Raw minced pork roll (Mettbrötchen)"}, 8, 115,
        [ing("wheat_roll", 480, note="8 Schrippen (Brötchen), 60 g each"), ing("butter", g(1, "ek_butter"), "fat", "1 EL Butter für die Schrippen"),
         ing("pork_minced", 300, note="300 g Hackfleisch vom Schwein (raw, seasoned Mett)"), ing("egg_yolk", 18, note="1 Eigelb, frisch"), ing("onion", g(1, "db_onion"), note="1 Zwiebel, gelb"),
         ing("garlic", g(1, "gerezd_garlic"), "seasoning", "1 Knoblauchzehe"), ing("caraway_seed", 1.25, "seasoning", "0.5 TL Kümmel, gemahlen")],
        0, "seasoned raw pork spread on buttered roll halves with onion", "no cooking; salt, pepper left out. One roll (two halves) per serving",
        [src(GK + "hackepeter-rezept-1871", R, "batch recipe: 1 EL Butter, 1 Eigelb, 300 g Schweinehack, Knoblauch, 0.5 TL Kümmel, 8 Schrippen, 1 Zwiebel, 4 Portionen"),
         src(GK + "mettbroetchen-rezept-17184", R, "cross-check: 4 Brötchen, 80 g Butter, 400 g Schweinefleisch + 100 g Schweinebauch (minced), 4 Zwiebeln, Kümmel, 4 Portionen")]),
    # ---- breakfast ---------------------------------------------------------------------------
    "strammer_max": part(
        {"hu": "Sonkás-tükörtojásos kenyér (Strammer Max)", "de": "Strammer Max", "de-AT": "Strammer Max (Schinkenbrot mit Spiegelei)", "en": "Strammer Max (ham and fried egg on bread)"}, 4, 165,
        [ing("rye_mixed_bread", 200, note="4 Schb Mischbrot; 50 g each is an estimate"), ing("butter", 40, "fat", "40 g Butter (bread)"), ing("margarine", g(2, "ek_butter"), "fat", "2 EL Margarine (frying)"),
         ing("ham_cooked", 200, note="200 g Schinken, gekocht"), ing("egg", g(4, "db_egg"), note="4 Eier"), ing("chives", g(0.5, "bund_herb"), "garnish", "0.5 Bund Schnittlauch")],
        -20, "buttered bread with ham, topped with a fried egg", "estimate: the eggs lose ~10 % while frying; Gewürzgurken (MISSING), salt, pepper left out",
        [src(GK + "strammer-max-rezept-8458", R, "batch recipe: 40 g Butter, 4 Eier, 4 Gewürzgurken, 2 EL Margarine, 4 Schb Mischbrot, 200 g Schinken, Schnittlauch, 4 Portionen"),
         src(GK + "strammer-max-rezept-8024", R, "cross-check: 4 TL Butter, 4 Eier, 4 Schb Gouda, 8 Schb Kochschinken, 4 Schb Schwarzbrot, 1 EL Rapsöl, 2 Portionen")]),
    "bauernfruehstueck": part(
        {"hu": "Parasztreggeli (sült krumpli tojással és szalonnával)", "de": "Bauernfrühstück", "de-AT": "Bauernfrühstück (Gröstl mit Ei)", "en": "Farmer's breakfast (fried potatoes with egg and bacon)"}, 4, 400,
        [ing("potato", 1000, note="1 kg festkochende Kartoffeln, boiled and sliced"), ing("egg", g(6, "db_egg"), note="6 Eier"), ing("onion", 250, note="1 Gemüsezwiebel; 250 g is an estimate"),
         ing("spring_onion", 100, note="1 Bund Lauchzwiebeln; 100 g is an estimate"), ing("schinkenspeck", 150, note="150 g Schinkenspeck"), ing("rapeseed_oil", g(1, "ek_oil"), "fat", "1 EL Rapsöl"),
         ing("parsley_leaf", g(0.5, "bund_herb"), "garnish", "0.5 Bund Petersilie")],
        -150, "boiled potatoes fried with onions and bacon, eggs stirred in and set", "estimate: ~10 % frying loss; salt, pepper left out",
        [src(GK + "bauernfruehstueck-rezept-4412", R, "batch recipe: 6 Eier, 1 kg Kartoffeln, 1 Gemüsezwiebel, 1 Bund Lauchzwiebeln, Petersilie, 1 EL Rapsöl, 150 g Schinkenspeck, 4 Portionen"),
         src(LK + "bauernfruehstueck-30403.html", R, "cross-check: 150 g Kartoffeln, 1 Zwiebel, 20 g Lachsschinken, 1 Gewürzgurke, 2 TL Öl, 1 Ei, 1 Person")],
        flat=(0.32, 2.5)),
    "arme_ritter": part(
        {"hu": "Bundás kenyér cukorral (Arme Ritter)", "de": "Arme Ritter (süß)", "de-AT": "Pofesen (Arme Ritter, süß)", "en": "French toast (Arme Ritter)"}, 4, 170,
        [ing("white_bread", 240, note="8 Schb Weißbrot; 30 g each is an estimate"), ing("egg", g(4, "db_egg"), note="4 Eier"), ing("milk_whole", 206, "liquid", "200 ml Milch"),
         ing("vanilla_sugar", g(1, "pkg_vanilla_sugar"), note="1 Pk Vanillinzucker"), ing("sugar", g(3, "ek_sugar"), note="3 EL Zucker"), ing("clarified_butter", g(2, "ek_lard"), "fat", "2 EL Butterschmalz")],
        -40, "bread soaked in egg milk, fried in Butterschmalz, sprinkled with cinnamon sugar", "estimate: ~6 % frying loss; cinnamon (MISSING) left out",
        [src(GK + "arme-ritter-rezept-585", R, "batch recipe: 2 EL Butterschmalz, 4 Eier, 200 ml Milch, 1 Pk Vanillinzucker, 8 Schb Weißbrot, 1 TL Zimt, 3 EL Zucker, 4 Portionen"),
         src(GK + "arme-ritter-suess-rezept-1889", R, "cross-check: 70 g Butter, 1 Ei, 4 Schb Toastbrot, 250 ml Vollmilch, Zimt, Zucker, 2 Portionen")]),
    "eierpfannkuchen": part(
        {"hu": "Német tojásos palacsinta (Eierpfannkuchen)", "de": "Eierpfannkuchen", "de-AT": "Palatschinke (deutscher Eierpfannkuchen)", "en": "German pancake (Eierpfannkuchen)"}, 2, 200,
        [ing("egg", g(3, "db_egg"), note="3 Eier, Größe M"), ing("milk_whole", 155, "liquid", "150 ml Vollmilch"), ing("wheat_flour", 100, note="100 g Weizenmehl, Type 405"),
         ing("sugar", g(1, "ek_sugar"), note="1 EL Zucker"), ing("sunflower_oil", 39, "absorbed_fat", "6 EL Sonnenblumenöl für die Pfanne: about half (~39 g) is taken up (estimate)")],
        -40, "thick batter fried in oil, 2-3 pancakes per person", "estimate: ~10 % steam loss; salt left out",
        [src(GK + "eierpfannkuchen-grundrezept-rezept-1596", R, "batch recipe: 3 Eier, 6 EL Sonnenblumenöl, 150 ml Vollmilch, 100 g Mehl, 1 EL Zucker, 2 Portionen"),
         src(GK + "pfannkuchen-grundrezept-rezept-9325", R, "cross-check: 4 Eier, 400 ml Milch, 100 ml Mineralwasser, 2 EL Öl, 400 g Mehl, 4 Portionen")],
        flat=(0.30, 1.2)),
}


def D(id, parts, aliases, served_in="handheld", tags=("breakfast", "higher-carb"), countries=("DE",), **kw):
    return dict(id=id, countries=list(countries), category="everyday", part_refs=parts, served_in=served_in, tags=list(tags), aliases=aliases, **kw)


BUTTER = [{"food_key": "butter", "g": 10, "hu": "vaj"}]
DISHES = [
    D("de_broetchen", [("broetchen", 60)],
      {"de": ["brötchen", "schrippe", "schrippen", "weck", "weckle", "wecken", "rundstück", "semmel", "weizenbrötchen", "brötchen ohne belag"], "de-AT": ["semmel deutsch"],
       "hu": ["német zsemle", "zsemle (brötchen)"], "en": ["bread roll", "german bread roll", "plain roll"]},
      optional_toppings=BUTTER, tags=("breakfast", "bread", "higher-carb"),
      review="A regionális nevek (Schrippe Berlin, Weck/Weckle délnyugat, Rundstück Hamburg, Semmel Bajorország) mind ezt a zsemlét jelölik; osztrák (de-AT) 'Semmel' továbbra is az osztrák péksütemény-alias (wheat_roll FOOD_ALIASES)."),
    D("de_koernerbroetchen", [("koernerbroetchen", 62.5)],
      {"de": ["körnerbrötchen", "mehrkornbrötchen", "kernbrötchen", "körnerweck"], "de-AT": ["mehrkornweckerl"], "hu": ["magvas zsemle", "többmagvas zsemle"], "en": ["multigrain roll", "seeded roll"]},
      optional_toppings=BUTTER, tags=("breakfast", "bread", "higher-carb")),
    D("de_franzbroetchen", [("franzbroetchen", 70)],
      {"de": ["franzbrötchen", "franzbroetchen", "hamburger franzbrötchen"], "de-AT": ["franzbrötchen"], "hu": ["franzbrötchen", "fahéjas hamburgi péksütemény"], "en": ["franzbrotchen", "hamburg cinnamon pastry"]},
      tags=("breakfast", "pastry", "sweet", "higher-carb"),
      reference_check=dict(catalog="bls:D7A7200", name="Franzbrötchen (Plunderteig)", kcal=567, fat=34.85, protein=5.48, net_carbs=57.0)),
    D("de_rosinenbroetchen", [("rosinenbroetchen", 51)],
      {"de": ["rosinenbrötchen", "rosinenweck", "rosinenstuten-brötchen", "korinthenbrötchen"], "de-AT": ["rosinenweckerl"], "hu": ["mazsolás zsemle", "mazsolás kalács-zsemle"], "en": ["raisin bun", "raisin roll"]},
      optional_toppings=BUTTER, tags=("breakfast", "pastry", "sweet", "higher-carb")),
    D("de_butterbrot", [("butterbrot_de", 63)],
      {"de": ["butterbrot", "graubrot mit butter", "stulle mit butter", "bemme mit butter", "brot mit butter"], "de-AT": ["butterbrot (graubrot)"], "hu": ["vajas rozsos kenyér", "vajas graubrot"], "en": ["bread and butter", "slice of bread with butter"]},
      tags=("breakfast", "bread", "higher-carb"),
      review="Az osztrák at_butterbrot_schnittlauch metélőhagymás; a német Butterbrot csak vaj, Graubrotra. A 'butterbrot' a DE és az AT étel között választás marad."),
    D("de_leberwurstbrot", [("leberwurstbrot", 83)],
      {"de": ["leberwurstbrot", "brot mit leberwurst", "leberwurststulle", "leberwurstbemme"], "de-AT": ["leberwurstbrot"], "hu": ["májaskenyér", "májkrémes kenyér"], "en": ["liverwurst sandwich", "liver sausage on bread"]},
      tags=("everyday", "bread")),
    D("de_teewurstbrot", [("teewurstbrot", 83)],
      {"de": ["teewurstbrot", "brot mit teewurst", "teewurststulle"], "de-AT": ["teewurstbrot"], "hu": ["teewurst-os kenyér", "kenhető kolbászos kenyér"], "en": ["teewurst sandwich"]},
      tags=("everyday", "bread")),
    D("de_schmalzbrot", [("schmalzbrot_de", 68)],
      {"de": ["schmalzbrot", "schmalzstulle", "griebenschmalzbrot", "brot mit schmalz", "fettbemme"], "de-AT": ["schmalzbrot"], "hu": ["zsíros kenyér rozsos kenyérből"], "en": ["lard sandwich", "bread with dripping"]},
      tags=("everyday", "bread"),
      review="A magyar zsíros kenyér (hu_zsiros_kenyer) fehér kenyérrel, hagymával; a német Schmalzbrot Graubrotra kent zsír. A 'griebenschmalzbrot' alias tepertős zsírt jelent, amelyre nincs rekord (HU-3): itt sima zsírral számolva."),
    D("de_salamibroetchen", [("salamibroetchen", 100)],
      {"de": ["salamibrötchen", "brötchen mit salami", "salamiweck", "salamisemmel"], "de-AT": ["salamisemmel"], "hu": ["szalámis zsemle"], "en": ["salami roll", "salami sandwich"]},
      tags=("breakfast", "bread")),
    D("de_nutellabroetchen", [("nutellabroetchen", 88)],
      {"de": ["brötchen mit nutella", "nutellabrötchen", "brötchen mit nuss-nougat-creme", "nutella-brötchen"], "de-AT": ["nutellasemmel"], "hu": ["nutellás zsemle", "mogyorókrémes zsemle"], "en": ["nutella roll", "roll with chocolate spread"]},
      tags=("breakfast", "sweet", "higher-carb")),
    D("de_fleischsalatbroetchen", [("fleischsalatbroetchen", 110)],
      {"de": ["fleischsalatbrötchen", "brötchen mit fleischsalat", "fleischsalat-brötchen"], "de-AT": ["fleischsalatsemmel"], "hu": ["húsalátás zsemle"], "en": ["meat salad roll"]},
      tags=("everyday", "bread")),
    D("de_mettbroetchen", [("mettbroetchen", 115)],
      {"de": ["mettbrötchen", "hackepeter", "hackepeterbrötchen", "brötchen mit mett", "mettbrötchen mit zwiebeln", "zwiebelmett"], "de-AT": ["mettsemmel"], "hu": ["nyers darált húsos zsemle", "mettbrötchen"], "en": ["raw pork roll", "mett roll"]},
      tags=("everyday", "bread"),
      review="Nyers sertéshús (Mett): a darált sertés BLS-rekordja nyers; a fűszerezett Mett só- és fűszertartalma elhanyagolt."),
    D("de_strammer_max", [("strammer_max", 165)],
      {"de": ["strammer max", "stramme max", "schinkenbrot mit spiegelei", "spiegelei auf schinkenbrot"], "de-AT": ["strammer max"], "hu": ["sonkás-tükörtojásos kenyér", "strammer max"], "en": ["strammer max", "ham and egg on bread"]},
      served_in="flat_plate", tags=("everyday", "eggs")),
    D("de_bauernfruehstueck", [("bauernfruehstueck", 400)],
      {"de": ["bauernfrühstück", "bauernfruehstueck", "kartoffeln mit ei und speck", "bratkartoffeln mit ei"], "de-AT": ["bauernfrühstück"], "hu": ["parasztreggeli", "tojásos sült krumpli szalonnával"], "en": ["farmer's breakfast", "german farmer's breakfast"]},
      served_in="flat_plate", tags=("everyday", "eggs", "higher-carb")),
    D("de_arme_ritter", [("arme_ritter", 170)],
      {"de": ["arme ritter", "armer ritter", "fotzelschnitten", "french toast"], "de-AT": ["arme ritter"], "hu": ["édes bundás kenyér", "arme ritter"], "en": ["french toast", "eggy bread with sugar"]},
      served_in="flat_plate", tags=("breakfast", "sweet", "higher-carb"),
      reference_check=dict(catalog="bls:Y812962", name="Arme Ritter gebraten, mit Zucker und Zimt", kcal=284, fat=12.59, protein=7.1, net_carbs=34.43,
                           deviation="RECEPTKÜLÖNBSÉG: a gutekueche-recept 8 szelet kenyeret csak 2 EL Butterschmalzban süt, a BLS-összetétel több zsírt szív fel; nem hangoltuk."),
      review="A magyar bundás kenyér (hu_bundas_kenyer) sós; a német Arme Ritter édes, fahéjas cukorral."),
    D("de_eierpfannkuchen", [("eierpfannkuchen", 200)],
      {"de": ["eierpfannkuchen", "pfannkuchen", "eierkuchen", "pfannekuchen", "pfannkuchen mit marmelade", "pfannkuchen mit apfelmus"], "de-AT": ["eierpfannkuchen"], "hu": ["német palacsinta", "vastag tojásos palacsinta"], "en": ["german pancake", "pancake"]},
      served_in="flat_plate", tags=("breakfast", "sweet", "higher-carb"), optional_toppings=[{"food_key": "jam", "g": 20, "hu": "lekvár"}, {"food_key": "sugar", "g": 5, "hu": "cukor"}],
      reference_check=dict(catalog="bls:X929212", name="Pfannkuchen/Eierkuchen, ungesüßt, mit Milch 3,5 % Fett, gebraten", kcal=267, fat=12.12, protein=8.34, net_carbs=30.1),
      review="Berlinben és keleten a 'Pfannkuchen' a Berliner fánkot jelenti: a bare 'pfannkuchen' és a 'pfannkuchen mit marmelade' ezért választás a német palacsinta és a Berliner (at_krapfen) között; csendben nem választunk. Lekvár/cukor választható feltét."),
]

MISSING = [
    dict(food_key="cinnamon", names={"hu": "fahéj", "de": "Zimt", "en": "cinnamon"}, needed_for=["arme_ritter (1 TL)"],
         note="No ground-cinnamon record in BLS 4.0 or the catalog; left out (as in at-missing-foods)."),
    dict(food_key="gherkin_plain", names={"hu": "csemegeuborka", "de": "Gewürzgurke", "en": "pickled gherkin"}, needed_for=["strammer_max (4 Gewürzgurken)"],
         note="No vinegar-pickled gherkin record (see de_traditionell)."),
]
