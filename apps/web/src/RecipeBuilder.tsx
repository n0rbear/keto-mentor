import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, Plus, Save, Trash2, Users } from "lucide-react";
import { api, type ApiState } from "./api";
import { FoodCombobox, type Food, type Totals } from "./main";
import type { Lang } from "./i18n";

type Ingredient = { id?: string; foodId: string; quantityGrams: number; originalText?: string; preparation?: string; sortOrder?: number; food: Food };
type NutritionSlice = { macros: Totals; nutrients: Record<string, { key: string; label: string; unit: string; group: string; amount: number }> };
type Recipe = { id: string; userId: string; title: string; description?: string; servings?: number; finishedWeightGrams?: number; visibility: "private" | "public"; user: { id: string; username: string }; ingredients: Ingredient[]; nutrition: { total: NutritionSlice; perServing: NutritionSlice | null; per100g: NutritionSlice | null } };
type ImportIngredient = { originalText: string; parsedQuantity?: number; parsedUnit?: string; parsedFoodQuery: string; preparation?: string; resolution: string; selectedFood: Food | null; candidates: Food[]; quantity: { status: string; grams?: number; requiresConfirmation: boolean } | null; canConfirm: boolean };
type ImportPreview = { title: string; sourceUrl: string; servings?: number; instructions: string[]; extractionMethod: string; ingredients: ImportIngredient[] };
const blankTotals = (): Totals => ({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });

const importText = {
  hu: { heading: "Recept importálása URL-ből", url: "Nyilvános recept URL", preview: "Előnézet", loading: "Betöltés…", resolved: "Feloldva", review: "Ellenőrzést igényel", unresolved: "Nincs feloldva", resolve: "Alapanyag ellenőrzése", blocked: "A mentéshez minden alapanyagnak biztos Food-találat és grammérték kell.", failed: "A recept előnézete nem készíthető el." },
  de: { heading: "Rezept aus URL importieren", url: "Öffentliche Rezept-URL", preview: "Vorschau", loading: "Laden…", resolved: "Aufgelöst", review: "Prüfung erforderlich", unresolved: "Nicht aufgelöst", resolve: "Zutat prüfen", blocked: "Zum Speichern braucht jede Zutat eine sichere Food-Zuordnung und Grammmenge.", failed: "Die Rezeptvorschau konnte nicht erstellt werden." },
  en: { heading: "Import recipe from URL", url: "Public recipe URL", preview: "Preview", loading: "Loading…", resolved: "Resolved", review: "Needs review", unresolved: "Unresolved", resolve: "Review ingredient", blocked: "Every ingredient needs a safe Food match and gram quantity before saving.", failed: "The recipe preview could not be created." }
} as const;

