import { MistralAiProvider } from "./mistral-provider.js";
import { evaluateFoodUnderstanding } from "./food-understanding-eval.js";
import { FOOD_UNDERSTANDING_EVAL_CORPUS } from "./food-understanding-eval-corpus.js";

const apiKey = process.env.MISTRAL_API_KEY;
const model = process.env.MISTRAL_MODEL;
if (!apiKey || !model) throw new Error("MISTRAL_API_KEY and MISTRAL_MODEL must be intentionally configured for the optional live evaluation");
const requestedLimit = Number(process.env.FOOD_NLP_LIVE_LIMIT ?? Number.POSITIVE_INFINITY);
const cases = FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.route === "ai").slice(0, Number.isFinite(requestedLimit) ? Math.max(1, requestedLimit) : undefined);
const provider = new MistralAiProvider({ apiKey, model, baseUrl: process.env.MISTRAL_BASE_URL });
const report = await evaluateFoodUnderstanding(cases, (test) => provider.run("food_nlp", { text: test.input }));
console.log(JSON.stringify({ provider: provider.id, model: provider.model, liveCalls: cases.length, report }, null, 2));
if (report.unsafeNutritionOutputAccepted || report.validSchema !== report.total) process.exitCode = 2;
