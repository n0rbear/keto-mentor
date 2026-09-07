import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Pencil, Trash2, X } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import { type Food, type Totals } from "./main";

export type RecipeIngredientDetail = { id: string; foodId: string; quantityGrams: number; originalText?: string | null; preparation?: string | null; sortOrder?: number; food: Food };
export type NutritionSlice = { macros: Totals; nutrients: Record<string, { key: string; label: string; unit: string; group: string; amount: number }> };
export type RecipeDetailData = {
  id: string; userId: string; title: string; description?: string | null; instructions?: string[];
  servings?: number | null; finishedWeightGrams?: number | null; visibility: "private" | "public" | "unlisted";
  sourceType: "manual" | "schema_org" | "ai_structured"; sourceUrl?: string | null;
  user: { id: string; username: string };
  ingredients: RecipeIngredientDetail[];
  nutrition: { total: NutritionSlice; perServing: NutritionSlice | null; per100g: NutritionSlice | null };
};

function recipeErrorText(error: unknown, labels: Record<string, string>) {
  if (!(error instanceof ApiError)) return labels.unknown;
  return labels[error.code] ?? (error.status === 401 ? labels.unauthorized : error.status && error.status >= 500 ? labels.server : labels.unknown);
}

function sourceHost(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function RecipeDetail({
  recipeId, lang, state, currentUserId, onBack, onEdit, onDeleted, onMealAdded
}: {
  recipeId: string; lang: Lang; state: ApiState; currentUserId: string;
  onBack: () => void; onEdit: (recipe: RecipeDetailData) => void; onDeleted: () => void; onMealAdded: () => Promise<void>;
}) {
  const t = dict[lang];
  const [recipe, setRecipe] = useState<RecipeDetailData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    setRecipe(null);
    setLoadError(null);
    api<{ recipe: RecipeDetailData }>(`/recipes/${recipeId}`, {}, state)
      .then((result) => setRecipe(result.recipe))
      .catch((error) => setLoadError(recipeErrorText(error, t.recipeErrors)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function fork() {
    if (!recipe || forking) return;
    setForking(true);
    setStatus(null);
    try {
      await api(`/recipes/${recipe.id}/fork`, { method: "POST" }, state);
      setStatus({ kind: "success", text: t.recipes.recipeSaved });
    } catch (error) {
      setStatus({ kind: "error", text: recipeErrorText(error, t.recipeErrors) });
    } finally {
      setForking(false);
    }
  }

  async function confirmDelete() {
    if (!recipe) return;
    await api(`/recipes/${recipe.id}`, { method: "DELETE" }, state);
    onDeleted();
  }

  async function addToMeal(quantity: number, unit: "g" | "serving") {
    if (!recipe) return;
    try {
      await api(`/recipes/${recipe.id}/meals`, { method: "POST", body: JSON.stringify({ quantity, unit }) }, state);
      await onMealAdded();
      setStatus({ kind: "success", text: `${recipe.title}${t.recipes.addedToMealSuffix}` });
    } catch (error) {
      setStatus({ kind: "error", text: recipeErrorText(error, t.recipeErrors) });
    }
  }

  const isOwner = recipe?.userId === currentUserId;

  return (
    <div className="recipe-detail">
      <button type="button" className="btn secondary" onClick={onBack}><ArrowLeft size={16}/>{t.recipes.back}</button>
      {loadError && <div className="status error" role="alert">{loadError}</div>}
      {!recipe && !loadError && <p className="text-muted">…</p>}
      {recipe && (
        <article className="recipe-detail-body">
          <div className="recipe-heading">
            <div>
              <span className="recipe-badge">{recipe.visibility === "public" ? t.recipes.badgePublic : t.recipes.badgePrivate}</span>
              <h3>{recipe.title}</h3>
              <p className="text-sm text-muted">{t.recipes.byAuthor} {recipe.user.username}</p>
            </div>
            <div className="recipe-card-actions">
              {isOwner && <button type="button" className="btn secondary" onClick={() => onEdit(recipe)}><Pencil size={15}/>{t.recipes.editAction}</button>}
              {isOwner && <button type="button" className="icon-button" aria-label={t.recipes.deleteAction} onClick={() => setConfirmingDelete(true)}><Trash2 size={17}/></button>}
              {!isOwner && recipe.visibility === "public" && <button type="button" className="btn secondary" disabled={forking} onClick={fork}><Copy size={15}/>{t.recipes.saveAsMine}</button>}
            </div>
          </div>

          {status && <div className={`status ${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>{status.text}</div>}

          <p className="text-sm text-muted">{recipe.description || t.recipes.noDescription}</p>

          {recipe.sourceUrl && (
            <p className="text-xs text-muted">
              {t.recipes.sourceLabel}: <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{sourceHost(recipe.sourceUrl)}</a>
            </p>
          )}

          <ul className="recipe-detail-list">
            {recipe.ingredients.map((ingredient) => <li key={ingredient.id}>{ingredient.food.names?.[lang] ?? ingredient.food.name} – {ingredient.quantityGrams} g</li>)}
          </ul>

          {recipe.instructions && recipe.instructions.length > 0
            ? <ol className="recipe-detail-list">{recipe.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>
            : <p className="text-sm text-muted">{t.recipes.noInstructions}</p>}

          <NutritionSummary title={t.recipes.totalNutrition} totals={recipe.nutrition.total.macros}/>
          <div className="recipe-nutrition-grid">
            {recipe.nutrition.perServing && <NutritionSummary title={t.recipes.perServing} totals={recipe.nutrition.perServing.macros}/>}
            {recipe.nutrition.per100g && <NutritionSummary title={t.recipes.per100g} totals={recipe.nutrition.per100g.macros}/>}
          </div>

          <RecipeMealControls recipe={recipe} lang={lang} onAdd={addToMeal}/>
        </article>
      )}
      {confirmingDelete && (
        <DeleteRecipeDialog
          lang={lang}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function NutritionSummary({ title, totals }: { title: string; totals: Totals }) {
  return <div className="nutrition-summary"><strong>{title}</strong><span>{Math.round(totals.kcal)} kcal</span><span>{round(totals.protein)} g protein</span><span>{round(totals.fat)} g fat</span><span>{round(totals.carbs)} g carbs</span><span>{round(totals.fiber)} g fiber</span><span>{round(totals.netCarbs)} g net</span></div>;
}
const round = (value: number) => Math.round(value * 10) / 10;

function RecipeMealControls({ recipe, lang, onAdd }: { recipe: RecipeDetailData; lang: Lang; onAdd: (quantity: number, unit: "g" | "serving") => Promise<void> }) {
  const t = dict[lang];
  const [unit, setUnit] = useState<"g" | "serving">(recipe.servings ? "serving" : "g");
  const [quantity, setQuantity] = useState(recipe.servings ? 1 : 100);
  const [adding, setAdding] = useState(false);

  async function submit() {
    if (adding) return;
    setAdding(true);
    try { await onAdd(quantity, unit); } finally { setAdding(false); }
  }

  return (
    <div className="recipe-meal-controls">
      <input aria-label={t.quantity} className="field" type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
      <select aria-label={t.unit} className="field" value={unit} onChange={(event) => setUnit(event.target.value as "g" | "serving")}>
        <option value="g">g</option>
        {recipe.servings && <option value="serving">{t.serving}</option>}
      </select>
      <button type="button" className="btn primary" disabled={adding} aria-busy={adding} onClick={submit}>{t.recipes.addToMeal}</button>
    </div>
  );
}

export function DeleteRecipeDialog({ lang, onCancel, onConfirm }: { lang: Lang; onCancel: () => void; onConfirm: () => Promise<void> | void }) {
  const t = dict[lang];
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (caught) {
      setError(recipeErrorText(caught, t.recipeErrors));
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-label={t.recipes.deleteConfirmTitle}>
      <div className="modal-panel card">
        <div className="modal-header">
          <h3>{t.recipes.deleteConfirmTitle}</h3>
          <button type="button" className="icon-button" aria-label={t.diary.cancel} onClick={onCancel} disabled={deleting}><X size={18}/></button>
        </div>
        <p className="text-sm text-muted">{t.recipes.deleteConfirmBody}</p>
        {error && <div className="status error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={deleting}>{t.diary.cancel}</button>
          <button type="button" className="btn danger" onClick={confirm} disabled={deleting} aria-busy={deleting}>{deleting ? t.savingMeal : t.recipes.deleteAction}</button>
        </div>
      </div>
    </div>
  );
}
