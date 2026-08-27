import { z } from "zod";

export const locales = ["hu", "de", "en"] as const;
export type Locale = (typeof locales)[number];

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(10).max(200),
  locale: z.enum(locales).default("hu")
});

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(1).max(200)
});

export const onboardingSchema = z.object({
  locale: z.enum(locales),
  goal: z.enum(["weight_loss", "maintenance", "energy", "medical_support", "learning"]),
  dailyKcal: z.number().int().min(900).max(5000),
  dailyNetCarbs: z.number().int().min(5).max(100),
  dailyProtein: z.number().int().min(40).max(300),
  dailyFat: z.number().int().min(30).max(350),
  dailyFiber: z.number().int().min(0).max(80),
  preferences: z.array(z.string().min(1).max(60)).max(20),
  avoidedFoods: z.array(z.string().min(1).max(80)).max(40),
  allergies: z.array(z.string().min(1).max(80)).max(40)
});

export const manualMealItemSchema = z.object({
  foodName: z.string().trim().min(2).max(120),
  quantityGrams: z.number().positive().max(5000),
  kcalPer100g: z.number().nonnegative().max(1000),
  fatPer100g: z.number().nonnegative().max(200),
  proteinPer100g: z.number().nonnegative().max(200),
  carbsPer100g: z.number().nonnegative().max(200),
  fiberPer100g: z.number().nonnegative().max(100).default(0),
  source: z.enum(["open_database", "open_food_facts", "manufacturer", "barcode", "user_input", "ai_ocr"]).default("user_input")
});

export const catalogMealItemSchema = z.object({
  foodId: z.string().min(1),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "kg", "serving"]).default("g"),
  servingId: z.string().min(1).optional(),
  gramsOverride: z.number().positive().max(50_000).optional()
}).superRefine((item, context) => {
  if (item.unit === "serving" && !item.servingId) context.addIssue({ code: "custom", path: ["servingId"], message: "servingId is required" });
  if (item.unit !== "serving" && (item.servingId || item.gramsOverride)) context.addIssue({ code: "custom", path: ["unit"], message: "serving fields require serving unit" });
});

export const createMealSchema = z.object({
  title: z.string().trim().min(2).max(100),
  eatenAt: z.string().datetime().optional(),
  items: z.array(z.union([catalogMealItemSchema, manualMealItemSchema])).min(1).max(20)
});

export const mealInterpretationSchema = z.object({
  text: z.string().trim().min(2).max(300)
});

export const recipeVisibilitySchema = z.enum(["private", "public", "unlisted"]);
export const recipeIngredientSchema = z.object({
  foodId: z.string().min(1),
  quantityGrams: z.number().positive().max(50_000),
  originalText: z.string().trim().max(300).optional(),
  preparation: z.string().trim().max(200).optional(),
  sortOrder: z.number().int().min(0).max(100).optional()
});
const safeRecipeSourceUrlSchema = z.string().trim().url().max(2_000).superRefine((value, context) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) context.addIssue({ code: "custom", message: "sourceUrl must be an HTTP(S) URL without credentials" });
});
export const recipeInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2_000).optional(),
  instructions: z.array(z.string().trim().min(1).max(1_000)).max(100).default([]),
  servings: z.number().positive().max(1000).optional(),
  finishedWeightGrams: z.number().positive().max(100_000).optional(),
  visibility: recipeVisibilitySchema.default("private"),
  sourceType: z.enum(["manual", "schema_org", "ai_structured"]).default("manual"),
  sourceUrl: safeRecipeSourceUrlSchema.optional(),
  importProof: z.string().max(4_000).optional(),
  ingredients: z.array(recipeIngredientSchema).min(1).max(50)
});
export const recipeMealSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "serving"])
});
export const recipeListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional()
});
export const recipeImportPreviewSchema = z.object({
  url: safeRecipeSourceUrlSchema
}).strict();
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type RecipeMealInput = z.infer<typeof recipeMealSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
