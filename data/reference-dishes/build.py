#!/usr/bin/env python3
"""Generator for the Keto Mentor regional reference data (HU, AT, DE).

Format decision (phase 1): the hand-written source of truth is split by
country, one plain Python module each, so a reviewer reads one country at a
time and nothing is duplicated:

    foods.py    ingredient identity layer (food_key -> reviewed catalog record)
    hu.py       Hungary        at.py   Austria        de.py   Germany
    shared.py   dishes eaten the same way in several countries
    common.py   helpers, allowed countries/categories/languages, plate model

Every hand-entered number lives in those modules; this file only validates and
derives (batch totals, yield, density, plate grams, per-100 g chain values,
the nutrition cross-check). Run:

    python3 data/reference-dishes/build.py

Outputs (all generated, never edited by hand):
    reference-dishes.json, reference-dishes-ingredients.csv,
    reference-dishes-check.md, <country>-missing-foods.md,
    apps/api/src/reference-dishes/reference-data.ts,
    apps/api/src/meal-input/generic-unit-weights.data.ts
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent
sys.path.insert(0, str(OUT))

from common import CATEGORIES, COUNTRIES, DEEP_FILL, FAT_RETENTION, FLAT_FILL, LANGUAGES, USABLE_DIAMETER_RATIO  # noqa: E402
from foods import FOOD_KEYS, renders_fat  # noqa: E402
import at  # noqa: E402
import de  # noqa: E402
import hu  # noqa: E402
import shared  # noqa: E402

SCHEMA_VERSION = "0.3-regional"
API_SRC = OUT.parent.parent / "apps" / "api" / "src"
# Module order is output order; the country a module stands for decides whose
# missing-foods list its MISSING_FOODS entries land in (shared: per entry).
MODULES = [("HU", hu), ("AT", at), ("DE", de), (None, shared)]
SERVED_IN = ("deep_plate", "flat_plate", "handheld")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def collect(name, kind=list):
    merged = kind()
    for _, module in MODULES:
        value = getattr(module, name, kind())
        if kind is dict:
            clash = set(merged) & set(value)
            if clash:
                raise SystemExit(f"{name}: duplicate ids across modules: {sorted(clash)}")
            merged.update(value)
        else:
            merged.extend(value)
    return merged


PARTS = collect("PARTS", dict)
DISHES = collect("DISHES")
SIDE_WITH = collect("SIDE_WITH", dict)
SERVINGS = collect("SERVINGS")
UNIT_CLASSES = collect("UNIT_CLASSES")
FOOD_ALIASES = collect("FOOD_ALIASES")
CHAIN_PRODUCTS = collect("CHAIN_PRODUCTS")
INVENTORY = {
    "HU": getattr(hu, "INVENTORY", {}),
    "AT": getattr(at, "INVENTORY", {}),
    "DE": getattr(de, "INVENTORY", {}),
}


# ---------------------------------------------------------------------------
# Validation: fail the build instead of emitting unsourced or dangling data.
# ---------------------------------------------------------------------------
def check_sources(owner, sources, minimum=1):
    if len(sources) < minimum:
        raise SystemExit(f"{owner}: needs at least {minimum} source(s), has {len(sources)}")
    for s in sources:
        if not str(s.get("url", "")).startswith("https://") or not DATE.match(str(s.get("retrieved", ""))):
            raise SystemExit(f"{owner}: every source needs an https url and a YYYY-MM-DD retrieved date: {s}")


def check_countries(owner, countries):
    if not countries or any(c not in COUNTRIES for c in countries):
        raise SystemExit(f"{owner}: countries must be a non-empty subset of {COUNTRIES}: {countries}")


def check_languages(owner, mapping):
    bad = [k for k in mapping if k not in LANGUAGES]
    if bad:
        raise SystemExit(f"{owner}: unknown language tags {bad}; allowed {LANGUAGES}")


def validate():
    # Phase-2 minimums (brief): new HU dishes on top of the 10 pilot dishes,
    # side variants not counted. A dish still on INVENTORY is planned, not
    # built; each promoted dish leaves the inventory, so both together must
    # reach the minimum and no identity may appear twice.
    hu_inventory = INVENTORY.get("HU", {})
    pilot = set(getattr(hu, "PILOT_DISH_IDS", ()))
    minimums = {"traditional": 60, "everyday": 60, "street_food": 25}
    promoted = {c: [d for d in DISHES if "HU" in d["countries"] and d["category"] == c and d["id"] not in pilot] for c in minimums}
    for category, minimum in minimums.items():
        if len(promoted[category]) + len(hu_inventory.get(category, [])) < minimum:
            raise SystemExit(f"HU {category}: built + planned dishes are below the phase-2 minimum {minimum}")
    built_names = [n.casefold() for ds in promoted.values() for d in ds for n in [d.get("names", PARTS[d["part_refs"][0][0]]["names"])["hu"]]]
    flat_inventory = [name.casefold() for names in hu_inventory.values() for name in names] + built_names
    if len(flat_inventory) != len(set(flat_inventory)):
        dupes = sorted({n for n in flat_inventory if flat_inventory.count(n) > 1})
        raise SystemExit(f"HU dish identities appear twice (inventory and/or built): {dupes}")
    for pid, p in PARTS.items():
        check_sources(f"part {pid}", p["sources"])
        check_languages(f"part {pid}", p["names"])
        for i in p["ingredients"]:
            if i["food_key"] not in FOOD_KEYS:
                raise SystemExit(f"part {pid}: unknown food_key {i['food_key']}")
    ids = set()
    for d in DISHES:
        if d["id"] in ids:
            raise SystemExit(f"duplicate dish id {d['id']}")
        ids.add(d["id"])
        check_countries(f"dish {d['id']}", d["countries"])
        if d["category"] not in CATEGORIES:
            raise SystemExit(f"dish {d['id']}: category {d['category']} not in {CATEGORIES}")
        if d["served_in"] not in SERVED_IN:
            raise SystemExit(f"dish {d['id']}: served_in {d['served_in']} not in {SERVED_IN}")
        check_languages(f"dish {d['id']}", d["aliases"])
        refs = [pid for pid, _ in d["part_refs"]] + [pid for pid, _ in d.get("side_options", [])]
        for pid in refs:
            if pid not in PARTS:
                raise SystemExit(f"dish {d['id']}: unknown part {pid}")
        # Brief: every dish compares at least two recognised public sources.
        check_sources(f"dish {d['id']}", list({s["url"]: s for pid, _ in d["part_refs"] for s in PARTS[pid]["sources"]}.values()), minimum=2)
    for s in SERVINGS:
        owner = f"serving {s['food_key']}/{s['key']}"
        if s["food_key"] not in FOOD_KEYS or not FOOD_KEYS[s["food_key"]][3].count(":"):
            raise SystemExit(f"{owner}: needs a food_key with a catalog record")
        check_countries(owner, s["countries"])
        check_languages(owner, s["labels"])
        check_sources(owner, s["sources"])
        if not (0 < s["confidence"] <= 1) or not isinstance(s["is_estimated"], bool):
            raise SystemExit(f"{owner}: needs is_estimated (bool) and confidence in (0, 1]")
    for u in UNIT_CLASSES:
        check_countries(f"unit class {u['key']}", u["countries"])
        check_sources(f"unit class {u['key']}", u["sources"])
    for a in FOOD_ALIASES:
        if a["food_key"] not in FOOD_KEYS or not FOOD_KEYS[a["food_key"]][3].count(":"):
            raise SystemExit(f"alias {a['food_key']}: needs a food_key with a catalog record")
        check_languages(f"alias {a['food_key']}", a["aliases"])
    for c in CHAIN_PRODUCTS:
        check_countries(f"chain {c['id']}", c["countries"])
        check_languages(f"chain {c['id']}", c["names"])
        check_languages(f"chain {c['id']}", c["aliases"])
        check_sources(f"chain {c['id']}", c["sources"])


def nutrition_of(key, grams):
    k = FOOD_KEYS[key]
    kcal, fat, prot, carbs, fiber, basis = k[5], k[6], k[7], k[8], k[9], k[4]
    if kcal is None:
        return None
    f = grams / 100
    net = carbs if basis in ("available", "none") else max(0.0, carbs - fiber)
    return {"kcal": kcal * f, "fat": fat * f, "protein": prot * f, "net_carbs": net * f}


def build_part(pid, p):
    raw_total = sum(i["raw_g"] for i in p["ingredients"])
    finished = raw_total + p["cooking"]["mass_change_g"]
    # Volume of the finished part: water that left/entered is taken from/added
    # to the liquid; every other component keeps its raw mass.
    vol = 0.0
    change = p["cooking"]["mass_change_g"]
    for i in p["ingredients"]:
        k = FOOD_KEYS[i["food_key"]]
        d = k[10]
        vol += i["raw_g"] / d
    vol += change / 1.0  # the evaporated/absorbed mass is water
    # Loose dry parts: the cooked product's own bulk density (air gaps
    # between dumplings/rice grains/cutlets) - raw ingredients say nothing
    # about it. Liquid and solid parts: derived from the components.
    density = p["bulk_density_g_ml"] if p["matrix"] == "dry" else finished / vol
    totals = {"kcal": 0.0, "fat": 0.0, "protein": 0.0, "net_carbs": 0.0}
    missing = []
    for i in p["ingredients"]:
        n = nutrition_of(i["food_key"], i["raw_g"])
        if n is None:
            missing.append(i["food_key"])
            continue
        for x in totals:
            totals[x] += n[x]
    # Drippings that are not eaten: the rendered share of the meat's fat
    # leaves the dish. mass_change_g stays the net weight change (it already
    # includes this fat together with water lost or taken up).
    fat_loss = 0.0
    drippings = p["cooking"].get("drippings")
    if drippings:
        if drippings not in FAT_RETENTION:
            raise SystemExit(f"part {pid}: cooking.drippings must be one of {sorted(FAT_RETENTION)}")
        meat_fat = sum(FOOD_KEYS[i["food_key"]][6] * i["raw_g"] / 100 for i in p["ingredients"] if renders_fat(i["food_key"]))
        fat_loss = round(meat_fat * (1 - FAT_RETENTION[drippings]), 1)
        if fat_loss <= 0:
            raise SystemExit(f"part {pid}: drippings declared but no meat fat renders out")
        totals["fat"] -= fat_loss
        totals["kcal"] -= 9 * fat_loss
    # A partial sum would under-count (e.g. 500 g beans counted as 0 kcal), so
    # the cross-check is only computed when every ingredient has macros.
    per100 = None if missing else {x: round(v / finished * 100, 1) for x, v in totals.items()}
    out = {
        "id": pid, "names": p["names"], "matrix": p["matrix"],
        "batch": {
            "servings_source": p["servings_source"],
            "ingredients": p["ingredients"],
            **({"not_eaten": p["not_eaten"]} if p.get("not_eaten") else {}),
            "raw_total_g": raw_total,
            "cooking": p["cooking"],
            "finished_weight_g": finished,
            "yield_factor": round(finished / raw_total, 3),
            **({"fat_loss_g": fat_loss} if drippings else {}),
        },
        "standard_serving_g": p["standard_serving_g"],
        "density_g_per_ml": round(density, 3),
        "density_method": "cooked bulk density (loose pieces)" if p["matrix"] == "dry" else "derived from components after cooking mass change",
        **({"flat_plate": p["flat_plate"]} if p.get("flat_plate") else {}),
        "sources": p["sources"],
        "derived_check": {
            "note": "Cross-check only, computed from the linked catalog records; the app must compute nutrition from the catalog, not from this block.",
            "per_100g": per100,
            "incomplete_missing_food_keys": missing,
        },
    }
    return out


def flat_grams(part, diameter_cm, fill=1.0):
    fp = part["flat_plate"]
    area = math.pi * (USABLE_DIAMETER_RATIO * diameter_cm / 2) ** 2
    return area * fp["coverage"] * fp["height_cm"] * fill * part["density_g_per_ml"]



def norm(value: str) -> str:
    import re
    import unicodedata
    v = unicodedata.normalize("NFD", value)
    v = "".join(c for c in v if not unicodedata.combining(c)).replace("ß", "ss").lower()
    v = re.sub(r"[^a-z0-9]+", " ", v).strip()
    return re.sub(r"\s+", " ", v)



def dish_per_100g(parts, dish):
    if any(parts[x["part"]]["derived_check"]["per_100g"] is None for x in dish["parts"]):
        return None
    total = sum(x["standard_serving_g"] for x in dish["parts"])
    out = {}
    for m in ("kcal", "fat", "protein", "net_carbs"):
        out[m] = sum(parts[x["part"]]["derived_check"]["per_100g"][m] * x["standard_serving_g"] for x in dish["parts"]) / total
    return out


def titles_of(names):
    return {loc: names[loc] for loc in LANGUAGES if loc in names}


def side_title(titles, side):
    words = SIDE_WITH[side]
    return {loc: f"{t} {words.get(loc, words['de'] if loc == 'de-AT' else words['en'])}" for loc, t in titles.items()}


# ---------------------------------------------------------------------------
# App data. Every variant is exactly ONE standard serving: each part's raw
# ingredients are scaled by (serving grams / part finished weight). Water
# carries mass only (finished weight), so it is not a recipe ingredient.
# ---------------------------------------------------------------------------
ROLE_MAP = {"core": "core", "seasoning": "seasoning", "garnish": "garnish"}


def build_variants(parts, dishes):
    variants, aliases = [], {}

    def add_alias(phrase, ids):
        key = norm(phrase)
        if not key:
            return
        existing = aliases.setdefault(key, [])
        for i in ids:
            if i not in existing:
                existing.append(i)

    for d in dishes:
        base_parts = [(x["part"], x["standard_serving_g"]) for x in d["parts"]]
        options = [(None, base_parts)] + [(so["part"], base_parts + [(so["part"], so["standard_serving_g"])]) for so in d.get("side_options", [])]
        ids = []
        for side, plist in options:
            vid = d["id"] if side is None else f"{d['id']}__{side}"
            titles = side_title(d["names"], side) if side else dict(d["names"])
            grams = {}
            roles = {}
            for pid, serving in plist:
                part = parts[pid]
                factor = serving / part["batch"]["finished_weight_g"]
                for i in part["batch"]["ingredients"]:
                    if i["food_key"] == "water":
                        continue
                    grams[i["food_key"]] = grams.get(i["food_key"], 0) + i["raw_g"] * factor
                    roles.setdefault(i["food_key"], ROLE_MAP.get(i["role"], "core"))
            fat_loss = sum(parts[pid]["batch"].get("fat_loss_g", 0) * serving / parts[pid]["batch"]["finished_weight_g"] for pid, serving in plist)
            serving_total = sum(g for _, g in plist)
            density = serving_total / sum(g / parts[pid]["density_g_per_ml"] for pid, g in plist)
            sources = {s["url"]: s for pid, _ in plist for s in parts[pid]["sources"]}
            variants.append({
                "id": vid, "dishId": d["id"], "titles": titles,
                "countries": d["countries"],
                "category": d["category"],
                "languages": sorted(set(titles) | set(d["aliases"]), key=LANGUAGES.index),
                "tags": d["tags"],
                "servingGrams": serving_total, "densityGPerMl": round(density, 3), "servedIn": d["served_in"],
                "parts": [{"part": pid, "grams": g, **({"flatPlate": parts[pid]["flat_plate"], "densityGPerMl": parts[pid]["density_g_per_ml"]} if parts[pid].get("flat_plate") else {"densityGPerMl": parts[pid]["density_g_per_ml"]})} for pid, g in plist],
                "ingredients": [{"foodKey": k, "grams": round(v, 2), "role": roles[k]} for k, v in grams.items()],
                **({"cookingFatLossGrams": round(fat_loss, 2)} if fat_loss else {}),
                "sources": [{"url": u, "retrieved": sources[u]["retrieved"]} for u in sorted(sources)],
            })
            ids.append(vid)
            for t in titles.values():
                add_alias(t, [vid])
        # Bare dish words: one variant, or a choice when a side is open.
        bare_targets = ids if d.get("side_required_question") else [ids[0]]
        for loc_aliases in d["aliases"].values():
            for a in loc_aliases:
                add_alias(a, bare_targets)
        for phrase, side in d.get("alias_side", {}).items():
            add_alias(phrase, [f"{d['id']}__{side}"])
    return variants, aliases


def catalog_ref(key):
    ref = FOOD_KEYS[key][3]
    return {"source": ref.split(":")[0], "sourceId": ref.split(":")[1]} if ref and ":" in ref else None


def build_servings():
    return [{
        "foodKey": s["food_key"], "key": s["key"], "unit": s["unit"], "labels": s["labels"], "grams": s["grams"],
        "isEstimated": s["is_estimated"], "confidence": s["confidence"], "countries": s["countries"],
        "sources": [{"url": x["url"], "retrieved": x["retrieved"]} for x in s["sources"]],
    } for s in SERVINGS]


def build_food_aliases():
    rows, seen = [], set()
    for a in FOOD_ALIASES:
        for loc, words in a["aliases"].items():
            for w in words:
                key = (a["food_key"], norm(w), loc)
                if key in seen:
                    continue
                seen.add(key)
                rows.append({"foodKey": a["food_key"], "alias": w, "normalizedAlias": norm(w), "locale": loc})
    return rows


def build_chain_products():
    """EU labels declare AVAILABLE carbohydrate; the catalog stores TOTAL, so
    fiber is added back (nutrition-evidence.ts convention)."""
    out = []
    for c in CHAIN_PRODUCTS:
        per100, portion = c["per_100g"], c["per_portion"]
        fiber = per100.get("fiber")
        # Portion weight is not printed; energy per portion / per 100 g gives it.
        grams = round(portion["kcal"] / per100["kcal"] * 100, 1)
        synonyms = {loc: sorted(set(w)) for loc, w in c["aliases"].items()}
        out.append({
            "sourceId": c["id"], "chain": c["chain"], "countries": c["countries"], "category": c["category"],
            "name": c["names"]["en"], "names": c["names"], "synonyms": synonyms,
            "kcalPer100g": per100["kcal"], "fatPer100g": per100["fat"], "proteinPer100g": per100["protein"],
            "carbsPer100g": round(per100["carbs_available"] + (fiber or 0), 3), "fiberPer100g": fiber or 0,
            "serving": {**{k: v for k, v in c["serving"].items() if k not in ("is_estimated",)}, "isEstimated": c["serving"]["is_estimated"], "grams": grams},
            "provenance": {
                "source": f"{c['chain']} official nutrition table ({'/'.join(c['countries'])})",
                "sourceUrl": c["sources"][0]["url"], "retrievedAt": c["sources"][0]["retrieved"], "valuesPer": "100 g",
                "carbohydrateBasis": "total_from_available_plus_fiber",
                **({} if fiber is not None else {"fiberBasis": "not_declared_assumed_zero"}),
                "countries": c["countries"],
            },
        })
    return out


def ts_module(header, type_import, exports):
    lines = ["// GENERATED by data/reference-dishes/build.py - do not edit by hand.", type_import, ""]
    for name, type_name, value in exports:
        body = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)
        lines.append(f"export const {name}{': ' + type_name if type_name else ''} = {body};")
        lines.append("")
    return "\n".join(lines)


def emit_reference_ts(payload, path):
    body = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
    version = hashlib.sha256(body.encode()).hexdigest()[:16]
    path.write_text(ts_module(None, "import type { ReferenceDishData } from \"./types.js\";", [
        ("REFERENCE_DATA_VERSION", None, json.dumps(version)),
        ("REFERENCE_DATA", "ReferenceDishData", body),
    ]), encoding="utf-8")
    return version


def emit_unit_classes_ts(path):
    tables = {}
    for u in UNIT_CLASSES:
        tables.setdefault(u["unit"], []).append({
            "key": u["key"], "grams": u["grams"], "keywords": u["keywords"], "countries": u["countries"],
            **({"wholeWord": True} if u.get("whole_word") else {}),
        })
    path.write_text(ts_module(None, "import type { GeneratedUnitWeight } from \"./generic-unit-weights.js\";", [
        ("GENERATED_UNIT_WEIGHTS", "Record<string, readonly GeneratedUnitWeight[]>", tables),
    ]), encoding="utf-8")


def emit_missing_foods(dishes_json):
    per_country = {c: [] for c in COUNTRIES}
    for country, module in MODULES:
        for m in getattr(module, "MISSING_FOODS", []):
            for c in ([country] if country else m["countries"]):
                per_country[c].append(m)
    # Any dish ingredient without a catalog record is missing too.
    for d in DISHES:
        keys = {i["food_key"] for pid, _ in d["part_refs"] for i in PARTS[pid]["ingredients"]}
        for k in sorted(keys):
            if k != "water" and catalog_ref(k) is None:
                for c in d["countries"]:
                    per_country[c].append({"food_key": k, "names": {"hu": FOOD_KEYS[k][0], "de": FOOD_KEYS[k][1], "en": FOOD_KEYS[k][2]}, "needed_for": [d["id"]], "note": "no catalog record linked in foods.py"})
    # Inventory identities are intentionally not promoted to recipes until a
    # reviewed PARTS definition and authoritative ingredient mapping exists.
    # Keep them visible in the generated gap report instead of inventing food
    # weights or nutrition values.
    # A name that already is a dish (title or alias) is no longer a gap.
    covered = {norm(v) for d in DISHES if "HU" in d["countries"]
               for v in [*(d.get("names") or PARTS[d["part_refs"][0][0]]["names"]).values(), *d["aliases"].get("hu", [])]}
    for category, names in INVENTORY.get("HU", {}).items():
        for name in names:
            if norm(name) in covered:
                continue
            per_country["HU"].append({"food_key": "inventory-only", "names": {"hu": name}, "needed_for": [category], "note": "inventory identity; recipe/ingredient mapping still required"})
    for c, rows in per_country.items():
        lines = [f"# Hiányzó katalógusrekordok – {c} (generált)", "",
                 "Ezekhez az ételrészekhez nincs ellenőrzött katalógusrekord. Nem helyettesíthetők hasonlóval;",
                 "a hivatalos forrásból (BLS xlsx, `BlsAdapter`) külön migrációban kell importálni őket.", ""]
        if not rows:
            lines.append("Jelenleg nincs hiányzó rekord.")
        else:
            lines += ["| food_key | Név | Kell ehhez | Megjegyzés |", "|---|---|---|---|"]
            for r in rows:
                name = " / ".join(r["names"].values())
                lines.append(f"| `{r['food_key']}` | {name} | {', '.join(r['needed_for'])} | {r['note']} |")
        (OUT / f"{c.lower()}-missing-foods.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    validate()
    parts = {pid: build_part(pid, p) for pid, p in PARTS.items()}
    dishes = []
    for d in DISHES:
        dish_parts = [{"part": pid, "standard_serving_g": g} for pid, g in d["part_refs"]]
        dish = {
            "id": d["id"],
            "countries": d["countries"],
            "category": d["category"],
            "names": titles_of(d.get("names") or parts[d["part_refs"][0][0]]["names"]),
            "aliases": d["aliases"],
            "tags": d["tags"],
            "served_in": d["served_in"],
            "parts": dish_parts,
        }
        if d.get("side_options"):
            dish["side_options"] = [{"part": pid, "standard_serving_g": g} for pid, g in d["side_options"]]
            dish["side_required_question"] = True
            if d.get("alias_side"):
                dish["alias_side"] = d["alias_side"]
        if d.get("optional_toppings"):
            dish["optional_toppings"] = d["optional_toppings"]
        if d.get("review"):
            dish["review_note_hu"] = d["review"]
        dishes.append(dish)

    servings = build_servings()
    food_aliases = build_food_aliases()
    chain_products = build_chain_products()
    doc = {
        "schema_version": SCHEMA_VERSION,
        "purpose": "Keto Mentor regional reference data (HU, AT, DE): dishes, unit weights, aliases, chain products",
        "generated_by": "data/reference-dishes/build.py",
        "rules": [
            "Ingredient grams are RAW, edible part, for the whole source batch (bones, shells and stock-only items excluded).",
            "finished_weight_g = raw_total_g + cooking.mass_change_g (evaporation/frying loss negative, absorption positive).",
            "Nutrition per 100 g = sum of ingredient nutrition from the linked catalog records / finished_weight_g. Nothing here is a nutrition source of truth.",
            "Net carbs: 'total' sources (USDA, BLS as stored in the catalog) = carbs - fiber; 'available' = carbs as stored.",
            "density_g_per_ml is derived from the parts' components (intrinsic density in liquid/solid dishes, bulk density with air gaps for loose dry parts).",
            "Chain products: official per-country table; available carbohydrate + fiber is stored as total (carbohydrateBasis total_from_available_plus_fiber).",
            "Every source carries its URL and retrieved date; countries are HU/AT/DE, language tags hu/de/de-AT/en.",
        ],
        "plate_model": {
            "deep_plate": "grams = capacity_ml x fill x density_g_per_ml",
            "deep_fill": DEEP_FILL,
            "flat_plate": "grams = pi x (0.8 x diameter_cm / 2)^2 x coverage x height_cm x fill x density_g_per_ml",
            "flat_fill": FLAT_FILL,
            "usable_diameter_ratio": USABLE_DIAMETER_RATIO,
        },
        "food_keys": {
            key: {
                "names": {"hu": v[0], "de": v[1], "en": v[2]},
                "catalog": v[3], "carb_basis": v[4],
                "density_intrinsic_g_ml": v[10], "density_bulk_g_ml": v[11],
                **({"note": v[12]} if v[12] else {}),
            } for key, v in FOOD_KEYS.items()
        },
        "parts": parts,
        "dishes": dishes,
        "servings": SERVINGS,
        "unit_classes": UNIT_CLASSES,
        "food_aliases": FOOD_ALIASES,
        "chain_products": CHAIN_PRODUCTS,
        "inventory": INVENTORY,
    }
    (OUT / "reference-dishes.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    variants, aliases = build_variants(parts, dishes)
    food_keys = {k: {"catalog": catalog_ref(k), "hu": v[0]} for k, v in FOOD_KEYS.items() if k != "water"}
    emit_reference_ts({"foodKeys": food_keys, "variants": variants, "aliases": aliases, "servings": servings,
                       "foodAliases": food_aliases, "chainProducts": chain_products, "inventory": INVENTORY},
                      API_SRC / "reference-dishes" / "reference-data.ts")
    emit_unit_classes_ts(API_SRC / "meal-input" / "generic-unit-weights.data.ts")
    emit_missing_foods(dishes)

    with (OUT / "reference-dishes-ingredients.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["part_id", "part_name_hu", "servings_source", "food_key", "food_hu", "raw_g", "role", "catalog", "finished_weight_g", "yield_factor", "density_g_per_ml", "standard_serving_g"])
        for pid, p in parts.items():
            for i in p["batch"]["ingredients"]:
                w.writerow([pid, p["names"]["hu"], p["batch"]["servings_source"], i["food_key"], FOOD_KEYS[i["food_key"]][0], i["raw_g"], i["role"],
                            FOOD_KEYS[i["food_key"]][3] or "MISSING", p["batch"]["finished_weight_g"], p["batch"]["yield_factor"], p["density_g_per_ml"], p["standard_serving_g"]])

    lines = ["# Referenciaételek – ellenőrző táblázat (generált)", "",
             "## Részek: nyers tömeg → kész tömeg, sűrűség, tápérték 100 g-ra (keresztellenőrzés)", "",
             "| Rész | Nyers össz. (g) | Víz/tömegváltozás (g) | Kész (g) | Hozam | Sűrűség (g/ml) | kcal | zsír | fehérje | nettó CH | Hiányzó rekord |",
             "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|"]
    for pid, p in parts.items():
        b = p["batch"]; c = p["derived_check"]["per_100g"]
        macros = f"{c['kcal']} | {c['fat']} | {c['protein']} | {c['net_carbs']}" if c else "nincs számolva | – | – | –"
        lines.append(f"| {p['names']['hu']} | {b['raw_total_g']} | {b['cooking']['mass_change_g']:+} | {b['finished_weight_g']} | {b['yield_factor']} | {p['density_g_per_ml']} | {macros} | {', '.join(p['derived_check']['incomplete_missing_food_keys']) or '–'} |")
    lines += ["", "## Makró-keresztellenőrzés nyilvános referenciával (100 g)", "",
              "Számolt érték a katalógusrekordokból vs. egy nyilvános referencia (pl. BLS összetett étel). 15% feletti kcal-eltérés: ELLENŐRIZENDŐ,",
              "kivéve ha az ételnél `reference_check.deviation` (átnézett receptkülönbség) indokolja: akkor RECEPTKÜLÖNBSÉG, az indoklással.", "",
              "| Étel | Referencia | kcal (számolt / ref.) | zsír | fehérje | nettó CH | kcal eltérés | Indoklás |", "|---|---|---:|---:|---:|---:|---|---|"]
    for d, raw in zip(dishes, DISHES):
        ref = raw.get("reference_check")
        if not ref:
            lines.append(f"| {d['names']['hu']} | nincs még | – | – | – | – | – | – |")
            continue
        calc = dish_per_100g(parts, d)
        if calc is None:
            lines.append(f"| {d['names']['hu']} | {ref['catalog']} {ref['name']} | nincs számolva (hiányzó makró) | – | – | – | – | – |")
            continue
        dev = (calc["kcal"] - ref["kcal"]) / ref["kcal"] * 100
        flag = "rendben" if abs(dev) <= 15 else "RECEPTKÜLÖNBSÉG" if ref.get("deviation") else "ELLENŐRIZENDŐ"
        lines.append(f"| {d['names']['hu']} | {ref['catalog']} {ref['name']} | {calc['kcal']:.0f} / {ref['kcal']} | {calc['fat']:.1f} / {ref['fat']} | {calc['protein']:.1f} / {ref['protein']} | {calc['net_carbs']:.1f} / {ref['net_carbs']} | {dev:+.0f}% {flag} | {ref.get('deviation', '–') if abs(dev) > 15 else '–'} |")
    lines += ["", "## Tányér → gramm (normál adag)", "",
              "Mély tányér: kapacitás × töltöttség × sűrűség. Lapos tányér: 0,8 × átmérő hasznos kör × lefedettség × magasság × sűrűség.", "",
              "| Étel | Országok | Kategória | Szokásos adag (g) | Mély 450 ml normál | Mély 650 ml normál | Lapos 24 cm | Lapos 26 cm | Lapos 28 cm |",
              "|---|---|---|---:|---:|---:|---:|---:|---:|"]
    for d in dishes:
        std = sum(x["standard_serving_g"] for x in d["parts"])
        ps = [parts[x["part"]] for x in d["parts"]]
        dens = sum(x["standard_serving_g"] for x in d["parts"]) / sum(x["standard_serving_g"] / parts[x["part"]]["density_g_per_ml"] for x in d["parts"])
        loose = all(p["matrix"] == "dry" for p in ps)
        if d["served_in"] == "handheld":
            lines.append(f"| {d['names']['hu']} | {', '.join(d['countries'])} | {d['category']} | {std} | – (kézből) | – | – | – | – |")
            continue
        deep = lambda cap: "– (lapos tányéros étel)" if loose else f"{cap * DEEP_FILL['normal'] * dens:.0f}"
        if all("flat_plate" in p for p in ps):
            flat = lambda dia: f"{sum(flat_grams(p, dia) for p in ps):.0f}"
            f24, f26, f28 = flat(24), flat(26), flat(28)
        else:
            f24 = f26 = f28 = "– (mély tányéros étel)"
        lines.append(f"| {d['names']['hu']} | {', '.join(d['countries'])} | {d['category']} | {std} | {deep(450)} | {deep(650)} | {f24} | {f26} | {f28} |")
    lines += ["", "Köretek lapos tányéron (26 cm, normál): " + ", ".join(f"{parts[pid]['names']['hu']} ≈ {flat_grams(parts[pid], 26):.0f} g" for pid in ("nokedli", "petrezselymes_burgonya", "parolt_rizs")), ""]
    lines += ["## Egységsúlyok (FoodServing)", "", "| Katalógus | Kulcs | Egység | g | Becsült | Bizalom | Országok | Források |", "|---|---|---|---:|---|---:|---|---:|"]
    for s in servings:
        lines.append(f"| {FOOD_KEYS[s['foodKey']][3]} ({s['foodKey']}) | {s['key']} | {s['unit']} | {s['grams']} | {'igen' if s['isEstimated'] else 'nem'} | {s['confidence']} | {', '.join(s['countries'])} | {len(s['sources'])} |")
    lines += ["", "## Lánctermékek (chain_official)", "",
              "Az adagsúly a táblázatban nincs megadva: adag-kcal / 100 g-kcal × 100. Ellenőrzésként ugyanez kJ-ból és a makrókból:", "",
              "| Termék | Adag (g, kcal-ból) | kJ-ból | zsírból | fehérjéből | CH-ból | Összes CH/100 g |", "|---|---:|---:|---:|---:|---:|---:|"]
    for c, raw in zip(chain_products, CHAIN_PRODUCTS):
        p100, por = raw["per_100g"], raw["per_portion"]
        ratio = lambda a, b: f"{a / b * 100:.0f}"
        lines.append(f"| {c['name']} ({'/'.join(c['countries'])}) | {c['serving']['grams']} | {ratio(por['kj'], raw['per_100g_kj'])} | {ratio(por['fat'], p100['fat'])} | {ratio(por['protein'], p100['protein'])} | {ratio(por['carbs_available'], p100['carbs_available'])} | {c['carbsPer100g']} |")
    lines.append("")
    (OUT / "reference-dishes-check.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
