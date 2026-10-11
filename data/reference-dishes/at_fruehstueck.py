"""Austria phase 3: breakfast, Jause (open sandwiches) and bakery items
(sources read 2026-10-05). Rolls and bread are BLS bakery records with the
piece weight of two SPAR products (SPAR product search); pastries are built
from their recipes. Assembled sandwiches use marked estimates for the
topping amounts, as the phase-1 Leberkässemmel did."""
from common import g, ing, src

R = "2026-10-05"
GK = "https://www.gutekueche.at/"
IK = "https://www.ichkoche.at/"
SPAR = "https://www.spar.at/produktwelt/"

S_SEMMEL = [src("https://www.spar.at/produktwelt/spar-bio-kaisersemmel-60g-g-p2020001325436", "2026-09-27", "SPAR Natur*pur Bio-Kaisersemmel 60 g"),
            src("https://shop.billa.at/produkte/ja-natuerlich-kaisersemmel-00480904", "2026-09-27", "Ja! Natürlich Kaisersemmel 65 g Stück")]
S_BROT = [src(SPAR + "spar-roggenmischbrot-geschnitten/p/2020004161956", R, "SPAR Roggenmischbrot geschnitten 500 g (the bread)"),
          src(SPAR + "spar-vital-walnuss-vollkornbrot-5-scheiben/p/1595482", R, "SPAR Vital Walnuss-Vollkornbrot 5 Scheiben 250 g: 50 g per slice (slice size)")]
EST = "estimate"


def jause(names, ingredients, sources, serving, note="assembled, no cooking"):
    total = sum(i["raw_g"] for i in ingredients)
    return dict(names=names, matrix="solid", servings_source=1, standard_serving_g=serving if serving else total,
                ingredients=ingredients, cooking=dict(method="assembled, no cooking", mass_change_g=0, note=note), sources=sources)


def bakery(names, food_key, grams, sources, note):
    return dict(names=names, matrix="solid", servings_source=1, standard_serving_g=grams,
                ingredients=[ing(food_key, grams, note=note)], cooking=dict(method="bought baked, eaten as is", mass_change_g=0, note="no cooking"), sources=sources)


