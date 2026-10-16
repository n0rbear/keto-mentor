// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BetaRankBanner } from "./BetaRankBanner";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const respond = (body: unknown) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));
const base = { eligible: true, participants: 14, winners: 10, endsAt: "2026-11-30T23:59:59+01:00", ended: false };

describe("Béta helyezés sáv", () => {
  it("shows the tester's place, the gap to the top 10 and the round's end", async () => {
    respond({ ...base, rank: 12, meals: 18, mealsToTop: 4 });
    render(<BetaRankBanner lang="hu" state={state}/>);
    expect(await screen.findByText("Helyezésed most: 12. hely (18 naplózott étkezés)")).toBeTruthy();
    const text = screen.getByRole("status").textContent!;
    expect(text).toContain("Még 4 étkezés, és bekerülsz a legjobb 10 közé.");
    expect(text).toContain("élethosszig tartó prémiumot");
    expect(text).toContain("november 30.");
    expect(text).not.toContain("..");
  });

  it("invites someone with no meals yet, and says when they are in the top 10", async () => {
    respond({ ...base, rank: null, meals: 0, mealsToTop: 1 });
    render(<BetaRankBanner lang="en" state={state}/>);
    expect(await screen.findByText("Log your first meal and you're in the running!")).toBeTruthy();
    cleanup();
    respond({ ...base, rank: 2, meals: 40, mealsToTop: 0 });
    render(<BetaRankBanner lang="de" state={state}/>);
    expect((await screen.findByRole("status")).textContent).toContain("Du bist unter den Top 10");
  });

  it("stays hidden for the owner's profile and admin accounts", async () => {
    respond({ eligible: false });
    const { container } = render(<BetaRankBanner lang="hu" state={state}/>);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.innerHTML).toBe("");
  });
});
