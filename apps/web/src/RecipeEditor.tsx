import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import { FoodCombobox, type Food, type Totals } from "./main";
import type { RecipeDetailData } from "./RecipeDetail";

export type Ingredient = { id?: string; foodId: string; quantityGrams: number; originalText?: string; preparation?: string; sortOrder?: number; food: Food };
export type ImportIngredientRow = { originalText: string; omitted?: boolean; parsedQuantity?: number; parsedUnit?: string; parsedFoodQuery: string; preparation?: string; resolution: string; selectedFood: Food | null; candidates: Food[]; quantity: { status: string; grams?: number; requiresConfirmation: boolean } | null; canConfirm: boolean };
type ImportIngredient = ImportIngredientRow;
type ImportPreview = { title: string; sourceUrl: string; servings?: number; instructions: string[]; extractionMethod: string; importProof: string; ingredients: ImportIngredient[] };

const blankTotals = (): Totals => ({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });

function recipeErrorText(error: unknown, labels: Record<string, string>) {
  if (!(error instanceof ApiError)) return labels.unknown;
  return labels[error.code] ?? (error.status === 401 ? labels.unauthorized : error.status && error.status >= 500 ? labels.server : labels.unknown);
}

export function ingredientsFromImport(rows: ImportIngredient[]): Ingredient[] {
  return rows.flatMap((item, sortOrder) => !item.omitted && item.canConfirm && item.selectedFood && item.quantity?.status === "resolved" && item.quantity.grams
    ? [{ foodId: item.selectedFood.id, quantityGrams: item.quantity.grams, preparation: item.preparation, sortOrder, originalText: item.originalText, food: item.selectedFood }]
    : []);
}
export function combineRecipeIngredients(rows: ImportIngredient[], manualIngredients: Ingredient[]): Ingredient[] {
  if (rows.length === 0) {
    const used = new Set<number>();
    let next = Math.max(-1, ...manualIngredients.map((ingredient) => ingredient.sortOrder ?? -1)) + 1;
    return manualIngredients.map((ingredient) => {
      const requested = ingredient.sortOrder;
      const sortOrder = requested != null && !used.has(requested) ? requested : next++;
      used.add(sortOrder);
      return { ...ingredient, sortOrder };
    });
  }
  return [
    ...ingredientsFromImport(rows),
    ...manualIngredients.map((ingredient, index) => ({ ...ingredient, sortOrder: rows.length + index }))
  ];
}