PARTS = {
    # ---- Jause: bread and rolls with toppings -------------------------------------------
    "butterbrot_schnittlauch": jause(
        {"hu": "Vajas-metélőhagymás kenyér", "de": "Butterbrot mit Schnittlauch", "de-AT": "Schnittlauchbrot (Butterbrot mit Schnittlauch)", "en": "Bread with butter and chives"},
        [ing("rye_mixed_bread", 50, note="1 Scheibe Hausbrot/Roggenmischbrot, 50 g (slice size from SPAR sliced bread)"),
         ing("butter", 10, "fat", "butter spread, 10 g per slice (estimate)"), ing("chives", 3, "garnish", "Schnittlauch, 3 g (estimate)")],
        S_BROT + [src(SPAR + "stainzer-butter-aus-suessrahm-0250/p/794725", R, "Stainzer Butter aus Süßrahm 250 g (the butter)")], None),
    "wurstbrot": jause(
        {"hu": "Párizsis kenyér (Extrawurstbrot)", "de": "Wurstbrot (Lyoner)", "de-AT": "Wurstbrot (Extrawurstbrot)", "en": "Bread with Extrawurst (Lyoner)"},
        [ing("rye_mixed_bread", 50, note="1 Scheibe Hausbrot, 50 g"), ing("butter", 5, "fat", "thin butter spread, 5 g (estimate)"),
         ing("parizsi", 40, note="Extrawurst, 3 thin slices ~40 g (estimate); Austrian Extrawurst = fine Brühwurst, BLS Lyoner (as Hungarian párizsi)")],
        S_BROT + [src(SPAR + "tann-extrawurst/p/5195275", R, "TANN AMA-Extrawurst geschnitten 150 g")], None),
    "kaesebrot": jause(
        {"hu": "Sajtos kenyér (ementáli)", "de": "Käsebrot (Emmentaler)", "de-AT": "Käsebrot", "en": "Cheese sandwich (Emmental)"},
        [ing("rye_mixed_bread", 50, note="1 Scheibe Hausbrot, 50 g"), ing("butter", 8, "fat", "butter, 8 g (estimate)"),
         ing("emmentaler", 40, note="2 Scheiben Emmentaler ~40 g (estimate)")],
        S_BROT + [src(SPAR + "s-budget-emmentaler-in-scheiben/p/2020005507678", R, "S-BUDGET Emmentaler in Scheiben 400 g")], None),
    "schinkensemmel": jause(
        {"hu": "Sonkás zsemle (vajjal)", "de": "Schinkenbrötchen", "de-AT": "Schinkensemmel", "en": "Ham roll"},
        [ing("wheat_roll", 62.5, note="1 Semmel (at.py SERVINGS)"), ing("butter", 10, "fat", "butter, 10 g (estimate)"),
         ing("ham_cooked", 50, note="Beinschinken (Kochschinken), 3 slices ~50 g (estimate)")],
        S_SEMMEL + [src(SPAR + "berger-traditions-bein-schinken/p/6780005", R, "Berger Traditions Beinschinken 100 g")], None),
    "kaesesemmel": jause(
        {"hu": "Sajtos zsemle (gouda)", "de": "Käsebrötchen (Gouda)", "de-AT": "Käsesemmel", "en": "Cheese roll (Gouda)"},
        [ing("wheat_roll", 62.5, note="1 Semmel"), ing("butter", 10, "fat", "butter, 10 g (estimate)"), ing("gouda", 40, note="2 Scheiben Gouda ~40 g (estimate)")],
        S_SEMMEL + [src(SPAR + "s-budget-gouda-48-fit-in-scheiben/p/1407969", R, "S-BUDGET Gouda 48 % F.i.T. in Scheiben 400 g")], None),
    "semmel_butter_marmelade": jause(
        {"hu": "Vajas-lekváros zsemle", "de": "Brötchen mit Butter und Marmelade", "de-AT": "Semmel mit Butter und Marmelade", "en": "Bread roll with butter and jam"},
        [ing("wheat_roll", 62.5, note="1 Semmel"), ing("butter", 10, "fat", "butter, 10 g (estimate)"), ing("jam", 20, note="Marillenmarmelade, 1 EL ~20 g (BLS Konfitüre extra)")],
        S_SEMMEL + [src(SPAR + "spar-konfituere-marille-naturrein/p/2020004164278", R, "SPAR Konfitüre Marille naturrein 450 g")], None),
    "schinken_kaese_toast": dict(
        names={"hu": "Sonkás-sajtos toast (osztrák)", "de": "Schinken-Käse-Toast", "de-AT": "Schinken-Käse-Toast", "en": "Ham and cheese toastie"},
        matrix="solid", servings_source=2, standard_serving_g=135,
        ingredients=[ing("toast_bread", 143, note="4 Stk Toastbrot; 35.7 g per slice (Morato American Sandwich 21 Scheiben 750 g)"),
                     ing("ham_cooked", 60, note="4 Schb Schinken; 15 g per slice is an estimate"), ing("gouda", 40, note="2 Schb Käse; 20 g per slice is an estimate"),
                     ing("butter", g(1, "tk_butter"), "fat", "1 TL Butter")],
        cooking=dict(method="assembled and toasted in a sandwich toaster", mass_change_g=-20, note="estimate: toasting drives off ~8 % water; paprika pinch left out"),
        sources=[src(GK + "toast-rezept-16319", R, "batch recipe: 4 Stk Toastbrot, 4 Schb Schinken, 2 Schb Käse, 1 TL Butter, 2 Portionen"),
                 src(IK + "schinken-kaese-toast-rezept-7725", R, "cross-check: Toastbrot, Schinken, Emmentaler oder Gouda, Butter, Ketchup"),
                 src(SPAR + "morato-pane-spa-american-sandwich-bianco-enthaelt-21-scheiben/p/2020005896239", R, "Morato American Sandwich 21 Scheiben 750 g (slice weight)")]),
    "liptauer": dict(
        names={"hu": "Körözött (osztrák, Liptauer)", "de": "Liptauer (Quarkaufstrich mit Paprika)", "de-AT": "Liptauer", "en": "Liptauer spread"},
        matrix="solid", servings_source=4, standard_serving_g=60,
        ingredients=[ing("quark_20", 250, note="250 g Topfen"), ing("butter", 100, "fat", "100 g Butter"), ing("sauerrahm", g(1, "ek_sour_cream"), note="1 EL Sauerrahm"),
                     ing("onion", g(1, "db_onion"), note="1 Zwiebel"), ing("bell_pepper_red", 150, note="1 Paprika rot; 150 g is an estimate"),
                     ing("paprika_ground", g(2.5, "tk_spice"), "seasoning", "2 1/2 TL Paprikapulver"), ing("mustard", g(1, "tk_mustard"), "seasoning", "1 TL Senf scharf"),
                     ing("caraway_seed", 0.5, "seasoning", "1 Prise Kümmel")],
        cooking=dict(method="mixed, no cooking", mass_change_g=0, note="no cooking; salt and pepper left out"),
        sources=[src(IK + "liptauer-rezept-3810", R, "batch recipe: 250 g Topfen, 100 g Butter, 1 EL Sauerrahm, 1 Zwiebel, 1 rote Paprika, 2 1/2 TL Paprikapulver, 1 TL Senf, Kümmel, 4 Portionen"),
                 src(IK + "liptauer-rezept-12915", R, "cross-check: 200 g Magertopfen, 1 Jungzwiebel, 1 TL Kapern, 1 Essiggurkerl, 1 TL Paprikapulver, 1 TL Senf, 4 Portionen")]),
    "brotscheibe": jause(
        {"hu": "Kenyérszelet (rozsos vegyes)", "de": "Scheibe Roggenmischbrot", "de-AT": "Scheibe Hausbrot", "en": "Slice of rye-wheat bread"},
        [ing("rye_mixed_bread", 50, note="1 Scheibe, 50 g")], S_BROT, None),
    # ---- bakery: BLS records, piece weight from two retail products ------------------------
    "kornspitz": bakery({"hu": "Kornspitz (magvas péksütemény)", "de": "Kornspitz (Mehrkornbrötchen)", "de-AT": "Kornspitz", "en": "Kornspitz (multigrain roll)"},
                        "multigrain_roll", 67.5, [src(SPAR + "s-budget-original-kornspitz/p/7898976", R, "S-BUDGET original Kornspitz 75 g"),
                                                  src(SPAR + "spar-naturpur-bio-original-kornspitz/p/7920189", R, "SPAR Natur*pur Bio original Kornspitz 60 g"),
                                                  src(GK + "kornspitz-rezept-32859", R, "cross-check (home-made): Weizenvollkornmehl, Buttermilch, Leinsamen, Sesam, Germ")],
                        "1 Kornspitz = mean of 75 g and 60 g; BLS Mehrkornbrötchen"),
    "salzstangerl": bakery({"hu": "Sós-köményes rúd (Salzstangerl)", "de": "Salzstange (Brötchen mit Salz und Kümmel)", "de-AT": "Salzstangerl", "en": "Salt and caraway roll (Salzstangerl)"},
                           "salt_caraway_roll", 60, [src(SPAR + "spar-naturpur-bio-salzstangerl/p/8060716", R, "SPAR Natur*pur Bio Salzstangerl 60 g"),
                                                    src(IK + "salzstangerl-rezept-10463", R, "cross-check (home-made): 800 g Mehl, 25 g Germ, 50 g Öl, 200 ml Milch, 220 ml Wasser, Salz und Kümmel, 12 Stück")],
                           "1 Salzstangerl = 60 g (retail); BLS Weizenbrötchen mit Kümmel und Salz"),
    "butterkipferl": bakery({"hu": "Vajas kifli (bécsi)", "de": "Butterhörnchen (Wiener Kipferl)", "de-AT": "Butterkipferl", "en": "Butter crescent roll (Kipferl)"},
                            "wiener_kipferl", 65, [src(SPAR + "spar-naturpur-bio-wiener-kipferl/p/2020004708670", R, "SPAR Natur*pur Bio Wiener Kipferl 60 g"),
                                                  src(SPAR + "thurner-butterkipferl-2-stueck/p/5668212", R, "Thurner Butterkipferl 2 Stück 140 g (70 g)"),
                                                  src(IK + "butterkipferl-rezept-233304", R, "cross-check (home-made): 500 g Mehl, 45 g Zucker, 50 g Butter, 30 g Germ, 275 ml Milch")],
                            "1 Kipferl = mean of 60 g and 70 g; BLS Wiener Hörnchen (Hefeteig)"),
    "laugenbrezel": bakery({"hu": "Lúgos perec", "de": "Laugenbrezel", "de-AT": "Laugenbreze (Laugenbrezel)", "en": "Soft pretzel"},
                           "pretzel_roll", 86, [src(SPAR + "spar-naturpur-bio-laugenbreze/p/2020003447693", R, "SPAR Natur*pur Bio-Laugenbreze 82 g"),
                                               src(SPAR + "s-budget-laugenbreze/p/7904356", R, "S-BUDGET Laugenbreze 90 g")],
                           "1 Breze = mean of 82 g and 90 g; BLS Laugengebäck (Hagelsalz entfernt)"),
    "croissant": bakery({"hu": "Vajas croissant", "de": "Buttercroissant", "de-AT": "Buttercroissant", "en": "Butter croissant"},
                        "croissant", 60, [src(SPAR + "s-budget-buttercroissant/p/7615153", R, "S-BUDGET Buttercroissant 60 g"),
                                          src(SPAR + "spar-naturpur-bio-buttercroissant/p/2020003902109", R, "SPAR Natur*pur Bio-Buttercroissant 60 g")],
                        "1 croissant = 60 g; BLS Croissant (Plunderteig)"),
    # ---- pastries from recipes -------------------------------------------------------------
    "krapfen": dict(
        names={"hu": "Farsangi fánk baracklekvárral (Krapfen)", "de": "Berliner mit Aprikosenkonfitüre (Krapfen)", "de-AT": "Faschingskrapfen (Marillenkrapfen)", "en": "Apricot jam doughnut (Krapfen)"},
        matrix="solid", servings_source=18, standard_serving_g=80,
        ingredients=[ing("wheat_flour", 500, note="500 g Mehl"), ing("sugar", 50, note="50 g Zucker"), ing("yeast_fresh", 40, note="40 g Germ"), ing("milk_whole", 155, "liquid", "150 ml Milch"),
                     ing("egg", g(2, "db_egg"), note="2 Eier"), ing("sunflower_oil", g(2, "ek_oil"), "fat", "2 EL Öl"), ing("rum", 30, "seasoning", "2 EL Rum"),
                     ing("egg_white", 33, note="1 Eiklar"), ing("jam", 150, note="150 g Marillenmarmelade (BLS Konfitüre extra)"),
                     ing("clarified_butter", 120, "absorbed_fat", "fried in 750 g Butterreinfett; ~120 g taken up is an estimate (BLS Krapfen frittiert: 17 % fat)"),
                     ing("powdered_sugar", 36, "garnish", "Staubzucker zum Bestäuben; 2 g per Krapfen is an estimate")],
        cooking=dict(method="yeast dough, 18 Krapfen fried floating, filled with jam, dusted", mass_change_g=-90, note="estimate: ~10 % water loss while frying; salt left out. Standard serving = one retail Krapfen (80 g); the source's pieces are ~60 g"),
        sources=[src(IK + "krapfen-rezept-66297", R, "batch recipe: 500 g Mehl, 50 g Zucker, 40 g Germ, 150 ml Milch, 2 Eier, 2 EL Öl, 2 EL Rum, 150 g Marillenmarmelade, Kokosfett oder Butterreinfett, 18 Stück"),
                 src(IK + "krapfen-rezept-24695", R, "cross-check: 500 g Mehl, 30 g Germ, 150 ml Milch, 50 g Zucker, 2 Eier, 80 g Butter, Rum, Marmelade, 20 Stück"),
                 src(SPAR + "s-budget-krapfen-marille/p/2020000951414", R, "S-BUDGET Krapfen Marille 80 g (piece weight)"),
                 src(SPAR + "interspar-backstube-krapfen-marille/p/8077363", R, "INTERSPAR Backstube Krapfen Marille 80 g (piece weight)")]),
    "topfengolatsche": dict(
        names={"hu": "Túrós batyu leveles tésztából (Topfengolatsche)", "de": "Quarktasche aus Blätterteig (Topfengolatsche)", "de-AT": "Topfengolatsche", "en": "Quark puff pastry (Topfengolatsche)"},
        matrix="solid", servings_source=8, standard_serving_g=72,
        ingredients=[ing("puff_pastry", 330, note="1 Pk Blätterteig (330 g)"), ing("egg", g(1, "db_egg"), "coating", "1 Ei verquirlt zum Bestreichen"),
                     ing("powdered_sugar", g(1, "ek_powdered_sugar") + 50, note="1 EL + 50 g Staubzucker"), ing("egg_yolk", 18, note="1 Dotter"),
                     ing("corn_starch", 4, note="1 TL Maisstärke"), ing("raisins", 10, note="1 EL Rosinen"), ing("quark_20", 150, note="150 g Topfen (20 % Fett)"),
                     ing("pudding_powder_vanilla", 10, note="1 EL Vanillepuddingpulver"), ing("vanilla_sugar", g(1, "pkg_vanilla_sugar"), note="1 Pk Vanillinzucker")],
        cooking=dict(method="puff pastry squares filled with sweet quark, folded, baked ~20 min at 200 °C", mass_change_g=-65, note="estimate: ~10 % baking loss; lemon zest, salt left out. 8 Golatschen"),
        sources=[src(GK + "topfengolatschen-rezept-1213", R, "batch recipe: 1 Pk Blätterteig 330 g, 150 g Topfen, 58 g Staubzucker, 1 Dotter, 1 Ei, Rosinen, Vanillepuddingpulver, 8 Stück"),
                 src(IK + "topfengolatschen-rezept-8318", R, "cross-check: 540 g Blätterteig, 250 g Topfen 20 %, 20 g Butter, 80 g Staubzucker, 1 EL Maisstärke, 1 Dotter, 50 g Rosinen, 12 Stück")]),
    "buchteln": dict(
        names={"hu": "Bukta szilvalekvárral (Buchteln)", "de": "Rohrnudeln mit Pflaumenmus (Buchteln)", "de-AT": "Buchteln (Powidlbuchteln)", "en": "Baked jam buns (Buchteln)"},
        matrix="solid", servings_source=4, standard_serving_g=245,
        ingredients=[ing("wheat_flour", 500, note="500 g Weizenmehl (glatt, W480)"), ing("butter", 80 + g(1, "ek_butter"), "fat", "80 g Butter (weich) + 1 EL zerlassen"),
                     ing("egg_yolk", 18, note="1 Eidotter"), ing("sugar", 80, note="80 g feiner Zucker"), ing("yeast_fresh", 20, note="20 g Germ"),
                     ing("milk_whole", 232, "liquid", "225 ml Milch"), ing("plum_butter", 160, note="8 EL Powidl; 20 g per EL"),
                     ing("powdered_sugar", g(1, "ek_powdered_sugar") + 2, "garnish", "1 EL + 1 Prise Staubzucker")],
        cooking=dict(method="yeast dough pieces filled with Powidl, packed in a buttered tin, baked ~30 min", mass_change_g=-135, note="estimate: ~12 % baking loss; vanilla, lemon zest, salt left out"),
        flat_plate=dict(coverage=0.13, height_cm=5.0),
        sources=[src(GK + "buchteln-rezept-834", R, "batch recipe: 500 g Mehl, 80 g Butter, 1 Dotter, 80 g Zucker, 20 g Germ, 225 ml Milch, 8 EL Powidl, Staubzucker, 4 Portionen"),
                 src(GK + "buchteln-rezept-913", R, "cross-check: 500 g Mehl, 150 g Butter, 1 Ei, 1 Dotter, 25 g Germ, 125 ml Milch, 50 g Zucker, 3 EL Marillenmarmelade, 6 Portionen")]),
    "nussschnecke": dict(
        names={"hu": "Diós csiga", "de": "Nussschnecke", "de-AT": "Nussschnecke", "en": "Nut swirl (Nussschnecke)"},
        matrix="solid", servings_source=25, standard_serving_g=120,
        ingredients=[ing("wheat_flour", 500, note="250 g glatt + 250 g griffig"), ing("butter", 60, "fat", "60 g Butter"), ing("egg", g(1, "db_egg"), "coating", "1 Ei zum Bestreichen"),
                     ing("egg_yolk", 36, note="2 Eidotter"), ing("yeast_fresh", 42, note="42 g Germ (1 Würfel)"), ing("sugar", 50, note="50 g Kristallzucker"),
                     ing("milk_whole", 206, "liquid", "200 ml Milch"), ing("hazelnut", 250, note="250 g Haselnüsse (gemahlen)"), ing("rum", 15, "seasoning", "1 EL Rum"),
                     ing("powdered_sugar", g(3, "ek_powdered_sugar") + 100, note="3 EL Staubzucker (filling) + 100 g Staubzucker (glaze)"), ing("egg_white", 33, note="1 Eiklar"),
                     ing("jam", g(2, "ek_jam"), note="2 EL Marmelade"), ing("lemon_juice", 10, "seasoning", "1 Schuss Zitronensaft")],
        cooking=dict(method="yeast dough rolled with nut filling, cut in 25 swirls, baked, glazed", mass_change_g=-140,
                     note="estimate: ~10 % baking loss; cinnamon (MISSING), lemon zest, salt left out. Standard serving = one bakery Nussschnecke (mean of SPAR 140 g and Ölz 300 g / 3); the source's swirls are ~50 g"),
        sources=[src(GK + "nussschnecken-rezept-2140", R, "batch recipe: 500 g Mehl, 60 g Butter, 2 Dotter, 42 g Germ, 50 g Zucker, 200 ml Milch, 250 g Haselnüsse, Rum, Staubzucker, Marmelade, 25 Stück"),
                 src(SPAR + "spar-butter-nussschnecke/p/2020004437327", R, "SPAR Butter-Nussschnecke 140 g (piece weight)"),
                 src(SPAR + "oelz-nussschnecken-2-1-gratis/p/3116333", R, "Ölz Nussschnecken 2+1 300 g (100 g each, piece weight)")]),
    "marmorgugelhupf": dict(
        names={"hu": "Márványkuglóf", "de": "Marmorkuchen (Gugelhupf)", "de-AT": "Marmorgugelhupf", "en": "Marble bundt cake"},
        matrix="solid", servings_source=15, standard_serving_g=95,
        ingredients=[ing("egg", g(6, "db_egg"), note="6 Eier"), ing("cocoa_powder", 100, note="100 g Kakao"), ing("wheat_flour", 380, note="380 g Mehl"),
                     ing("milk_whole", 191, "liquid", "0,125 l + 0,06 l Milch"), ing("sunflower_oil", 170, "fat", "0,06 l + 0,125 l Öl"),
                     ing("vanilla_sugar", 12, note="1,5 Pk Vanillezucker"), ing("sugar", 380, note="380 g Zucker"), ing("baking_powder", 24, note="1,5 Pk Backpulver")],
        cooking=dict(method="oil sponge, half coloured with cocoa, baked in a Gugelhupf tin ~50 min", mass_change_g=-155, note="estimate: ~10 % baking loss; crumbs and butter for the tin left out. 15 slices"),
        sources=[src(GK + "gugelhupf-rezept-3537", R, "batch recipe: 6 Eier, 100 g Kakao, 380 g Mehl, 185 ml Milch, 185 ml Öl, 380 g Zucker, 1,5 Pk Backpulver, 1,5 Pk Vanillezucker, 15 Portionen"),
                 src(IK + "gugelhupf-rezept-44457", R, "cross-check: 400 g Mehl, 100 g Maisstärke, Backpulver, 200 g Zucker, 250 g Butter, 4 Eier, 125 ml Weißwein")]),
    "birchermuesli": dict(
        names={"hu": "Bircher-müzli", "de": "Birchermüsli", "de-AT": "Birchermüsli", "en": "Bircher muesli"},
        matrix="solid", servings_source=4, standard_serving_g=300,
        ingredients=[ing("oat_flakes", 60, note="60 g Haferflocken grob"), ing("water", 180, "liquid", "12 EL Wasser"), ing("milk_whole", 90, "liquid", "6 EL Milch bzw. Joghurt: milk"),
                     ing("lemon_juice", g(1, "db_lemon_juice"), "seasoning", "1 Zitrone (Saft)"), ing("apple", 800, note="4 große Äpfel, grated with peel; 200 g each is an estimate"),
                     ing("hazelnut", 48, note="6 EL Nüsse; 8 g per EL is an estimate"), ing("honey", g(1, "ek_honey"), "seasoning", "'Zucker brauner oder Honig': 1 EL Honig is an estimate")],
        cooking=dict(method="oats soaked overnight, mixed with grated apple, nuts and honey", mass_change_g=0, note="no cooking"),
        sources=[src(IK + "birchermuesli-rezept-46326", R, "batch recipe: 60 g Haferflocken, 12 EL Wasser, 6 EL Milch, 1 Zitrone, 4 große Äpfel, 6 EL Nüsse, Honig, 4 Portionen"),
                 src(GK + "bircher-muesli-rezept-8736", R, "cross-check: 100 g Haferflocken, 0,25 l Milch, 2 Äpfel, 3 EL Cornflakes, 2 EL Rosinen, 50 g Zwetschgen, 4 Portionen")]),
    "ham_and_eggs": dict(
        names={"hu": "Sonkás-szalonnás tükörtojás (Ham and Eggs)", "de": "Spiegeleier mit Schinken und Speck", "de-AT": "Ham and Eggs", "en": "Ham and eggs"},
        matrix="solid", servings_source=4, standard_serving_g=170,
        ingredients=[ing("butter", 20, "fat", "20 g Butter"), ing("egg", g(8, "db_egg"), note="8 Eier"),
                     ing("ham_cooked", 100, note="200 g Schinken und oder Speck: half ham, half bacon is an estimate"), ing("smoked_bacon", 100),
                     ing("chives", 3, "garnish", "1 Prise Schnittlauch"), ing("tomato", 25, "garnish", "1 Schb Tomate; 25 g is an estimate")],
        cooking=dict(method="ham and bacon fried, eggs cracked on top and fried", mass_change_g=-70, note="estimate: eggs and bacon lose ~15 % water; salt left out"),
        flat_plate=dict(coverage=0.33, height_cm=1.5),
        sources=[src(GK + "ham-and-eggs-rezept-1520", R, "batch recipe: 20 g Butter, 8 Eier, 200 g Schinken und/oder Speck, Schnittlauch, Tomate, 4 Portionen"),
                 src(IK + "ham-and-eggs-rezept-7731", R, "cross-check: 1 Ei, 1/2 EL Butter, Frühstücksspeck, Frühlingszwiebel, 1 Portion")]),
}


