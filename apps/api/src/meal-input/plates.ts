import express from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AVERAGE_PLATES, dishProfileFromProvenance, dishServedIn, estimatePlatePortion, type PlateInput } from "./plate-portion.js";

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
// "egy tányér / tál X" of a saved recipe (#81): the server picks the plate.
const amountPortionSchema = z.object({ recipeId: z.string().trim().min(1).max(64), unit: z.enum(["plate", "bowl"]) }).strict();
// The one-time "Milyen tányérjaid vannak?" answer (owner decision
// 2026-10-11): "saved" or "skipped"; null = never answered.
const plateSetupSchema = z.object({ answer: z.enum(["saved", "skipped"]) }).strict();

const allowedFills = (kind: PlateInput["kind"]) => kind === "deep" ? ["half", "normal", "full"] : ["small", "normal", "heaped"];

// Only a recipe the user may see (own or public) lends its profile.
async function visibleProvenance(prisma: PrismaClient, userId: string, recipeId?: string) {
  if (!recipeId) return null;
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, deletedAt: null, OR: [{ userId }, { visibility: "public" }] }, select: { provenance: true } });
  return recipe?.provenance ?? null;
}
async function visibleDishProfile(prisma: PrismaClient, userId: string, recipeId?: string) {
  return dishProfileFromProvenance(await visibleProvenance(prisma, userId, recipeId));
}
function toPlateInput(plate: { kind: string; capacityMl: number | null; diameterMm: number | null }): PlateInput | null {
  return plate.kind === "deep" && plate.capacityMl ? { kind: "deep", capacityMl: plate.capacityMl }
    : plate.kind === "flat" && plate.diameterMm ? { kind: "flat", diameterMm: plate.diameterMm } : null;
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
      const plateInput = toPlateInput(plate);
      if (!plateInput) throw apiError("plate_incomplete", 409);
      if (!allowedFills(plateInput.kind).includes(input.fill)) throw apiError("fill_not_for_plate_kind");
      const estimate = estimatePlatePortion(plateInput, input.fill, await visibleDishProfile(prisma, req.user!.id, input.recipeId));
      console.log(`plate_portion kind=${plateInput.kind} fill=${input.fill} basis=${estimate.basis}`);
      res.json(estimate);
    } catch (error) { next(error); }
  });

  // "<n> tányér/tál <saved recipe>" at normal fill (owner decisions
  // 2026-10-11). A soup/főzelék (servedIn "deep_plate") always uses a deep
  // plate: the user's deep plate, else the average deep plate. Otherwise a
  // bowl prefers the user's deep plate, a plate takes the first saved plate
  // (#81). No (usable) saved plate: the average plate (AVERAGE_PLATES).
  router.post("/me/plate-portion", requireAuth, express.json(), async (req, res, next) => {
    const startedAt = performance.now();
    try {
      const input = amountPortionSchema.parse(req.body ?? {});
      const provenance = await visibleProvenance(prisma, req.user!.id, input.recipeId);
      const deepDish = dishServedIn(provenance) === "deep_plate";
      const saved = await prisma.userPlate.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "asc" }, select: plateSelect });
      const usable = saved.filter((plate) => toPlateInput(plate));
      const savedDeep = usable.find((plate) => plate.kind === "deep");
      const chosen = deepDish ? savedDeep : input.unit === "bowl" ? savedDeep ?? usable[0] : usable[0];
      const plate = chosen ? toPlateInput(chosen)! : AVERAGE_PLATES[deepDish || input.unit === "bowl" ? "deep" : "flat"];
      const estimate = estimatePlatePortion(plate, "normal", dishProfileFromProvenance(provenance));
      console.log(`plate_portion kind=${plate.kind} average=${!chosen} deep_dish=${deepDish} basis=${estimate.basis}`);
      res.json({ ...estimate, plate: chosen ? { source: "saved", name: chosen.name, ...plate } : { source: "average", ...plate } });
    } catch (error) { next(error); } finally {
      console.log(`timing_stage stage=plate_portion ms=${Math.round(performance.now() - startedAt)}`);
    }
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
