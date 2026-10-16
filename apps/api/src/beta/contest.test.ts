import { describe, expect, it } from "vitest";
import { BETA_CONTEST, contestStandings, myRank } from "./contest.js";

const users = [
  { id: "norbi", username: "norbi", email: "horvath.81.norbert@gmail.com", emailVerifiedAt: null },
  { id: "admin", username: "norbadmin", email: "norbert@norbapp.com", emailVerifiedAt: new Date() },
  { id: "a", username: "anna", email: "a@x.hu", emailVerifiedAt: null },
  { id: "b", username: "bela", email: null, emailVerifiedAt: null },
  { id: "c", username: "cili", email: null, emailVerifiedAt: null }
];
const meals: Record<string, number> = { norbi: 99, admin: 50, a: 12, b: 12, c: 3 };
const prisma = {
  meal: { groupBy: async () => Object.entries(meals).map(([userId, n]) => ({ userId, _count: { _all: n } })) },
  user: { findMany: async () => users }
};
const deps = { prisma, admins: ["norbert@norbapp.com"], systemUsername: "system:keto-mentor" };

describe("béta verseny: legtöbb naplózott étkezés", () => {
  it("ranks by meals with shared places for ties, without the owner's profile or admins", async () => {
    const s = await contestStandings(deps);
    expect(s.map((x) => [x.username, x.rank, x.meals])).toEqual([["anna", 1, 12], ["bela", 1, 12], ["cili", 3, 3]]);
  });

  it("tells a tester their place, and someone with no meals yet what it takes", async () => {
    const s = await contestStandings(deps);
    expect(myRank(s, "c", new Date("2026-10-20"))).toMatchObject({ rank: 3, meals: 3, participants: 3, winners: 10, mealsToTop: 0, ended: false });
    expect(myRank(s, "new", new Date("2026-10-20"))).toMatchObject({ rank: null, meals: 0, mealsToTop: 1 });
    expect(myRank(s, "c", new Date("2026-12-01")).ended).toBe(true);
    expect(BETA_CONTEST.endsAt.startsWith("2026-11-30")).toBe(true);
  });

  it("counts the meals still needed to reach 10th place when the field is full", () => {
    const s = Array.from({ length: 12 }, (_, i) => ({ rank: i + 1, userId: `u${i}`, username: `u${i}`, email: null, meals: 40 - i * 2 }));
    expect(myRank(s, "u11")).toMatchObject({ rank: 12, mealsToTop: 4 }); // 10th has 22, u11 has 18
  });
});