def D(id, parts, aliases, served_in="handheld", tags=("breakfast", "higher-carb"), countries=("AT",), **kw):
    return dict(id=id, countries=list(countries), category="everyday", part_refs=parts, served_in=served_in, tags=list(tags), aliases=aliases, **kw)


BUTTER = [{"food_key": "butter", "g": 10, "hu": "vaj"}]
DISHES = [
    D("at_butterbrot_schnittlauch", [("butterbrot_schnittlauch", 63)],
      {"de-AT": ["schnittlauchbrot", "butterbrot", "butterbrot mit schnittlauch", "butterbrot mit salz"], "de": ["butterbrot", "butterbrot mit schnittlauch"], "hu": ["vajas kenyér", "metélőhagymás vajas kenyér"], "en": ["bread and butter", "bread with butter and chives"]}),
    D("at_wurstbrot", [("wurstbrot", 95)],
      {"de-AT": ["wurstbrot", "extrawurstbrot", "extrawurst brot", "wurstbrot mit extrawurst"], "de": ["wurstbrot", "lyonerbrot"], "hu": ["párizsis kenyér", "osztrák párizsis kenyér"], "en": ["sausage sandwich", "extrawurst sandwich"]},
      review="Az Extrawurst a BLS Lyoner rekordjára mutat (finom Brühwurst, mint a magyar párizsi); az osztrák Codex szerint azonos osztály."),
    D("at_kaesebrot", [("kaesebrot", 98)],
      {"de-AT": ["käsebrot", "emmentalerbrot", "käsebrot mit butter"], "de": ["käsebrot", "käsestulle"], "hu": ["sajtos kenyér ementálival"], "en": ["cheese sandwich", "bread with cheese"]}),
    D("at_schinkensemmel", [("schinkensemmel", 122.5)],
      {"de-AT": ["schinkensemmel", "schinkensemmerl", "semmel mit schinken"], "de": ["schinkenbrötchen", "brötchen mit schinken"], "hu": ["sonkás zsemle"], "en": ["ham roll", "ham sandwich roll"]}),
    D("at_kaesesemmel", [("kaesesemmel", 112.5)],
      {"de-AT": ["käsesemmel", "käsesemmerl", "semmel mit käse"], "de": ["käsebrötchen", "brötchen mit käse"], "hu": ["sajtos zsemle"], "en": ["cheese roll"]}),
    D("at_semmel_butter_marmelade", [("semmel_butter_marmelade", 92.5)],
      {"de-AT": ["semmel mit butter und marmelade", "butter-marmelade-semmel", "marmeladesemmel", "buttersemmel mit marmelade"], "de": ["brötchen mit butter und marmelade", "marmeladenbrötchen"],
       "hu": ["vajas-lekváros zsemle", "lekváros zsemle"], "en": ["bread roll with butter and jam"]},
      tags=("breakfast", "sweet", "higher-carb")),
    D("at_schinken_kaese_toast", [("schinken_kaese_toast", 135)],
      {"de-AT": ["schinken-käse-toast", "schinken käse toast", "toast", "käsetoast", "schinkentoast"], "de": ["schinken-käse-toast", "käse-schinken-toast", "toast mit schinken und käse"],
       "hu": ["sonkás-sajtos toast", "sonkás sajtos melegszendvics toastból"], "en": ["ham and cheese toastie", "toasted ham and cheese sandwich"]},
      review="Gouda helyett Emmentaler is gyakori; a magyar melegszendvics (hu_melegszendvics) lapkasajttal és sütőben készül."),
    D("at_liptauerbrot", [("brotscheibe", 50), ("liptauer", 40)],
      {"de-AT": ["liptauerbrot", "liptauer brot", "brot mit liptauer", "liptauer"], "de": ["liptauerbrot", "brot mit liptauer"], "hu": ["körözöttes kenyér osztrák módra", "liptói kenyér"], "en": ["liptauer on bread", "liptauer spread on bread"]},
      names={"hu": "Liptói körözöttes kenyér", "de": "Brot mit Liptauer", "de-AT": "Liptauerbrot", "en": "Bread with Liptauer spread"}),
    D("at_kornspitz", [("kornspitz", 67.5)],
      {"de-AT": ["kornspitz", "kornspitze", "kornspitz natur"], "de": ["kornspitz", "mehrkornbrötchen"], "hu": ["kornspitz", "magvas kifli"], "en": ["kornspitz", "multigrain roll"]},
      optional_toppings=BUTTER, tags=("breakfast", "bread", "higher-carb")),
    D("at_salzstangerl", [("salzstangerl", 60)],
      {"de-AT": ["salzstangerl", "salzstangerln", "salzstange", "kümmelweckerl"], "de": ["salzstange", "kümmelstange"], "hu": ["sós rúd köményes", "salzstangerl"], "en": ["salt stick roll", "salzstangerl"]},
      optional_toppings=BUTTER, tags=("breakfast", "bread", "higher-carb")),
    D("at_butterkipferl", [("butterkipferl", 65)],
      {"de-AT": ["butterkipferl", "kipferl", "wiener kipferl", "buttersemmel kipferl"], "de": ["butterhörnchen", "hörnchen"], "hu": ["vajas kifli osztrák", "bécsi kifli"], "en": ["butter crescent roll", "kipferl"]},
      optional_toppings=BUTTER, tags=("breakfast", "bread", "higher-carb"),
      review="A magyar kifli (vizes kifli) más péksütemény; itt az osztrák kelt tésztás Butterkipferl."),
    D("at_laugenbrezel", [("laugenbrezel", 86)],
      {"de-AT": ["laugenbreze", "laugenbrezel", "brezel", "breze", "laugenbrezen"], "de": ["laugenbrezel", "brezel", "breze", "brezn"], "hu": ["lúgos perec", "perec"], "en": ["soft pretzel", "pretzel"]},
      optional_toppings=BUTTER, tags=("breakfast", "bread", "higher-carb")),
    D("at_croissant", [("croissant", 60)],
      {"de-AT": ["croissant", "buttercroissant", "butter-croissant"], "de": ["croissant", "buttercroissant"], "hu": ["croissant", "vajas croissant"], "en": ["croissant", "butter croissant"]},
      tags=("breakfast", "pastry", "higher-carb")),
    D("at_krapfen", [("krapfen", 80)],
      {"de-AT": ["krapfen", "faschingskrapfen", "marillenkrapfen", "krapferl"], "de": ["berliner", "krapfen", "pfannkuchen mit marmelade"], "hu": ["farsangi fánk", "lekváros fánk", "krapfen"], "en": ["jam doughnut", "krapfen", "berliner"]},
      tags=("sweet", "pastry", "fried", "higher-carb"),
      reference_check=dict(catalog="bls:D7A6200", name="Berliner/Pfannkuchen/Krapfen (Hefeteig) frittiert, gefüllt mit Konfitüre", kcal=329, fat=13.7, protein=6.2, net_carbs=44.0),
      review="A magyar fánk (hu_fank) lekvár nélkül, tetejére kenve; az osztrák Krapfen töltött."),
    D("at_topfengolatsche", [("topfengolatsche", 72)],
      {"de-AT": ["topfengolatsche", "topfengolatschen", "golatsche", "topfentascherl"], "de": ["quarktasche", "quarkplunder"], "hu": ["túrós batyu leveles tésztából", "túrós táska leveles"], "en": ["quark pastry", "cheese danish"]},
      tags=("sweet", "pastry", "higher-carb"),
      reference_check=dict(catalog="bls:D471700", name="Quarktaschen (Quark-Öl-Teig)", kcal=308, fat=11.4, protein=9.0, net_carbs=41.1,
                           deviation="RECEPTKÜLÖNBSÉG: a Topfengolatsche leveles tésztából készül, a BLS-referencia Quark-Öl-Teig (kevesebb zsír); nem hangoltuk."),
      review="A magyar túrós táska (hu_turos_taska) kelt tésztás; az osztrák Topfengolatsche leveles tésztából."),
    D("at_buchteln", [("buchteln", 245)],
      {"de-AT": ["buchteln", "ofenbuchteln", "powidlbuchteln", "wuchteln", "buchtel"], "de": ["rohrnudeln", "buchteln"], "hu": ["bukta", "lekváros bukta osztrák"], "en": ["baked jam buns", "buchteln"]},
      served_in="flat_plate", tags=("sweet", "higher-carb"),
      reference_check=dict(catalog="bls:D741400", name="Buchteln (Hefeteig)", kcal=331, fat=12.46, protein=7.32, net_carbs=46.0),
      review="Adag a forrás negyede (~4 bukta)."),
    D("at_nussschnecke", [("nussschnecke", 120)],
      {"de-AT": ["nussschnecke", "nussschnecken", "nusschnecke"], "de": ["nussschnecke", "nussschnecken"], "hu": ["diós csiga"], "en": ["nut swirl", "nut roll pastry"]},
      tags=("sweet", "pastry", "higher-carb")),
    D("at_marmorgugelhupf", [("marmorgugelhupf", 95)],
      {"de-AT": ["marmorgugelhupf", "gugelhupf", "marmorkuchen", "ein stück gugelhupf"], "de": ["marmorkuchen", "gugelhupf", "napfkuchen"], "hu": ["márványkuglóf", "kuglóf"], "en": ["marble cake", "bundt cake"]},
      tags=("sweet", "cake", "higher-carb"),
      reference_check=dict(catalog="bls:D431100", name="Marmorkuchen (Rührmasse)", kcal=404, fat=19.79, protein=8.39, net_carbs=46.6)),
    D("at_birchermuesli", [("birchermuesli", 300)],
      {"de-AT": ["birchermüsli", "bircher müsli", "birchermuesli"], "de": ["birchermüsli", "bircher müsli", "overnight oats mit apfel"], "hu": ["bircher-müzli", "bircher müzli"], "en": ["bircher muesli", "bircher muesli with apple"]},
      served_in="deep_plate", tags=("breakfast", "vegetarian"),
      reference_check=dict(catalog="bls:X092060", name="Müsli Bircher-Benner Art, gesüßt, mit Äpfeln, Rosinen, Sahne und Nüssen", kcal=129, fat=4.3, protein=1.7, net_carbs=19.3,
                           deviation="RECEPTKÜLÖNBSÉG: az ichkoche-recept vízben áztatott zabot, sok almát és tejszín nélkül készül; a BLS Bircher-Benner tejszínnel és mazsolával számol; nem hangoltuk.")),
    D("at_ham_and_eggs", [("ham_and_eggs", 170)],
      {"de-AT": ["ham and eggs", "ham & eggs", "speck mit ei", "spiegelei mit speck", "eier mit speck"], "de": ["spiegeleier mit speck", "eier mit speck", "ham and eggs"], "hu": ["sonkás tükörtojás", "szalonnás tojás"], "en": ["ham and eggs", "bacon and eggs"]},
      served_in="flat_plate", tags=("breakfast", "eggs", "low-carb-friendly"),
      reference_check=dict(catalog="bls:Y710362", name="Spiegelei gebraten mit Schinkenspeck", kcal=201, fat=14.91, protein=16.19, net_carbs=0.46)),
    D("at_frankfurter_senf_semmel", [("frankfurter_wuerstel", 122.5), ("semmel", 62.5)],
      {"de-AT": ["frankfurter mit senf", "frankfurter mit senf und kren", "ein paar frankfurter", "frankfurter mit semmel", "paar würstel mit senf"], "de": ["wiener würstchen mit senf und brötchen", "würstchen mit brötchen"],
       "hu": ["virsli mustárral és zsemlével", "pár virsli zsemlével"], "en": ["frankfurters with mustard and roll", "pair of frankfurters"]},
      names={"hu": "Egy pár virsli zsemlével", "de": "Ein Paar Wiener Würstchen mit Brötchen", "de-AT": "Ein Paar Frankfurter mit Semmel", "en": "A pair of frankfurters with a bread roll"},
      served_in="flat_plate", tags=("everyday",), optional_toppings=[{"food_key": "mustard", "g": 15, "hu": "mustár"}, {"food_key": "horseradish", "g": 5, "hu": "torma"}],
      review="1 pár (2 db) Frankfurter = 122,5 g; mustár és torma választható feltét (a magyar hu_virsli_mustarral más)."),
]

MISSING = []
