"""Germany (DE): reference dishes.

Phase 1 (2026-09-27): format samples. Phase 4 (2026-10-11): the full German
set, one module per group (de_*.py), loaded through PHASE4_MODULES below the
same way at.py loads its phase-3 modules. Dishes eaten the same way in Austria
or Hungary are not copied: the existing AT/HU dish gains DE (see README).
INVENTORY lists German dishes that could not be built (no catalog record for
an essential ingredient), with the reason.
"""
from common import ing, src

SIDE_WITH = {}

R = "2026-09-27"

PARTS = {
    "bratkartoffeln": dict(
        names={"hu": "Pirított burgonya szalonnával és hagymával", "de": "Bratkartoffeln mit Speck und Zwiebeln", "de-AT": "Geröstete Erdäpfel mit Speck", "en": "German fried potatoes with bacon and onion"},
        matrix="dry", bulk_density_g_ml=0.65, servings_source=2, standard_serving_g=250,
        ingredients=[ing("potato", 500, note="waxy (festkochend), peeled"), ing("smoked_bacon", 90, note="durchwachsener Speck, 80-100 g"),
                     ing("onion", 80, note="1 onion"), ing("clarified_butter", 10, "fat", "1 EL Butterschmalz")],
        cooking=dict(method="pan-fried in bacon fat and Butterschmalz ~20 min until crisp", mass_change_g=-100,
                     note="frying drives ~15% of the potato and onion water off"),
        flat_plate=dict(coverage=0.45, height_cm=2.5),
        sources=[src("https://www.essen-und-trinken.de/rezepte/55725-rzpt-klassische-bratkartoffeln", R, "500 g Kartoffeln, 80 g Speck, 1 Zwiebel, 1 EL Butterschmalz, 1 EL Butter, 2 Portionen"),
                 src("https://www.gutekueche.de/bratkartoffeln-mit-speck-und-zwiebel-rezept-28363", R, "500 g Kartoffeln, 100 g Speck, 1 Zwiebel, 2 Portionen")]),
}

DISHES = [
    dict(id="de_bratkartoffeln", countries=["DE"], category="traditional", part_refs=[("bratkartoffeln", 250)], served_in="flat_plate",
         tags=["traditional", "fried", "higher-carb"],
         aliases={"de": ["bratkartoffeln", "bratkartoffeln mit speck", "bratkartoffeln mit speck und zwiebeln"], "de-AT": ["geröstete erdäpfel"],
                  "hu": ["pirított burgonya", "pirított krumpli"], "en": ["german fried potatoes", "fried potatoes with bacon"]}),
]

SERVINGS = []
FOOD_ALIASES = []
MISSING_FOODS = []

# Phase-1 dishes carrying DE; the phase-4 minimums count the dishes built on top of them.
PHASE1_DISH_IDS = ("de_bratkartoffeln", "at_schweinsbraten", "xx_eierspeis", "xx_leberkaessemmel")

# German dishes that stay out until their essential ingredient has a catalog
# record (name -> reason), like Burenwurst in at.py.
INVENTORY = {"traditional": ["Frankfurter Kranz"], "everyday": [], "street_food": []}
INVENTORY_REASONS = {
    "Frankfurter Kranz": "the butter-cream ring cake is covered with ~500 g Haselnusskrokant (gutekueche.de, lecker.de); BLS 4.0 has no Krokant record (only Sesam-Krokant) - not substituted",
}

