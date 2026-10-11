import express from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AVERAGE_PLATES, dishProfileFromProvenance, estimatePlatePortion, type PlateInput } from "./plate-portion.js";

// Saját tányérok (roadmap D). Replaces the plate-photo feature: the user
// measures each home plate once (deep: capacity with water, flat: diameter)
// and later picks it with a fill level; grams come from the dish's density.

const MAX_PLATES_PER_USER = 10;
const plateSelect = { id: true, name: true, kind: true, capacityMl: true, diameterMm: true } as const;

const plateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("deep"), name: z.string().trim().min(1).max(60), capacityMl: z.number().min(100).max(2000) }).strict(),
  z.object({ kind: z.literal("flat"), name: z.string().trim().min(1).max(60), diameterMm: z.number().min(100).max(400) }).strict()
]);
const portionSchema = z.object({
  recipeId: z.string().trim().min(1).max(64).optional(),
  fill: z.enum(["half", "normal", "full", "small", "heaped"]).default("normal")
}).strict();
const averagePortionSchema = portionSchema.extend({ kind: z.enum(["deep", "flat"]) }).strict();
// The one-time "Milyen tányérjaid vannak?" answer (owner decision
// 2026-10-11): "saved" or "skipped"; null = never answered.
const plateSetupSchema = z.object({ answer: z.enum(["saved", "skipped"]) }).strict();

const allowedFills = (kind: PlateInput["kind"]) => kind === "deep" ? ["half", "normal", "full"] : ["small", "normal", "heaped"];

// Only a recipe the user may see (own or public) lends its profile.
async function visibleDishProfile(prisma: PrismaClient, userId: string, recipeId?: string) {
  if (!recipeId) return null;
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, deletedAt: null, OR: [{ userId }, { visibility: "public" }] }, select: { provenance: true } });
  return recipe ? dishProfileFromProvenance(recipe.provenance) : null;
}

function apiError(publicCode: string, status = 400) {
  return Object.assign(new Error(publicCode), { status, publicCode });
}

function toData(input: z.infer<typeof plateSchema>) {
  return input.kind === "deep"
    ? { name: input.name, kind: "deep", capacityMl: Math.round(input.capacityMl), diameterMm: null }
    : { name: input.name, kind: "flat", diameterMm: Math.round(input.diameterMm), capacityMl: null };
}

export function platesRouter(prisma: PrismaClient, requireAuth: express.RequestHandler) {
  const router = express.Router();

  router.get("/me/plates", requireAuth, async (req, res, next) => {
    try {
      res.json({ plates: await prisma.userPlate.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "asc" }, select: plateSelect }) });
    } catch (error) { next(error); }
  });

  router.post("/me/plates", requireAuth, express.json(), async (req, res, next) => {
    try {
      const input = plateSchema.parse(req.body);
      const count = await prisma.userPlate.count({ where: { userId: req.user!.id } });
      if (count >= MAX_PLATES_PER_USER) throw apiError("plate_limit_reached", 409);
      res.status(201).json({ plate: await prisma.userPlate.create({ data: { userId: req.user!.id, ...toData(input) }, select: plateSelect }) });
    } catch (error) { next(error); }
  });

  router.put("/me/plates/:id", requireAuth, express.json(), async (req, res, next) => {
    try {
      const input = plateSchema.parse(req.body);
      const updated = await prisma.userPlate.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: toData(input) });
      if (!updated.count) throw apiError("plate_not_found", 404);
      res.json({ plate: await prisma.userPlate.findFirst({ where: { id: req.params.id, userId: req.user!.id }, select: plateSelect }) });
    } catch (error) { next(error); }
  });

  router.delete("/me/plates/:id", requireAuth, async (req, res, next) => {
    try {
      await prisma.userPlate.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
      res.status(204).end();
    } catch (error) { next(error); }
  });

  router.post("/me/plates/:id/portion", requireAuth, express.json(), async (req, res, next) => {
    try {
      const input = portionSchema.parse(req.body ?? {});
      const plate = await prisma.userPlate.findFirst({ where: { id: req.params.id, userId: req.user!.id }, select: plateSelect });
      if (!plate) throw apiError("plate_not_found", 404);
      const plateInput: PlateInput | null = plate.kind === "deep" && plate.capacityMl ? { kind: "deep", capacityMl: plate.capacityMl }
        : plate.kind === "flat" && plate.diameterMm ? { kind: "flat", diameterMm: plate.diameterMm } : null;
      if (!plateInput) throw apiError("plate_incomplete", 409);
      if (!allowedFills(plateInput.kind).includes(input.fill)) throw apiError("fill_not_for_plate_kind");
      const estimate = estimatePlatePortion(plateInput, input.fill, await visibleDishProfile(prisma, req.user!.id, input.recipeId));
      console.log(`plate_portion kind=${plateInput.kind} fill=${input.fill} basis=${estimate.basis}`);
      res.json(estimate);
    } catch (error) { next(error); }
  });

  // No saved plate: the average plate of that kind (AVERAGE_PLATES).
  router.post("/me/average-plate/portion", requireAuth, express.json(), async (req, res, next) => {
    try {
      const input = averagePortionSchema.parse(req.body ?? {});
      const plate = AVERAGE_PLATES[input.kind];
      if (!allowedFills(plate.kind).includes(input.fill)) throw apiError("fill_not_for_plate_kind");
      const estimate = estimatePlatePortion(plate, input.fill, await visibleDishProfile(prisma, req.user!.id, input.recipeId));
      console.log(`plate_portion kind=${plate.kind} average=true fill=${input.fill} basis=${estimate.basis}`);
      res.json({ ...estimate, plate });
    } catch (error) { next(error); }
  });

  router.put("/me/plate-setup", requireAuth, express.json(), async (req, res, next) => {
    try {
      const { answer } = plateSetupSchema.parse(req.body ?? {});
      const profile = await prisma.profile.upsert({ where: { userId: req.user!.id }, update: { plateSetup: answer }, create: { userId: req.user!.id, plateSetup: answer }, select: { plateSetup: true } });
      res.json(profile);
    } catch (error) { next(error); }
  });

  return router;
}
