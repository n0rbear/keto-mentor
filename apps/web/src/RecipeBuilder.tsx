import { useEffect, useState } from "react";
import { BookOpen, Plus, Users } from "lucide-react";
import { api, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import { RecipeEditor } from "./RecipeEditor";
import { RecipeDetail, type RecipeDetailData } from "./RecipeDetail";

type RecipeSummary = {
  id: string; userId: string; title: string; visibility: "private" | "public" | "unlisted";
  sourceType: "manual" | "schema_org" | "ai_structured"; servings?: number | null; finishedWeightGrams?: number | null;
  user: { id: string; username: string };
  nutrition: { total: { macros: { kcal: number; netCarbs: number } }; perServing: { macros: { kcal: number; netCarbs: number } } | null; per100g: { macros: { kcal: number; netCarbs: number } } | null };
};

type View = { kind: "library" } | { kind: "editor"; editing: RecipeDetailData | null } | { kind: "detail"; recipeId: string };

export function RecipeBuilder({ lang, state, currentUserId, onMealAdded }: { lang: Lang; state: ApiState; currentUserId: string; onMealAdded: () => Promise<void> }) {
  const t = dict[lang];
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "library" });
  const [loadError, setLoadError] = useState("");

  async function loadRecipes(nextTab = tab) {
    const path = nextTab === "public" ? `/recipes/public?q=${encodeURIComponent(query)}&limit=20` : `/recipes?q=${encodeURIComponent(query)}&limit=20`;
    try {
      const result = await api<{ recipes: RecipeSummary[] }>(path, {}, state);
      setRecipes(result.recipes);
      setLoadError("");
    } catch {
      setLoadError(t.recipes.loadFailed);
    }
  }
  useEffect(() => { if (view.kind === "library") loadRecipes(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab, view.kind]);

  function openDetail(recipeId: string) { setView({ kind: "detail", recipeId }); }
  function startNew() { setView({ kind: "editor", editing: null }); }
  function startEdit(recipe: RecipeDetailData) { setView({ kind: "editor", editing: recipe }); }
  function handleSaved(recipeId: string, wasEditing: boolean) {
    // A brand-new recipe returns to the library it was created from; editing
    // an existing one returns to its (now updated) detail view instead.
    if (wasEditing) setView({ kind: "detail", recipeId });
    else setView({ kind: "library" });
  }
  function backToLibrary() { setView({ kind: "library" }); }

  return <section className="recipe-shell card">
    {view.kind === "editor" ? (
      <RecipeEditor lang={lang} state={state} editing={view.editing} onCancel={backToLibrary} onSaved={(recipeId) => handleSaved(recipeId, !!view.editing)}/>
    ) : view.kind === "detail" ? (
      <RecipeDetail
        recipeId={view.recipeId}
        lang={lang}
        state={state}
        currentUserId={currentUserId}
        onBack={backToLibrary}
        onEdit={startEdit}
        onDeleted={backToLibrary}
        onMealAdded={onMealAdded}
      />
    ) : (
      <>
        <div className="recipe-heading"><div><h2 className="flex items-center gap-2"><BookOpen size={21}/>{t.recipes.heading}</h2><p className="text-sm text-muted">{t.recipes.subheading}</p></div><button className="btn primary" type="button" onClick={startNew}><Plus size={17}/>{t.recipes.newRecipe}</button></div>
        <div className="recipe-tabs" role="tablist"><button className={`seg ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>{t.recipes.myRecipes}</button><button className={`seg ${tab === "public" ? "active" : ""}`} onClick={() => setTab("public")}><Users size={15}/>{t.recipes.publicRecipes}</button></div>
        {loadError && <div className="status error" role="alert">{loadError}</div>}
        <div className="recipe-search"><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "public" ? t.recipes.searchPublicPlaceholder : t.recipes.searchMinePlaceholder}/><button className="btn secondary" onClick={() => loadRecipes()}>{t.recipes.search}</button></div>
        <div className="recipe-grid">
          {recipes.map((recipe) => {
            const summary = recipe.nutrition.perServing ?? recipe.nutrition.per100g ?? recipe.nutrition.total;
            return (
              <article className="recipe-card" key={recipe.id}>
                <div>
                  <span className="recipe-badge">{recipe.visibility === "public" ? t.recipes.badgePublic : t.recipes.badgePrivate}</span>
                  <h3>{recipe.title}</h3>
                  <p className="text-sm text-muted">{t.recipes.byAuthor} {recipe.user.username}</p>
                </div>
                <p>
                  <strong>{Math.round(summary.macros.kcal)}</strong> kcal · <strong>{Math.round(summary.macros.netCarbs)}</strong> {t.recipes.netCarbsShort}
                  {recipe.servings ? ` · ${recipe.servings} ${t.serving}` : recipe.finishedWeightGrams ? ` · ${recipe.finishedWeightGrams} g` : ""}
                </p>
                <button type="button" className="btn secondary" onClick={() => openDetail(recipe.id)}>{t.recipes.view}</button>
              </article>
            );
          })}
        </div>
        {recipes.length === 0 && !loadError && <p className="text-muted">{t.recipes.emptyLibrary}</p>}
      </>
    )}
  </section>;
}
