// Shared between the deterministic schema.org extractor and the AI-fallback
// extractor so both produce content bounded by the exact same limits — the
// AI path must never be able to accept more/larger content than the
// deterministic path already enforces.
export const RECIPE_IMPORT_LIMITS = { title: 120, ingredients: 50, ingredient: 300, instructions: 100, instruction: 1_000, total: 20_000 } as const;
