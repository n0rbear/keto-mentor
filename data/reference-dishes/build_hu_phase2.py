#!/usr/bin/env python3
"""Build the reviewable HU phase-2 inventory and unresolved gap report."""
import json
from pathlib import Path
from hu_phase2 import inventory

OUT = Path(__file__).resolve().parent
data = inventory()
rows = [{"country": country, "category": category, "name": name, "status": "inventory_only"}
        for country, categories in data.items()
        for category, names in categories.items()
        for name in names]
(OUT / "hu-phase2-inventory.json").write_text(json.dumps({"schema_version": "0.1", "rows": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(OUT / "hu-phase2-missing-foods.md").write_text(
    "# HU phase-2 gap report\n\n"
    "A rekordok addig `inventory_only` státuszúak, amíg minden recept-összetevőjük "
    "ellenőrzött BLS/USDA Food rekordhoz nincs kötve. Tápérték ebben a fázisban "
    "nem került kitalálásra.\n\n" +
    "\n".join(f"- [{row['category']}] {row['name']}" for row in rows), encoding="utf-8")
print(f"generated {len(rows)} HU inventory rows")