export function RecipeEditor({ lang, state, editing, onSaved, onCancel }: {
  lang: Lang; state: ApiState; editing: RecipeDetailData | null; onSaved: (recipeId: string) => void; onCancel: () => void;
}) {
  const t = dict[lang];
  const imp = t.recipes.import;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [instructions, setInstructions] = useState<string[]>(editing?.instructions ?? []);
  const [servings, setServings] = useState(editing?.servings?.toString() ?? "");
  const [finishedWeight, setFinishedWeight] = useState(editing?.finishedWeightGrams?.toString() ?? "");
  const [visibility, setVisibility] = useState<"private" | "public">(editing?.visibility === "public" ? "public" : "private");
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => (editing?.ingredients ?? []).map((ingredient) => ({ ...ingredient, originalText: ingredient.originalText ?? undefined, preparation: ingredient.preparation ?? undefined })));
  const [candidate, setCandidate] = useState<Food | null>(null);
  const [candidateGrams, setCandidateGrams] = useState("100");
  const [resetVersion, setResetVersion] = useState(0);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const allIngredients = useMemo(() => combineRecipeIngredients(importPreview?.ingredients ?? [], ingredients), [importPreview, ingredients]);
  const importBlocked = !!importPreview && importPreview.ingredients.some((item) => !item.omitted && (!item.canConfirm || !item.selectedFood || item.quantity?.status !== "resolved" || !item.quantity.grams));
  const live = useMemo(() => allIngredients.reduce((sum, ingredient) => {
    const factor = ingredient.quantityGrams / 100;
    sum.kcal += ingredient.food.kcalPer100g * factor; sum.fat += ingredient.food.fatPer100g * factor; sum.protein += ingredient.food.proteinPer100g * factor; sum.carbs += ingredient.food.carbsPer100g * factor; sum.fiber += ingredient.food.fiberPer100g * factor; sum.netCarbs = Math.max(0, sum.carbs - sum.fiber);
    return sum;
  }, blankTotals()), [allIngredients]);

  async function previewImport() {
    if (importing || !importUrl.trim()) return;
    setImporting(true); setStatus(""); setImportPreview(null); setReviewIndex(null); setIngredients([]);
    try {
      const result = await api<{ preview: ImportPreview }>("/recipes/import-url/preview", { method: "POST", body: JSON.stringify({ url: importUrl.trim() }) }, state);
      const preview = result.preview;
      setImportPreview(preview); setTitle(preview.title); setServings(preview.servings?.toString() ?? "");
      setInstructions(preview.instructions);
    } catch (error) { setStatus(error instanceof ApiError && error.code in t.recipeErrors ? recipeErrorText(error, t.recipeErrors) : imp.failed); }
    finally { setImporting(false); }
  }
  function addIngredient() {
    const grams = Number(candidateGrams);
    if (!candidate || !Number.isFinite(grams) || grams <= 0) return setStatus(t.recipes.invalidIngredient);
    const originalText = reviewIndex == null ? undefined : importPreview?.ingredients[reviewIndex]?.originalText;
    if (reviewIndex == null) setIngredients((items) => [...items, { foodId: candidate.id, quantityGrams: grams, food: candidate, originalText, sortOrder: Math.max(-1, ...items.map((item) => item.sortOrder ?? -1)) + 1 }]);
    if (reviewIndex != null) setImportPreview((preview) => preview ? { ...preview, ingredients: preview.ingredients.map((item, index) => index === reviewIndex ? { ...item, selectedFood: candidate, candidates: [candidate], resolution: "resolved", quantity: { status: "resolved", grams, requiresConfirmation: false }, canConfirm: true } : item) } : preview);
    setReviewIndex(null); setCandidate(null); setCandidateGrams("100"); setResetVersion((value) => value + 1); setStatus("");
  }
  async function saveRecipe() {
    if (saving) return;
    if (!title.trim() || allIngredients.length === 0) return setStatus(t.recipes.ingredientsRequired);
    if (importBlocked) return setStatus(imp.blocked);
    setSaving(true);
    setStatus("");
    const body = { title, description: description || undefined, instructions, servings: servings ? Number(servings) : undefined, finishedWeightGrams: finishedWeight ? Number(finishedWeight) : undefined, visibility, sourceType: importPreview ? importPreview.extractionMethod === "ai_structured" ? "ai_structured" : "schema_org" : "manual", ...(importPreview ? { sourceUrl: importPreview.sourceUrl, importProof: importPreview.importProof } : {}), ingredients: allIngredients.map(({ foodId, quantityGrams, preparation, originalText, sortOrder }) => ({ foodId, quantityGrams, ...(preparation ? { preparation } : {}), ...(originalText ? { originalText } : {}), sortOrder })) };
    try {
      const result = await api<{ recipe: { id: string } }>(editing ? `/recipes/${editing.id}` : "/recipes", { method: editing ? "PUT" : "POST", body: JSON.stringify(body) }, state);
      onSaved(result.recipe.id);
    } catch (error) {
      setStatus(recipeErrorText(error, t.recipeErrors));
    } finally {
      setSaving(false);
    }
  }

  return <div className="recipe-editor">
    {status && <div className="status error" role="alert">{status}</div>}
    {!editing && <section className="rounded-xl border border-borderSoft p-4" aria-label={imp.heading}><h3>{imp.heading}</h3><div className="recipe-search"><input aria-label={imp.url} className="field" type="url" value={importUrl} onChange={(e) => { setImportUrl(e.target.value); setImportPreview(null); setReviewIndex(null); setIngredients([]); }} placeholder="https://example.com/recipe"/><button type="button" className="btn secondary" disabled={importing || !importUrl.trim()} onClick={() => previewImport()}>{importing ? imp.loading : imp.preview}</button></div></section>}
    {importPreview && <section className="rounded-xl border border-borderSoft p-4" aria-label={imp.preview}><h3>{importPreview.title}</h3>{importPreview.extractionMethod === "ai_structured" && <p className="status success" role="status">{t.recipes.aiExtractedNotice}</p>}{importPreview.servings && <p>{importPreview.servings} {imp.servingsUnit}</p>}<ul className="recipe-detail-list">{importPreview.ingredients.map((item, index) => { const valid = !item.omitted && item.canConfirm && item.selectedFood && item.quantity?.status === "resolved" && item.quantity.grams; return <li key={`${item.originalText}-${index}`}><strong>{item.originalText}</strong> — {item.omitted ? imp.omit : valid ? `${item.selectedFood!.name}, ${Math.round(item.quantity!.grams! * 10) / 10} g · ${imp.resolved}` : item.selectedFood ? imp.review : imp.unresolved}{!item.omitted && !valid && <button type="button" className="btn secondary ml-2" onClick={() => { setReviewIndex(index); setCandidate(item.selectedFood); setCandidateGrams(item.quantity?.grams ? String(item.quantity.grams) : ""); }}>{imp.resolve}</button>}<button type="button" className="btn secondary ml-2" onClick={() => setImportPreview((preview) => preview ? { ...preview, ingredients: preview.ingredients.map((row, rowIndex) => rowIndex === index ? { ...row, omitted: !row.omitted } : row) } : preview)}>{item.omitted ? imp.restore : imp.omit}</button></li>; })}</ul>{instructions.length > 0 && <ol className="recipe-detail-list">{instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>}{importBlocked && <p className="text-sm text-muted" role="alert">{imp.blocked}</p>}</section>}
    <div className="grid gap-3 md:grid-cols-2">
      <label>{t.recipes.titleLabel}<input className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}/></label>
      <label>{t.recipes.descriptionLabel}<input className="field" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000}/></label>
      <label>{t.recipes.instructionsLabel}<textarea className="field" value={instructions.join("\n")} onChange={(e) => setInstructions(e.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 100))}/></label>
      <label>{t.recipes.servingsFieldLabel}<input className="field" type="number" min="0.1" step="0.1" value={servings} onChange={(e) => setServings(e.target.value)}/></label>
      <label>{t.recipes.finishedWeightLabel}<input className="field" type="number" min="0.1" step="0.1" value={finishedWeight} onChange={(e) => setFinishedWeight(e.target.value)}/></label>
    </div>
    <fieldset className="visibility-toggle"><legend>{t.recipes.visibilityLegend}</legend><label><input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")}/> {t.recipes.visibilityPrivateOption}</label><label><input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")}/> {t.recipes.visibilityPublicOption}</label></fieldset>
    <div className="ingredient-adder"><FoodCombobox idPrefix="recipe-food" lang={lang} state={state} selected={candidate} onSelect={setCandidate} resetVersion={resetVersion} labels={{ label: reviewIndex == null ? t.recipes.ingredientLabel : imp.resolve, placeholder: t.foodSearch.placeholder, loading: t.foodSearch.loading, noResults: t.foodSearch.noResults, hint: t.foodSearch.hint, selected: t.foodSearch.selected }}/><label>{t.recipes.gramsFieldLabel}<input className="field" type="number" min="0.1" step="0.1" value={candidateGrams} onChange={(e) => setCandidateGrams(e.target.value)}/></label><button type="button" className="btn secondary" onClick={addIngredient}><Plus size={16}/>{t.recipes.addIngredient}</button></div>
    <div className="ingredient-list">{ingredients.map((ingredient, index) => <div className="ingredient-row" key={`${ingredient.foodId}-${index}`}><strong>{ingredient.food.name}</strong><input aria-label={`${ingredient.food.name} ${t.recipes.gramsFieldLabel}`} className="field" type="number" min="0.1" step="0.1" value={ingredient.quantityGrams} onChange={(e) => setIngredients((items) => items.map((item, i) => i === index ? { ...item, quantityGrams: Number(e.target.value) } : item))}/><span>g</span><button className="icon-button" aria-label={t.recipes.removeIngredient} onClick={() => setIngredients((items) => items.filter((_, i) => i !== index))}><Trash2 size={17}/></button></div>)}</div>
    <NutritionSummary title={t.recipes.totalNutrition} totals={live}/>
    <div className="recipe-nutrition-grid">
      {Number(servings) > 0 && <NutritionSummary title={t.recipes.perServing} totals={scale(live, 1 / Number(servings))}/>}
      {Number(finishedWeight) > 0 && <NutritionSummary title={t.recipes.per100g} totals={scale(live, 100 / Number(finishedWeight))}/>}
    </div>
    <div className="recipe-actions"><button className="btn secondary" onClick={onCancel} disabled={saving}>{t.diary.cancel}</button><button className="btn primary" disabled={importBlocked || saving} aria-busy={saving} onClick={saveRecipe}><Save size={17}/>{t.save}</button></div>
  </div>;
}

function NutritionSummary({ title, totals }: { title: string; totals: Totals }) { return <div className="nutrition-summary"><strong>{title}</strong><span>{Math.round(totals.kcal)} kcal</span><span>{round(totals.protein)} g protein</span><span>{round(totals.fat)} g fat</span><span>{round(totals.carbs)} g carbs</span><span>{round(totals.fiber)} g fiber</span><span>{round(totals.netCarbs)} g net</span></div>; }
const round = (value: number) => Math.round(value * 10) / 10;
const scale = (totals: Totals, factor: number): Totals => Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value * factor])) as Totals;
