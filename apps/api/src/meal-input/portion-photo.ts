import express from "express";
import type { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { COIN_DIAMETERS_MM, PortionVisionError, type PortionReference, type PortionVisionProvider } from "../ai/portion-vision-provider.js";

// Plate-photo portion estimation (owner request, 2026-09-25): the photo is
// asked for only when a dish has no stated amount. The user's own plates are
// measured once (coin next to the plate) and remembered; restaurant or guest
// plates always need a coin and are never saved.

export const PORTION_PHOTO_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 15 });
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Realistic bounds: a saucer to a large platter; a spoonful to a big plate.
const PLATE_DIAMETER_MM = { min: 120, max: 400 };
const PORTION_GRAMS = { min: 5, max: 3000 };
const MAX_PLATES_PER_USER = 10;

const querySchema = z.object({
  dish: z.string().trim().min(1).max(200),
  reference: z.enum(["coin", "card", "plate"]),
  coin: z.enum(["eur1", "huf100"]).optional(),
  plateId: z.string().trim().min(1).max(64).optional(),
  savePlate: z.enum(["1", "0"]).optional(),
  plateName: z.string().trim().min(1).max(60).optional()
}).strict();

function apiError(publicCode: string, status = 400) {
  return Object.assign(new Error(publicCode), { status, publicCode });
}

export function portionPhotoRouter(prisma: PrismaClient, provider: PortionVisionProvider, requireAuth: express.RequestHandler) {
  const router = express.Router();
  const limiter = rateLimit({
    ...PORTION_PHOTO_RATE_LIMIT, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => { if (!req.user?.id) throw new Error("auth required"); return req.user.id; }
  });

  router.get("/me/plates", requireAuth, async (req, res, next) => {
    try {
      const plates = await prisma.userPlate.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, diameterMm: true } });
      res.json({ plates });
    } catch (error) { next(error); }
  });

  router.delete("/me/plates/:id", requireAuth, async (req, res, next) => {
    try {
      await prisma.userPlate.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
      res.status(204).end();
    } catch (error) { next(error); }
  });

  router.post(
    "/meal-input/portion-photo",
    requireAuth,
    limiter,
    express.raw({ type: ALLOWED_IMAGE_TYPES, limit: MAX_IMAGE_BYTES }),
    async (req, res, next) => {
      try {
        const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
        if (!Buffer.isBuffer(req.body) || !contentType || !ALLOWED_IMAGE_TYPES.includes(contentType)) throw apiError("unsupported_image_format", 415);
        if (!req.body.byteLength) throw apiError("empty_image");
        const query = querySchema.parse(req.query);

        let reference: PortionReference;
        if (query.reference === "coin") {
          if (!query.coin) throw apiError("coin_required");
          reference = { kind: "coin", coin: query.coin };
        } else if (query.reference === "card") {
          reference = { kind: "card" };
        } else {
          if (!query.plateId) throw apiError("plate_required");
          const plate = await prisma.userPlate.findFirst({ where: { id: query.plateId, userId: req.user!.id } });
          if (!plate) throw apiError("plate_not_found", 404);
          reference = { kind: "plate", diameterMm: plate.diameterMm };
        }
        // Only the user's own plate measured with a coin or card is ever saved.
        const savePlate = query.savePlate === "1" && reference.kind !== "plate";

        const estimate = await provider.estimate({ image: req.body, mimeType: contentType, dish: query.dish, reference, measurePlate: savePlate });
        if (!estimate.referenceFound) return res.json({ status: "reference_not_found", notes: estimate.notes });
        const grams = estimate.grams != null && estimate.grams >= PORTION_GRAMS.min && estimate.grams <= PORTION_GRAMS.max ? Math.round(estimate.grams) : null;

        let savedPlate: { id: string; name: string; diameterMm: number } | null = null;
        if (savePlate && estimate.plateFound && estimate.plateDiameterMm != null
          && estimate.plateDiameterMm >= PLATE_DIAMETER_MM.min && estimate.plateDiameterMm <= PLATE_DIAMETER_MM.max) {
          const count = await prisma.userPlate.count({ where: { userId: req.user!.id } });
          if (count < MAX_PLATES_PER_USER) {
            savedPlate = await prisma.userPlate.create({
              data: { userId: req.user!.id, name: query.plateName ?? "Saját tányér", diameterMm: Math.round(estimate.plateDiameterMm) },
              select: { id: true, name: true, diameterMm: true }
            });
          }
        }
        if (grams == null) return res.json({ status: "food_not_measurable", notes: estimate.notes, savedPlate });
        console.log(`portion_photo outcome=estimated reference=${reference.kind} confidence=${estimate.confidence.toFixed(2)} savedPlate=${!!savedPlate}`);
        res.json({ status: "estimated", grams, confidence: estimate.confidence, notes: estimate.notes, savedPlate });
      } catch (error) {
        if (error instanceof PortionVisionError) {
          console.log(`portion_photo outcome=provider_error code=${error.code}`);
          return res.status(error.code === "timeout" ? 504 : 502).json({ error: `portion_photo_${error.code}` });
        }
        next(error);
      }
    }
  );
  router.use("/meal-input/portion-photo", (error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error?.type === "entity.too.large") return res.status(413).json({ error: "image_too_large" });
    next(error);
  });
  return router;
}

export { COIN_DIAMETERS_MM };
