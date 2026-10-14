import { describe, expect, it } from "vitest";
import { formatRecipeImportLog } from "./recipe-import.js";

describe("recipe_import_preview log line (owner report 2026-10-14)", () => {
  it("names the page without its query string and lists only the open lines", () => {
    const line = formatRecipeImportLog("https://www.mindmegette.hu/carbonara-spagetti.recept/?utm=x", "schema_org", [
      { originalText: "50 dkg Spagetti", parsedFoodQuery: "spaghetti", resolution: "unresolved", canConfirm: false, selectedFood: null },
      { originalText: "5 db Tojás", parsedFoodQuery: "egg", resolution: "resolved", canConfirm: true, selectedFood: { source: "bls", sourceId: "E111000" } },
      { originalText: "Só", parsedFoodQuery: "salt", resolution: "preview", canConfirm: true, excludeFromNutrition: true, selectedFood: { source: "bls", sourceId: "R111000" } },
      { originalText: "20 dkg parmezán sajt", parsedFoodQuery: "Parmesan cheese", resolution: "preview", canConfirm: false, selectedFood: { source: "usda_fdc", sourceId: "325036" } }
    ]);
    expect(line).toBe('recipe_import_preview where="www.mindmegette.hu/carbonara-spagetti.recept/" method=schema_org lines=4 ok=1 seasoning=1 review=1 unresolved=1 open=["unresolved:50 dkg Spagetti=>spaghetti","review:20 dkg parmezán sajt=>Parmesan cheese@usda_fdc:325036"]');
  });
});
