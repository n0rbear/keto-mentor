export type RecipeIngredientRole = "core" | "seasoning" | "garnish" | "serving_accompaniment";

export type IngredientRoleEvidence = {
  sourceGroup?: string;
  role: RecipeIngredientRole;
  optional: boolean;
  includedInBaseNutrition: boolean;
  evidence: "source_group" | "ingredient_wording" | "default_core";
};

const SERVING = /\b(a t[aá]lal[aá]shoz|t[aá]lal[aá]shoz|to serve|for serving|zum servieren|zum anrichten|serving suggestions?)\b/i;
const GARNISH = /\b(a d[ií]sz[ií]t[eé]shez|d[ií]sz[ií]t[eé]shez|for garnish|to garnish|zum garnieren|garnitur)\b/i;
const OPTIONAL = /\b(opcion[aá]lis|optional|wahlweise|nach belieben|if desired)\b/i;

export function classifyIngredientRole(sourceGroup?: string, ingredientText = ""): IngredientRoleEvidence {
  const group = sourceGroup?.trim();
  const combined = `${group ?? ""} ${ingredientText}`;
  if (SERVING.test(group ?? "")) return { sourceGroup: group, role: "serving_accompaniment", optional: OPTIONAL.test(combined), includedInBaseNutrition: false, evidence: "source_group" };
  if (GARNISH.test(group ?? "")) return { sourceGroup: group, role: "garnish", optional: OPTIONAL.test(combined), includedInBaseNutrition: !OPTIONAL.test(combined), evidence: "source_group" };
  return { sourceGroup: group, role: "core", optional: OPTIONAL.test(combined), includedInBaseNutrition: true, evidence: group ? "source_group" : "default_core" };
}

function plainText(value: string) {
  return value.replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ").replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

/** Recover visible group headings that schema.org recipeIngredient flattens. */
export function recoverIngredientRolesFromHtml(html: string, ingredients: readonly string[], instructions: readonly string[] = []): IngredientRoleEvidence[] {
  const body = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ");
  const headings = [...body.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]\s*>/gi)]
    .map((m) => ({ index: m.index ?? 0, text: plainText(m[1]) })).filter((h) => h.text);
  let cursor = 0;
  return ingredients.map((ingredient) => {
    const needle = plainText(ingredient).toLocaleLowerCase("hu-HU");
    const foodWords = needle.replace(/^\s*[\d.,]+(?:\s*[-–]\s*[\d.,]+)?\s*\S*\s*/, "").trim();
    const haystack = plainText(body.slice(cursor)).toLocaleLowerCase("hu-HU");
    const relative = haystack.indexOf(foodWords || needle);
    if (relative < 0) return classifyIngredientRole(undefined, ingredient);
    // Map the plain-text match back approximately by searching the last token in raw HTML.
    const token = (foodWords || needle).split(/\s+/).at(-1)!;
    const rawRelative = body.slice(cursor).toLocaleLowerCase("hu-HU").indexOf(token);
    const absolute = rawRelative >= 0 ? cursor + rawRelative : cursor;
    const heading = headings.filter((h) => h.index < absolute).at(-1)?.text;
    cursor = absolute + token.length;
    const classified = classifyIngredientRole(heading, ingredient);
    if (classified.role === "serving_accompaniment") {
      const identityToken = (foodWords || needle).split(/\s+/).at(-1)!;
      const instructionEvidence = instructions.find((step) => {
        const normalized = normalizeForEvidence(step);
        const itemAt = normalized.indexOf(normalizeForEvidence(identityToken));
        if (itemAt < 0) return false;
        const nearest = (words: string[]) => Math.min(...words.flatMap((word) => [...normalized.matchAll(new RegExp(word, "g"))].map((match) => Math.abs((match.index ?? 0) - itemAt))));
        const garnishDistance = nearest(["megszor", "diszit", "garnish", "sprinkle", "top with", "bestreu", "garniere"]);
        const serveDistance = nearest(["kinal", "talal", "serve", "servier", "anricht"]);
        return Number.isFinite(garnishDistance) && garnishDistance < serveDistance;
      });
      if (instructionEvidence) return { ...classified, role: "garnish", includedInBaseNutrition: true, evidence: "ingredient_wording" };
    }
    return classified;
  });
}

function normalizeForEvidence(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