export function RecipeBuilder({ lang, state, currentUserId, onMealAdded }: { lang: Lang; state: ApiState; currentUserId: string; onMealAdded: () => Promise<void> }) {
  const [tab, setTab] = useState<"mine" | "public" | "edit">("mine");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("");
  const [finishedWeight, setFinishedWeight] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [candidate, setCandidate] = useState<Food | null>(null);
  const [candidateGrams, setCandidateGrams] = useState("100");
  const [resetVersion, setResetVersion] = useState(0);
  const [status, setStatus] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  async function loadRecipes(nextTab = tab) {
    if (nextTab === "edit") return;
    const path = nextTab === "public" ? `/recipes/public?q=${encodeURIComponent(query)}&limit=20` : `/recipes?q=${encodeURIComponent(query)}&limit=20`;
    const result = await api<{ recipes: Recipe[] }>(path, {}, state);
    setRecipes(result.recipes);
  }
  useEffect(() => { loadRecipes().catch(() => setStatus("A receptek betöltése nem sikerült.")); }, [tab]);

  const live = useMemo(() => ingredients.reduce((sum, ingredient) => {
    const factor = ingredient.quantityGrams / 100;
    sum.kcal += ingredient.food.kcalPer100g * factor; sum.fat += ingredient.food.fatPer100g * factor; sum.protein += ingredient.food.proteinPer100g * factor; sum.carbs += ingredient.food.carbsPer100g * factor; sum.fiber += ingredient.food.fiberPer100g * factor; sum.netCarbs = Math.max(0, sum.carbs - sum.fiber);
    return sum;
  }, blankTotals()), [ingredients]);

  function startNew() { setEditing(null); setTitle(""); setDescription(""); setServings(""); setFinishedWeight(""); setVisibility("private"); setIngredients([]); setStatus(""); setImportUrl(""); setImportPreview(null); setReviewIndex(null); setTab("edit"); }
  function startEdit(recipe: Recipe) { setEditing(recipe); setTitle(recipe.title); setDescription(recipe.description ?? ""); setServings(recipe.servings?.toString() ?? ""); setFinishedWeight(recipe.finishedWeightGrams?.toString() ?? ""); setVisibility(recipe.visibility); setIngredients(recipe.ingredients); setStatus(""); setImportUrl(""); setImportPreview(null); setReviewIndex(null); setTab("edit"); }
  async function previewImport() {
    if (importing || !importUrl.trim()) return;
    setImporting(true); setStatus(""); setImportPreview(null); setReviewIndex(null); setIngredients([]);
    try {
      const result = await api<{ preview: ImportPreview }>("/recipes/import-url/preview", { method: "POST", body: JSON.stringify({ url: importUrl.trim() }) }, state);
      const preview = result.preview;
      setImportPreview(preview); setTitle(preview.title); setServings(preview.servings?.toString() ?? "");
      setDescription(preview.instructions.join("\n").slice(0, 2_000));
      setIngredients(preview.ingredients.flatMap((item, sortOrder) => item.canConfirm && item.selectedFood && item.quantity?.status === "resolved" && item.quantity.grams ? [{ foodId: item.selectedFood.id, quantityGrams: item.quantity.grams, preparation: item.preparation, sortOrder, originalText: item.originalText, food: item.selectedFood }] : []));
    } catch { setStatus(importText[lang].failed); }
    finally { setImporting(false); }
  }
  function addIngredient() {
    const grams = Number(candidateGrams);
    if (!candidate || !Number.isFinite(grams) || grams <= 0) return setStatus("Válassz alapanyagot és adj meg pozitív grammértéket.");
    const originalText = reviewIndex == null ? undefined : importPreview?.ingredients[reviewIndex]?.originalText;
    setIngredients((items) => [...items, { foodId: candidate.id, quantityGrams: grams, food: candidate, originalText, sortOrder: items.length }]);
    if (reviewIndex != null) setImportPreview((preview) => preview ? { ...preview, ingredients: preview.ingredients.map((item, index) => index === reviewIndex ? { ...item, selectedFood: candidate, candidates: [candidate], resolution: "resolved", quantity: { status: "resolved", grams, requiresConfirmation: false }, canConfirm: true } : item) } : preview);
    setReviewIndex(null); setCandidate(null); setCandidateGrams("100"); setResetVersion((value) => value + 1); setStatus("");
  }
  async function saveRecipe() {
    if (!title.trim() || ingredients.length === 0) return setStatus("A recept neve és legalább egy alapanyag kötelező.");
    if (importPreview && importPreview.ingredients.some((item) => !item.canConfirm || !item.selectedFood || item.quantity?.status !== "resolved" || !item.quantity.grams)) return setStatus(importText[lang].blocked);
    const body = { title, description: description || undefined, servings: servings ? Number(servings) : undefined, finishedWeightGrams: finishedWeight ? Number(finishedWeight) : undefined, visibility, sourceType: importPreview ? "schema_org" : "manual", ...(importPreview ? { sourceUrl: importPreview.sourceUrl } : {}), ingredients: ingredients.map(({ foodId, quantityGrams, preparation, originalText }, sortOrder) => ({ foodId, quantityGrams, ...(preparation ? { preparation } : {}), ...(originalText ? { originalText } : {}), sortOrder })) };
    await api(editing ? `/recipes/${editing.id}` : "/recipes", { method: editing ? "PUT" : "POST", body: JSON.stringify(body) }, state); setStatus("Recept elmentve."); setTab("mine");
  }
  async function removeRecipe(recipe: Recipe) { if (!window.confirm(`Törlöd ezt a receptet: ${recipe.title}?`)) return; await api(`/recipes/${recipe.id}`, { method: "DELETE" }, state); await loadRecipes(); }
  async function fork(recipe: Recipe) { await api(`/recipes/${recipe.id}/fork`, { method: "POST" }, state); setStatus("Privát másolat elmentve a saját receptjeid közé."); }
  async function addToMeal(recipe: Recipe, quantity: number, unit: "g" | "serving") { await api(`/recipes/${recipe.id}/meals`, { method: "POST", body: JSON.stringify({ quantity, unit }) }, state); await onMealAdded(); setStatus(`${recipe.title} hozzáadva a mai étkezéshez.`); }

  return <section className="recipe-shell card">
    <div className="recipe-heading"><div><h2 className="flex items-center gap-2"><BookOpen size={21}/>Receptek</h2><p className="text-sm text-muted">Saját alapanyagokból, kizárólag a Food katalógus tápértékeivel.</p></div><button className="btn primary" type="button" onClick={startNew}><Plus size={17}/>Új recept</button></div>
    <div className="recipe-tabs" role="tablist"><button className={`seg ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>Receptjeim</button><button className={`seg ${tab === "public" ? "active" : ""}`} onClick={() => setTab("public")}><Users size={15}/>Közösségi receptek</button></div>
    {status && <div className="status success" role="status">{status}</div>}
    {tab === "edit" ? <div className="recipe-editor">
      {!editing && <section className="rounded-xl border border-borderSoft p-4" aria-label={importText[lang].heading}><h3>{importText[lang].heading}</h3><div className="recipe-search"><input aria-label={importText[lang].url} className="field" type="url" value={importUrl} onChange={(e) => { setImportUrl(e.target.value); setImportPreview(null); setReviewIndex(null); setIngredients([]); }} placeholder="https://example.com/recipe"/><button type="button" className="btn secondary" disabled={importing || !importUrl.trim()} onClick={() => previewImport()}>{importing ? importText[lang].loading : importText[lang].preview}</button></div></section>}
      {importPreview && <section className="rounded-xl border border-borderSoft p-4" aria-label={importText[lang].preview}><h3>{importPreview.title}</h3>{importPreview.servings && <p>{importPreview.servings} {lang === "de" ? "Portionen" : lang === "en" ? "servings" : "adag"}</p>}<ul className="recipe-detail-list">{importPreview.ingredients.map((item, index) => { const valid = item.canConfirm && item.selectedFood && item.quantity?.status === "resolved" && item.quantity.grams; return <li key={`${item.originalText}-${index}`}><strong>{item.originalText}</strong> — {valid ? `${item.selectedFood!.name}, ${Math.round(item.quantity!.grams! * 10) / 10} g · ${importText[lang].resolved}` : item.selectedFood ? importText[lang].review : importText[lang].unresolved}{!valid && <button type="button" className="btn secondary ml-2" onClick={() => { setReviewIndex(index); setCandidate(item.selectedFood); setCandidateGrams(item.quantity?.grams ? String(item.quantity.grams) : ""); }}>{importText[lang].resolve}</button>}</li>; })}</ul>{importPreview.instructions.length > 0 && <ol className="recipe-detail-list">{importPreview.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>}{importPreview.ingredients.some((item) => !item.canConfirm || !item.selectedFood || item.quantity?.status !== "resolved" || !item.quantity.grams) && <p className="text-sm text-muted" role="alert">{importText[lang].blocked}</p>}</section>}
      <div className="grid gap-3 md:grid-cols-2"><label>Recept neve<input className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}/></label><label>Leírás (opcionális)<input className="field" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000}/></label><label>Adagok<input className="field" type="number" min="0.1" step="0.1" value={servings} onChange={(e) => setServings(e.target.value)}/></label><label>Kész tömeg (g)<input className="field" type="number" min="0.1" step="0.1" value={finishedWeight} onChange={(e) => setFinishedWeight(e.target.value)}/></label></div>
      <fieldset className="visibility-toggle"><legend>Láthatóság</legend><label><input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")}/> Privát recept</label><label><input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")}/> Publikus recept</label></fieldset>
      <div className="ingredient-adder"><FoodCombobox idPrefix="recipe-food" lang={lang} state={state} selected={candidate} onSelect={setCandidate} resetVersion={resetVersion} labels={{ label: reviewIndex == null ? "Alapanyag" : importText[lang].resolve, placeholder: "Keresés az élelmiszerek között…", loading: "Keresés…", noResults: "Nincs találat", hint: "Írj be legalább 2 karaktert", selected: "Kiválasztva" }}/><label>Gramm<input className="field" type="number" min="0.1" step="0.1" value={candidateGrams} onChange={(e) => setCandidateGrams(e.target.value)}/></label><button type="button" className="btn secondary" onClick={addIngredient}><Plus size={16}/>Hozzáadás</button></div>
      <div className="ingredient-list">{ingredients.map((ingredient, index) => <div className="ingredient-row" key={`${ingredient.foodId}-${index}`}><strong>{ingredient.food.name}</strong><input aria-label={`${ingredient.food.name} gramm`} className="field" type="number" min="0.1" step="0.1" value={ingredient.quantityGrams} onChange={(e) => setIngredients((items) => items.map((item, i) => i === index ? { ...item, quantityGrams: Number(e.target.value) } : item))}/><span>g</span><button className="icon-button" aria-label="Alapanyag törlése" onClick={() => setIngredients((items) => items.filter((_, i) => i !== index))}><Trash2 size={17}/></button></div>)}</div>
      <NutritionSummary title="Teljes recept" totals={live}/><div className="recipe-nutrition-grid">{Number(servings) > 0 && <NutritionSummary title="Adagonként" totals={scale(live, 1 / Number(servings))}/>} {Number(finishedWeight) > 0 && <NutritionSummary title="100 grammonként" totals={scale(live, 100 / Number(finishedWeight))}/>}</div>
      <div className="recipe-actions"><button className="btn secondary" onClick={() => setTab("mine")}>Mégse</button><button className="btn primary" disabled={!!importPreview && importPreview.ingredients.some((item) => !item.canConfirm || !item.selectedFood || item.quantity?.status !== "resolved" || !item.quantity.grams)} onClick={() => saveRecipe().catch(() => setStatus("A recept mentése nem sikerült."))}><Save size={17}/>Mentés</button></div>
    </div> : <><div className="recipe-search"><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "public" ? "Keresés publikus receptek címében" : "Keresés a saját receptekben"}/><button className="btn secondary" onClick={() => loadRecipes()}>Keresés</button></div><div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><div><span className="recipe-badge">{recipe.visibility === "public" ? "Publikus" : "Privát"}</span><h3>{recipe.title}</h3><p className="text-sm text-muted">Szerző: {recipe.user.username}</p></div><p><strong>{Math.round((recipe.nutrition.perServing ?? recipe.nutrition.per100g ?? recipe.nutrition.total).macros.kcal)}</strong> kcal · <strong>{round((recipe.nutrition.perServing ?? recipe.nutrition.per100g ?? recipe.nutrition.total).macros.netCarbs)}</strong> g net carbs</p><details><summary>Megnyitás</summary><p className="text-sm text-muted">{recipe.description || "Nincs leírás."}</p><ul className="recipe-detail-list">{recipe.ingredients.map((ingredient) => <li key={ingredient.id ?? ingredient.foodId}>{ingredient.food.name} – {ingredient.quantityGrams} g</li>)}</ul><NutritionSummary title="Teljes recept" totals={recipe.nutrition.total.macros}/></details><RecipeMealControls recipe={recipe} onAdd={(quantity, unit) => addToMeal(recipe, quantity, unit)}/><div className="recipe-card-actions">{recipe.userId === currentUserId && <button className="btn secondary" onClick={() => startEdit(recipe)}>Szerkesztés</button>}{tab === "public" && recipe.userId !== currentUserId && <button className="btn secondary" onClick={() => fork(recipe)}><Copy size={15}/>Mentés sajátként</button>}{recipe.userId === currentUserId && <button className="icon-button" aria-label="Recept törlése" onClick={() => removeRecipe(recipe)}><Trash2 size={17}/></button>}</div></article>)}</div>{recipes.length === 0 && <p className="text-muted">Még nincs megjeleníthető recept.</p>}</>}
  </section>;
}
function NutritionSummary({ title, totals }: { title: string; totals: Totals }) { return <div className="nutrition-summary"><strong>{title}</strong><span>{Math.round(totals.kcal)} kcal</span><span>{round(totals.protein)} g protein</span><span>{round(totals.fat)} g fat</span><span>{round(totals.carbs)} g carbs</span><span>{round(totals.fiber)} g fiber</span><span>{round(totals.netCarbs)} g net</span></div>; }
function RecipeMealControls({ recipe, onAdd }: { recipe: Recipe; onAdd: (quantity: number, unit: "g" | "serving") => Promise<void> }) {
  const [unit, setUnit] = useState<"g" | "serving">(recipe.servings ? "serving" : "g");
  const [quantity, setQuantity] = useState(recipe.servings ? 1 : 100);
  return <div className="recipe-meal-controls"><input aria-label="Mennyiség" className="field" type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/><select aria-label="Egység" className="field" value={unit} onChange={(event) => setUnit(event.target.value as "g" | "serving")}><option value="g">g</option>{recipe.servings && <option value="serving">adag</option>}</select><button className="btn primary" onClick={() => onAdd(quantity, unit)}>Étkezéshez</button></div>;
}
const round = (value: number) => Math.round(value * 10) / 10;
const scale = (totals: Totals, factor: number): Totals => Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value * factor])) as Totals;
