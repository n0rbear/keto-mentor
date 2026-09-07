import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

// Resolve the repo-root .env by file location, not process.cwd() — this
// script may be invoked via `npm run ... -w apps/api`, whose cwd is
// apps/api, not the repo root where .env actually lives.
loadDotenv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../../.env") });
import { configuredRecipeAiProvider } from "./recipe-ai-gateway.js";
import { resolveFoodAiGatewayConfig } from "../ai/food-ai-gateway-config.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";
import { htmlToSafeText } from "./recipe-import.js";

// Explicit opt-in-by-existing-configuration script (no CLI flags, no network
// access to a real third-party site — a synthetic benign fixture keeps this
// deterministic and avoids depending on any site's availability/ToS). Never
// prints the API key, the raw prompt, or the raw model response.
async function main() {
  const env = process.env as Record<string, string | undefined>;
  const resolved = resolveFoodAiGatewayConfig(env);
  if (resolved.kind === "disabled") {
    throw new Error("recipe_ai_gateway_disabled: configure FOOD_AI_PROVIDER=openrouter with OPENROUTER_API_KEY/FOOD_AI_MODEL, or MISTRAL_API_KEY/MISTRAL_MODEL, for the optional live evaluation");
  }

  // A benign synthetic recipe page with no schema.org JSON-LD, so it exercises
  // exactly the AI-fallback path (htmlToSafeText -> AI extraction), including
  // some harmless boilerplate/nav text the extractor should ignore.
  const html = `<html><head><style>.nav{display:none}</style><script>trackPageView();</script></head><body>
    <nav>Home | Recipes | About</nav>
    <h1>Keto Spinach and Egg Bowl</h1>
    <p>A quick, simple bowl for a keto breakfast. Makes 2 servings.</p>
    <h2>Ingredients</h2>
    <ul><li>200 g fresh spinach</li><li>3 large eggs</li><li>1 tablespoon olive oil</li><li>Salt and pepper to taste</li></ul>
    <h2>Instructions</h2>
    <ol><li>Heat the olive oil in a pan over medium heat.</li><li>Add the spinach and cook until wilted.</li><li>Push the spinach aside, crack in the eggs, and cook to taste.</li><li>Season with salt and pepper and serve.</li></ol>
    <footer>© Example Recipes Site</footer>
  </body></html>`;
  const pageText = htmlToSafeText(html);

  const provider = configuredRecipeAiProvider(env);
  const start = performance.now();
  try {
    const result = await provider.extract(pageText);
    const latencyMs = Math.round(performance.now() - start);
    const forbiddenKeys = Object.keys(result).filter((key) => !["title", "servings", "description", "ingredients", "instructions"].includes(key));
    console.log(JSON.stringify({
      gateway: resolved.kind,
      model: resolved.model,
      status: "success",
      latencyMs,
      extractedTitle: !!result.title,
      extractedServings: result.servings ?? null,
      ingredientCount: result.ingredients.length,
      instructionCount: result.instructions.length,
      strictSchemaHeld: forbiddenKeys.length === 0,
      forbiddenKeysPresent: forbiddenKeys
    }, null, 2));
    if (forbiddenKeys.length > 0) process.exitCode = 2;
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    // A provider failure (timeout/429/etc.) is an acceptable live-eval outcome
    // as long as it is a classified AiProviderError, not a code/config crash —
    // fallback-to-manual-entry is exactly the intended degraded behavior.
    const code = error instanceof AiProviderError ? error.code : "unknown_error";
    console.log(JSON.stringify({ gateway: resolved.kind, model: resolved.model, status: "provider_failure", code, latencyMs }, null, 2));
    if (!(error instanceof AiProviderError)) process.exitCode = 2;
  }
}
main().catch(() => { console.error("recipe_extraction_live_evaluation_unavailable"); process.exitCode = 2; });
