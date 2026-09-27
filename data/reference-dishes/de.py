"""Germany (DE): phase 1 format samples. The full German set is phase 4."""
from common import ing, src

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
