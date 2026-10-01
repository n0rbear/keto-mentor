"""Dishes eaten the same way in more than one country (phase 1 samples)."""
from common import ing, src

R = "2026-09-27"

PARTS = {
    "eierspeis": dict(
        names={"hu": "Rántotta", "de": "Rührei", "de-AT": "Eierspeis", "en": "Scrambled eggs"},
        matrix="dry", bulk_density_g_ml=0.55, servings_source=1, standard_serving_g=150,
        ingredients=[ing("egg", 150, note="3 medium eggs without shell"), ing("butter", 8, "fat", "1 tsp - 1 tbsp per portion")],
        cooking=dict(method="stirred in butter over medium heat 3-5 min", mass_change_g=-8, note="little steam loss; soft, not dried out"),
        flat_plate=dict(coverage=0.40, height_cm=2.0),
        sources=[src("https://www.mindmegette.hu/recept/rantotta", R, "3 tojás, 1 tk vaj, 0,5 tk olaj, 1 adag"),
                 src("https://www.ichkoche.at/eierspeis-rezept-7727", R, "4 Eier, 2 EL Butter, 2 Portionen")]),
}

DISHES = [
    dict(id="xx_eierspeis", countries=["HU", "AT", "DE"], category="everyday", part_refs=[("eierspeis", 150)], served_in="flat_plate",
         tags=["breakfast", "eggs", "low-carb-friendly"],
         reference_check=dict(catalog="bls:Y720163", name="Rührei gebraten in Butter", kcal=172, fat=12.99, protein=13.31, net_carbs=0.42),
         aliases={"hu": ["rántotta", "tojásrántotta"], "de-AT": ["eierspeis", "eierspeise", "eierspeis aus 3 eiern"], "de": ["rührei", "rühreier"], "en": ["scrambled eggs", "scrambled egg"]}),
]

# Street food sample: an assembled item, so no cooking step and no plate.
PARTS["leberkaessemmel"] = dict(
    names={"hu": "Leberkäsés zsemle", "de": "Leberkäsbrötchen", "de-AT": "Leberkässemmel", "en": "Leberkäse roll"},
    matrix="solid", servings_source=1, standard_serving_g=162.5,
    ingredients=[ing("wheat_roll", 62.5, note="one Semmel (see at.py SERVINGS)"), ing("leberkaese", 100, note="one thick hot slice as sold at the counter")],
    cooking=dict(method="assembled, no cooking", mass_change_g=0, note="the Leberkäse is sold baked"),
    sources=[src("https://www.spar.at/produktwelt/spar-bio-kaisersemmel-60g-g-p2020001325436", R, "Semmel 60 g"),
             src("https://shop.billa.at/produkte/ja-natuerlich-kaisersemmel-00480904", R, "Semmel 65 g"),
             src("https://fddb.info/db/de/lebensmittel/durchschnittswert_leberkaessemmel_mit_100_gr_leberkaese/index.html", R, "Durchschnittswert Leberkässemmel mit 100 g Leberkäse, Portion 165 g")])

DISHES.append(
    dict(id="xx_leberkaessemmel", countries=["AT", "DE"], category="street_food", part_refs=[("leberkaessemmel", 162.5)], served_in="handheld",
         tags=["street_food", "higher-carb"], optional_toppings=[{"food_key": "mustard", "g": 10, "hu": "mustár"}],
         aliases={"de-AT": ["leberkässemmel", "leberkassemmel", "leberkässemmerl", "leberkäsesemmel"], "de": ["leberkäsbrötchen", "leberkäsebrötchen", "leberkässemmel", "fleischkäsbrötchen", "leberkäsweck"],
                  "hu": ["leberkäsés zsemle", "leberkäse zsemlében"], "en": ["leberkase roll", "leberkaese sandwich"]},
         review="A Leberkäse-szelet 100 g-ja becslés (fddb átlag), a pultnál kért szelet változó; a felhasználó felülírhatja."))
