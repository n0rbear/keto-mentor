import express from "express";
import { accountDeletionSchema } from "@keto-mentor/shared";

// Account deletion (tester release 2026-10-15; GDPR right to erasure).
// Everything owned by the user goes through the schema's onDelete: Cascade
// (profile, sessions, meals with their items, recipes, plates, entitlements,
// reset links). Two things need care first:
// - a PUBLIC recipe that another user has logged a meal from cannot be
//   deleted (MealItem.recipe is onDelete: Restrict, and that diary must not
//   change), so it is handed to the system account and stays as it is;
// - private foods (Food.createdById) have no foreign key to the user; they
//   are deleted once nothing references them any more.

type Db = {
  user: { findUnique(args: any): Promise<any>; delete(args: any): Promise<any> };
  recipe: { updateMany(args: any): Promise<any> };
  food: { deleteMany(args: any): Promise<any> };
  $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
};

export function accountDeletionRouter(deps: { prisma: Db; requireAuth: express.RequestHandler; verifyPassword(hash: string, password: string): Promise<boolean>; systemUsername: string; log?: (line: string) => void }) {
  const router = express.Router();
  const log = deps.log ?? console.log;
  router.delete("/me", deps.requireAuth, async (req, res, next) => {
    try {
      const input = accountDeletionSchema.parse(req.body);
      const userId = req.user!.id;
      const user = await deps.prisma.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
      if (!user || !(await deps.verifyPassword(user.passwordHash, input.currentPassword))) return res.status(401).json({ error: "invalid_credentials" });
      const handedOver = await deps.prisma.$transaction(async (tx) => {
        const system = await tx.user.findUnique({ where: { username: deps.systemUsername }, select: { id: true } });
        const shared = system
          ? await tx.recipe.updateMany({ where: { userId, mealItems: { some: { meal: { userId: { not: userId } } } } }, data: { userId: system.id } })
          : { count: 0 };
        await tx.user.delete({ where: { id: userId } });
        await tx.food.deleteMany({ where: { createdById: userId, mealItems: { none: {} }, recipeIngredients: { none: {} } } });
        return shared.count;
      });
      log(`account_deleted shared_recipes_kept=${handedOver}`);
      res.clearCookie("km_refresh");
      res.status(204).end();
    } catch (error) { next(error); }
  });
  return router;
}
