import { Router, type RequestHandler } from "express";
import { isAdminUser } from "../admin/email-verification.js";

// Beta reward (owner, 2026-10-16): the 10 testers with the most logged meals
// by the end of the first beta round get lifetime premium. The owner's own
// profile and admin accounts never compete. The round may be extended:
// change endsAt here.
export const BETA_CONTEST = {
  endsAt: "2026-11-30T23:59:59+01:00",
  winners: 10,
  excludedUsernames: ["norbi"] as readonly string[]
};

export type Standing = { rank: number; userId: string; username: string; email: string | null; meals: number };

type Deps = { prisma: any; admins: readonly string[]; systemUsername: string; endsAt?: string };

/** Competition ranking (ties share a place) of every eligible user with at least one meal. */
export async function contestStandings(deps: Deps): Promise<Standing[]> {
  const until = new Date(deps.endsAt ?? BETA_CONTEST.endsAt);
  const counts: Array<{ userId: string; _count: { _all: number } }> = await deps.prisma.meal.groupBy({
    by: ["userId"], where: { createdAt: { lte: until } }, _count: { _all: true }
  });
  if (!counts.length) return [];
  const users: any[] = await deps.prisma.user.findMany({
    where: { id: { in: counts.map((c) => c.userId) } },
    select: { id: true, username: true, email: true, emailVerifiedAt: true }
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  const eligible = counts
    .map((c) => ({ user: byId.get(c.userId), meals: c._count._all }))
    .filter(({ user, meals }) => user && meals > 0 && isEligible(user, deps))
    .sort((a, b) => b.meals - a.meals || a.user.username.localeCompare(b.user.username));
  return eligible.map(({ user, meals }) => ({
    rank: 1 + eligible.filter((e) => e.meals > meals).length,
    userId: user.id, username: user.username, email: user.email ?? null, meals
  }));
}

export function isEligible(user: { username: string; email?: string | null; emailVerifiedAt?: Date | null }, deps: Pick<Deps, "admins" | "systemUsername">) {
  return user.username !== deps.systemUsername && !BETA_CONTEST.excludedUsernames.includes(user.username) && !isAdminUser(user, deps.admins);
}

export type MyRank =
  | { eligible: false }
  | { eligible: true; rank: number | null; meals: number; participants: number; winners: number; endsAt: string; ended: boolean; mealsToTop: number };

/** The signed-in user's place; rank is null before their first meal. */
export function myRank(standings: Standing[], userId: string, now = new Date(), endsAt = BETA_CONTEST.endsAt): Extract<MyRank, { eligible: true }> {
  const mine = standings.find((s) => s.userId === userId);
  const meals = mine?.meals ?? 0;
  // Meals needed to reach the last prize place (tie counts as in).
  const others = standings.filter((s) => s.userId !== userId);
  const cutoff = others.length >= BETA_CONTEST.winners ? others[BETA_CONTEST.winners - 1].meals : 0;
  const inTop = !!mine && mine.rank <= BETA_CONTEST.winners;
  return {
    eligible: true, rank: mine?.rank ?? null, meals, participants: standings.length, winners: BETA_CONTEST.winners,
    endsAt, ended: now > new Date(endsAt), mealsToTop: inTop ? 0 : Math.max(1, cutoff - meals)
  };
}

export function betaContestRouter(deps: Deps & { requireAuth: RequestHandler }) {
  const router = Router();
  router.get("/me/beta-rank", deps.requireAuth, async (req, res, next) => {
    try {
      const user = await deps.prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, username: true, email: true, emailVerifiedAt: true } });
      if (!user || !isEligible(user, deps)) return res.json({ eligible: false } satisfies MyRank);
      res.json(myRank(await contestStandings(deps), user.id) satisfies MyRank);
    } catch (error) { next(error); }
  });
  return router;
}