# Austrian and Hungarian dishes that Germans eat the same way: the existing
# dish gains DE and one dated German cross-check source (on its own part, so
# no other dish's sources change); its recipe, parts and grams stay as they
# are. Kept here, not in the AT/HU modules, so those files stay unchanged; a
# German recipe that differs is its own de_* dish instead (Krustenbraten,
# Schweinshaxe, Döner, Currywurst...). A part shared with other AT dishes
# (Semmelknödel) gets no extra source. Value: (part id or None, source, extra de aliases).
R4 = "2026-10-11"
GK_DE = "https://www.gutekueche.de/"
REUSE = {
    # traditional
    "at_kaesespaetzle": ("kaesespaetzle", src(GK_DE + "allgaeuer-kaesespaetzle-rezept-69", R4, "DE cross-check (phase 4): 400 g Mehl, 4 Eier, 200 ml Wasser, 150 g Allgäuer Emmentaler, 50 g Butterschmalz, 2 Zwiebeln, Schnittlauch, 4 Portionen - same dish"), []),
    "at_kaiserschmarrn": ("kaiserschmarrn", src(GK_DE + "kaiserschmarrn-rezept-1695", R4, "DE cross-check (phase 4): 3 Eier, 250 ml Milch, 120 g Mehl, 1 EL Zucker, 2 EL Butter, Puderzucker, 3 Portionen - same dish"), []),
    "at_apfelstrudel": ("apfelstrudel", src(GK_DE + "apfelstrudel-rezept-12942", R4, "DE cross-check (phase 4): 100 g Mehl, Öl, Wasser, 750 g Äpfel, 50 g Zucker, 40 g Butter, 60 g Paniermehl, 6 Portionen - same dish"), []),
    "at_semmelknoedel": (None, None, ["semmelknödel bayerisch"]),
    "at_leberknoedelsuppe": ("leberknoedel", src(GK_DE + "leberknoedelsuppe-rezept-313", R4, "DE cross-check (phase 4): 2 Brötchen, 2 Eier, 125 ml Milch, 400 g Rinderleber, Zwiebel, Paniermehl, 1 l Fleischbrühe, 4 Portionen - same dish (beef instead of calf liver)"), []),
    "at_frittatensuppe": ("frittaten", src(GK_DE + "flaedlesuppe-rezept-1915", R4, "DE cross-check (phase 4): 100 g Mehl, 250 ml Milch, 2 Eier, 60 g Butter, 1 l Gemüsebrühe, 4 Portionen - same dish (Flädlesuppe)"), ["flädle suppe", "schwäbische flädlesuppe"]),
    "at_griessnockerlsuppe": ("griessnockerl", src(GK_DE + "traditionelle-griesskloesschensuppe-rezept-3236", R4, "DE cross-check (phase 4): 110 g Hartweizengrieß, 30 g Butter, 2 Eier, 100 ml Milch, 1 l Gemüsebrühe, 4 Portionen - same dish (Grießklößchen)"), []),
    "at_martinigansl": ("martinigansl", src(GK_DE + "martinsgans-rezept-2542", R4, "DE cross-check (phase 4): 1 junge Gans à 4 kg, Äpfel, Birnen, Orange, Suppengrün, Beifuß, Majoran, Bier, 4 Portionen - same roast goose"), []),
    "at_germknoedel": ("germknoedel", src(GK_DE + "germknoedel-rezept-11903", R4, "DE cross-check (phase 4): 250 g Mehl, 1/2 Würfel Hefe, Milch, 50 g Butter, Ei, Eigelb, 4 EL Pflaumenmus, 25 g Mohn, 50 g Butter, 4 Portionen - same dish"), []),
    "at_wiener_schnitzel_schwein": ("wiener_schnitzel_schwein", src("https://www.lecker.de/schnitzel-wiener-art-15000.html", R4, "DE cross-check (phase 4): 4 Schweineschnitzel, 1 Ei, 5 EL Mehl, 75 g Paniermehl, Butterschmalz, 4 Personen - same breaded pork cutlet"), ["schnitzel", "paniertes schnitzel", "schweineschnitzel wiener art"]),
    "at_cordon_bleu": ("cordon_bleu", src(GK_DE + "cordon-bleu-rezept-5775", R4, "DE cross-check (phase 4): Schnitzel mit Kochschinken und Käse gefüllt, paniert (Mehl, Ei, Semmelbrösel), in Butterschmalz, 4 Portionen - same dish"), []),
    "at_forelle_muellerin": ("forelle_muellerin", src(GK_DE + "forelle-muellerin-rezept-1895", R4, "DE cross-check (phase 4): 4 Forellen, 40 g Mehl, 50 g Butter, Öl, Zitrone, 4 Portionen - same dish"), []),
    "at_krautwickel": ("krautwickel", src(GK_DE + "omas-kohlrouladen-rezept-1903", R4, "DE cross-check (phase 4): 1 Weißkohl, 1 kg Hackfleisch gemischt, 2 Brötchen, Ei, 2 Zwiebeln, 250 ml Fleischbrühe, Mehl, Sahne, Tomatenmark, 6 Portionen - same dish"), ["kohlroulade", "omas kohlrouladen"]),
    "at_faschierter_braten": ("faschierter_braten", src(GK_DE + "omas-hackbraten-rezept-865", R4, "DE cross-check (phase 4): 500 g Hackfleisch gemischt, 120 g Kalbsbrät, 2 Brötchen, Ei, 2 Zwiebeln, 500 ml Fleischbrühe, Crème fraîche, Sahne, 4 Portionen - same dish"), ["omas hackbraten"]),
    "at_huehnersuppe_nudeln": ("huehnersuppe_nudeln", src(GK_DE + "huehnersuppe-mit-nudeln-rezept-793", R4, "DE cross-check (phase 4): 1 Suppenhuhn (ca. 1.5 kg), Suppengrün, Möhren, Petersilienwurzel, Nudeln, 8 Portionen - same dish"), ["hühnersuppe mit nudeln", "hühnernudelsuppe"]),
    "at_zwiebelrostbraten": ("zwiebelrostbraten", src(GK_DE + "zwiebelrostbraten-rezept-2443", R4, "DE cross-check (phase 4): 800 g Rostbraten, 5 Zwiebeln, 3 EL Öl, 600 ml Rinderbrühe, Senf, Rotwein, 4 Portionen - same dish (Swabian Zwiebelrostbraten)"), ["schwäbischer zwiebelrostbraten"]),
    "at_gulaschsuppe": ("gulaschsuppe", src(GK_DE + "gulaschsuppe-rezept-100", R4, "DE cross-check (phase 4): 500 g Gulaschfleisch vom Rind, 300 g Kartoffeln, 3 Paprika, 2 EL Paprikapulver, 300 g Tomaten, 3 Zwiebeln, 1.75 l Wasser, 6 Portionen - same dish"), []),
    # everyday
    "hu_spaghetti_bolognese": ("spaghetti_bolognese", src(GK_DE + "spaghetti-bolognese-rezept-1810", R4, "DE cross-check (phase 4): 1 kg Hackfleisch, 500 g Spaghetti, passierte Tomaten, 2 Zwiebeln, Öl, 4 Portionen - same dish"), []),
    "hu_lasagne": ("lasagne", src(GK_DE + "lasagne-bolognese-rezept-20", R4, "DE cross-check (phase 4): 250 g Lasagneblätter, 500 g Rinderhack, 100 g Speck, Suppengrün, 2 Dosen Tomaten, 4 Portionen - same dish"), []),
    "hu_pizza_margherita": ("pizza_margherita", src(GK_DE + "pizza-margherita-rezept-22726", R4, "DE cross-check (phase 4): 250 g Mehl, 10 g Hefe, Olivenöl, 250 g Pizzatomaten, Mozzarella, Basilikum, 2 Portionen - same dish"), []),
    "hu_gorog_salata": ("gorog_salata", src(GK_DE + "griechischer-salat-rezept-1594", R4, "DE cross-check (phase 4): Feta, Paprika, Salatgurke, 400 g Tomaten, Zwiebel, Olivenöl, 3 Portionen - same dish"), []),
    "hu_tukortojas": ("tukortojas", src(GK_DE + "spiegelei-rezept-5771", R4, "DE cross-check (phase 4): 1 Ei, 1 TL Butter - same Spiegelei"), []),
    "hu_carbonara": ("carbonara", src(GK_DE + "spaghetti-carbonara-rezept-1777", R4, "DE cross-check (phase 4): 500 g Spaghetti, 4 Eigelb, 100 g Parmesan, 200 g Schinken, 50 g Butter, 4 Portionen - same dish (ham instead of bacon)"), []),
    "hu_cezarsalata": ("cezarsalata", src(GK_DE + "caesar-salad-rezept-1909", R4, "DE cross-check (phase 4): Römersalat, 80 g Bacon, 60 g Parmesan, Eigelb-Olivenöl-Dressing, Sardellen, 4 Portionen - same dish"), []),
    "hu_chili_con_carne": ("chili_con_carne", src(GK_DE + "chili-con-carne-rezept-31", R4, "DE cross-check (phase 4): 500 g Rinderhack, 1 Dose Kidneybohnen, Schalotten, Knoblauch, 500 ml Rinderbrühe, Chili, 4 Portionen - same dish"), []),
    "hu_tejbegriz": ("tejbegriz", src(GK_DE + "griessbrei-rezept-938", R4, "DE cross-check (phase 4): 1 l Milch, 100 g Weichweizengrieß, 6 EL Zucker, 4 Portionen - same dish"), []),
    "hu_rantott_csirkemell": ("rantott_csirkemell", src(GK_DE + "haehnchenschnitzel-mit-kartoffeln-rezept-27618", R4, "DE cross-check (phase 4): Hähnchenschnitzel in Mehl, Ei und Semmelbröseln, in Öl gebraten - same dish"), []),
    "at_toast_hawaii": ("toast_hawaii", src(GK_DE + "toast-hawaii-rezept-8273", R4, "DE cross-check (phase 4): 4 Schb Toastbrot, Butter, 4 Schb Kochschinken, 4 Ananasringe, 4 Schb Käse, Cocktailkirschen, 2 Portionen - same dish"), []),
    "at_schinken_kaese_toast": ("schinken_kaese_toast", src(GK_DE + "schinken-kaese-toast-rezept-28067", R4, "DE cross-check (phase 4): 4 Schb Toastbrot, 2 Schb Gouda, 2 Schb Kochschinken, Butter, 2 Portionen - same dish"), []),
    "at_birchermuesli": ("birchermuesli", src(GK_DE + "birchermuesli-rezept-4630", R4, "DE cross-check (phase 4): 75 g Haferflocken, 100 ml Milch, Joghurt, Apfel, Banane, Beeren, Mandeln, Honig, 2 Portionen - same dish"), []),
    "at_milchreis": ("milchreis", src(GK_DE + "milchreis-rezept-4084", R4, "DE cross-check (phase 4): 1 l Milch, 250 g Milchreis, 3 EL Zucker, Vanillezucker, Butter, Zimt, 4 Portionen - same dish"), []),
    "at_paradeisersalat": ("paradeisersalat", src(GK_DE + "tomatensalat-rezept-4886", R4, "DE cross-check (phase 4): 4 Tomaten, Lauchzwiebel, Essig, Olivenöl, Basilikum, 2 Portionen - same dish"), []),
    "at_spinat_ei_erdaepfel": ("cremespinat", src(GK_DE + "spinat-mit-spiegelei-rezept-24249", R4, "DE cross-check (phase 4): 250 g Blattspinat, saure Sahne, Knoblauch, 2 Spiegeleier, 1 Portion - same dish"), ["spinat mit ei und kartoffeln", "spinat, spiegelei und kartoffeln"]),
    "at_cevapcici": ("cevapcici", src(GK_DE + "cevapcici-rezept-398", R4, "DE cross-check (phase 4): 600 g Rinderhack, 200 g Kalbsbrät, Zwiebel, Knoblauch, Öl, 4 Portionen - same dish"), []),
    "at_ham_and_eggs": ("ham_and_eggs", src(GK_DE + "bacon-and-eggs-rezept-5427", R4, "DE cross-check (phase 4): 8 Eier, 8 Schb Frühstücksspeck, 4 Portionen - same dish"), []),
    "at_wurstsalat": ("wurstsalat", src(GK_DE + "schweizer-wurstsalat-rezept-284", R4, "DE cross-check (phase 4): 400 g Fleischwurst, 300 g Käse, Zwiebel, Essig-Öl-Marinade, 4 Portionen - same dish (Schweizer Wurstsalat)"), ["schweizer wurstsalat", "straßburger wurstsalat"]),
    "at_krautsalat": ("krautsalat", src(GK_DE + "krautsalat-rezept-2235", R4, "DE cross-check (phase 4): 1 kleiner Weißkohl, 1/2 Tasse Rapsöl, 1/2 Tasse Weißweinessig, Zucker, Zwiebel, 5 Portionen - same dish"), []),
    "at_faschierte_laibchen": ("faschierte_laibchen", src(GK_DE + "frikadellen-grundrezept-rezept-1763", R4, "DE cross-check (phase 4): 500 g Hackfleisch gemischt, 1 Brötchen, 1 Ei, 1 Zwiebel, Senf, Öl, 4 Portionen - same dish"),
                               ["frikadellen", "frikadelle", "buletten", "bulette", "fleischküchle", "hackfleischbällchen gebraten"]),
    "at_krapfen": ("krapfen", src(GK_DE + "berliner-rezept-4898", R4, "DE cross-check (phase 4): 500 g Mehl, 30 g Hefe, 250 ml Milch, 60 g Margarine, Ei, 40 g Zucker, 125 g Aprikosenkonfitüre, frittiert, 8 Stück - same pastry"),
                   ["pfannkuchen", "berliner pfannkuchen", "kreppel", "berliner ballen", "krapfen mit marmelade"]),
    "at_fischstaebchen_pueree": ("fischstaebchen", src("https://www.lecker.de/fischstaebchen-mit-kartoffelpueree-diaet-11125.html", R4, "DE cross-check (phase 4): Fischstäbchen mit Kartoffelpüree und Erbsen-Möhren - same dish"), []),
    "at_laugenbrezel": ("laugenbrezel", src(GK_DE + "brezeln-selbst-gemacht-rezept-4060", R4, "DE cross-check (phase 4): Laugenbrezeln (Weizenteig, Natronlauge, Salz) - same pastry"), ["brezn", "bretzel", "laugenbrezn"]),
    "at_croissant": ("croissant", src(GK_DE + "croissants-rezept-19", R4, "DE cross-check (phase 4): Buttercroissants (Hefe-Blätterteig) - same pastry"), []),
    "at_kaesesemmel": ("kaesesemmel", src("https://www.supermarktcheck.de/product/181802-gut-guenstig-gute-laune-weizenbroetchen-360g", R4, "DE cross-check (phase 4): a German Weizenbrötchen weighs 60 g (vs 62.5 g Semmel) - same sandwich"), ["käsebrötchen", "käseschrippe", "käseweck"]),
    "at_schinkensemmel": ("schinkensemmel", src("https://www.supermarktcheck.de/product/181802-gut-guenstig-gute-laune-weizenbroetchen-360g", R4, "DE cross-check (phase 4): a German Weizenbrötchen weighs 60 g (vs 62.5 g Semmel) - same sandwich"), ["schinkenschrippe", "schinkenweck"]),
    "at_semmel_butter_marmelade": ("semmel_butter_marmelade", src("https://www.supermarktcheck.de/product/181802-gut-guenstig-gute-laune-weizenbroetchen-360g", R4, "DE cross-check (phase 4): a German Weizenbrötchen weighs 60 g (vs 62.5 g Semmel) - same breakfast"), ["brötchen mit marmelade", "marmeladenbrötchen mit butter"]),
    "at_wurstbrot": ("wurstbrot", src("https://www.rewe.de/shop/p/harry-1688-steinofenbrot-500g/4923456", R4, "DE cross-check (phase 4): German Roggenmischbrot slice 56 g (vs 50 g) - same sandwich (Lyoner/Fleischwurst)"), ["wurststulle", "wurstbemme", "fleischwurstbrot"]),
    "at_kaesebrot": ("kaesebrot", src("https://www.rewe.de/shop/p/harry-1688-steinofenbrot-500g/4923456", R4, "DE cross-check (phase 4): German Roggenmischbrot slice 56 g (vs 50 g) - same sandwich"), ["käsebemme"]),
    "at_frankfurter_senf_semmel": (None, None, ["wiener mit senf", "wiener würstchen mit senf", "würstchen mit senf und brötchen"]),
    "at_leberkaese_spiegelei": (None, None, ["leberkäs mit spiegelei", "fleischkäse mit ei"]),
    # street food
    "at_cevapcici_fladenbrot": (None, None, []),
    "hu_hasabburgonya": (None, None, ["fritten", "pommes rot", "pommes weiß"]),
    "hu_gyros_pita": ("gyros_hus", src(GK_DE + "gyros-rezept-4312", R4, "DE cross-check (phase 4): 600 g Schweinenacken, Zwiebeln, Knoblauch, Olivenöl, Paprika, 4 Portionen - same pork gyros"), []),
    "hu_gyros_tal": (None, None, ["gyros mit pommes"]),
    "hu_doner": (None, None, ["hähnchendöner", "hähnchen-döner", "chicken döner"]),
    "hu_doner_tal": (None, None, ["döner-teller", "dönerteller mit pommes"]),
    "at_kebap": ("kebap_fleisch", src(GK_DE + "berliner-doener-rezept-7872", R4, "DE cross-check (phase 4): Berliner Döner: 600 g Kalbsschnitzel, Dönerbrot, Rotkohl, Eisbergsalat, Gurke, Tomate, Zwiebel, Joghurtsoße, 4 Portionen - same veal döner"), ["döner mit kalbfleisch", "kalbsdöner"]),
    "at_duerum": (None, None, ["dürüm döner", "yufka döner"]),
    "at_kebap_box": (None, None, ["döner box", "dönerbox mit pommes"]),
    "hu_falafel_wrap": (None, None, []),
    "hu_hamburger": ("hamburger_pogacsa", src(GK_DE + "cheeseburger-rezept-4568", R4, "DE cross-check (phase 4): 350 g Rinderhack, 6 Hamburger-Brötchen, Schmelzkäse, Zwiebel, Ketchup, Senf, 3 Portionen - same burger"), []),
    "hu_sajtos_hamburger": (None, None, []),
    "at_lahmacun": ("lahmacun", src(GK_DE + "lahmacun-rezept-4350", R4, "DE cross-check (phase 4): Hefeteig (1 kg Mehl), 500 g Lammhack + 500 g Rinderhack, Paprika, Tomaten, Zwiebeln, 10 Stück - same dish"), []),
    "at_steckerlfisch": ("steckerlfisch", src(GK_DE + "steckerlfisch-rezept-2351", R4, "DE cross-check (phase 4): 4 Makrelen oder Heringe, Zitrone, 4 Portionen - same dish (Bavarian Steckerlfisch)"), []),
    "at_grillhendl": ("grillhendl", src(GK_DE + "berliner-brathaehnchen-rezept-7807", R4, "DE cross-check (phase 4): 2 kg Hähnchen, Butterschmalz, Speck, 4 Portionen - same roast chicken (halbes Hähnchen)"), ["hendl", "wiesn hendl", "broiler", "goldbroiler"]),
    "at_maroni": ("maroni", src(GK_DE + "maronen-selber-roesten-rezept-4086", R4, "DE cross-check (phase 4): 1 kg Maronen, geröstet, 4 Portionen - same dish"), []),
    "at_bratwurst_semmel": (None, None, ["bratwurst", "rostbratwurst im brötchen mit senf", "bratwurstbrötchen", "grillwurst im brötchen"]),
    "at_laibchensemmel": (None, None, ["frikadelle im brötchen", "bulette mit schrippe", "frikadellenweck", "fleischpflanzerl in der semmel"]),
    "at_schnitzelsemmel": (None, None, ["schnitzelweck", "schnitzel im brötchen", "schnitzelbrötchen mit senf"]),
    "at_spaghetti_napoli": ("spaghetti_napoli", src(GK_DE + "spaghetti-mit-tomatensauce-rezept-27615", R4, "DE cross-check (phase 4): 75 g Spaghetti, 200 g Tomaten (Dose), Olivenöl, Knoblauch, Parmesan, 1 Portion - same dish"), ["nudeln mit tomatensoße", "spaghetti mit tomatensoße"]),
}


