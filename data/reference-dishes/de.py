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
INVENTORY = {"traditional": [], "everyday": [], "street_food": []}
INVENTORY_REASONS = {}

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
}


def _apply_reuse():
    import at, hu, shared  # noqa: F401 - already loaded by build.py (at, shared) or loaded here (hu)
    dishes = {d["id"]: d for m in (hu, at, shared) for d in m.DISHES}
    parts = {**hu.PARTS, **at.PARTS, **shared.PARTS}
    for did, (pid, source, extra) in REUSE.items():
        d = dishes[did]
        if "DE" not in d["countries"]:
            d["countries"] = list(d["countries"]) + ["DE"]
        if source:
            parts[pid]["sources"] = list(parts[pid]["sources"]) + [source]
        if extra:
            d["aliases"] = {**d["aliases"], "de": list(d["aliases"].get("de", [])) + extra}


PHASE4_MODULES = ("de_suppen_eintopf", "de_traditionell", "de_kuchen")
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