def _apply_reuse():
    import at, hu, shared  # noqa: F401 - already loaded by build.py (at, shared) or loaded here (hu)
    dishes = {d["id"]: d for m in (hu, at, shared) for d in m.DISHES}
    parts = {**hu.PARTS, **at.PARTS, **shared.PARTS}
    users = {}
    for d in dishes.values():
        for pid, _ in d["part_refs"] + d.get("side_options", []):
            users.setdefault(pid, set()).add(d["id"])
    for did, (pid, source, extra) in REUSE.items():
        if source and users.get(pid, set()) - set(REUSE):
            raise SystemExit(f"REUSE {did}: part {pid} is also used by {sorted(users[pid] - set(REUSE))}; its sources would change")
        d = dishes[did]
        if "DE" not in d["countries"]:
            d["countries"] = list(d["countries"]) + ["DE"]
        if source:
            parts[pid]["sources"] = list(parts[pid]["sources"]) + [source]
        if extra:
            d["aliases"] = {**d["aliases"], "de": list(d["aliases"].get("de", [])) + extra}


PHASE4_MODULES = ("de_suppen_eintopf", "de_traditionell", "de_kuchen", "de_backwaren", "de_alltag", "de_streetfood")
for _name in PHASE4_MODULES:
    _m = __import__(_name)
    _clash = PARTS.keys() & _m.PARTS.keys()
    if _clash:
        raise SystemExit(f"{_name}: part ids already defined: {sorted(_clash)}")
    PARTS.update(_m.PARTS)
    DISHES += _m.DISHES
    SERVINGS += getattr(_m, "SERVINGS", [])
    FOOD_ALIASES += getattr(_m, "FOOD_ALIASES", [])
    MISSING_FOODS += getattr(_m, "MISSING", [])
    SIDE_WITH.update(getattr(_m, "SIDE_WITH", {}))
    for _c, _names in getattr(_m, "INVENTORY", {}).items():
        INVENTORY[_c] += _names
    INVENTORY_REASONS.update(getattr(_m, "INVENTORY_REASONS", {}))

_apply_reuse()
