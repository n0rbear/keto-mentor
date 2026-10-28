// @vitest-environment jsdom
// Owner decision (2026-10-11, locked): "After registration, ask the user what
// plates they have. If they say they don't want to provide them, use average
// plate sizes." One-time, skippable step reusing the saved-plates editor.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./main";
import { plateSetupPending } from "./PlateSetup";
import { dict } from "./i18n";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

const hu = dict.hu.plateSetup;
const onboarded = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };
const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

type Call = { path: string; method: string; body: any };
function stubServer(opts: { me: () => any; plates?: any[] }) {
  const calls: Call[] = [];
  const plates = [...(opts.plates ?? [])];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path: url.pathname, method, body });
    if (url.pathname === "/auth/register") return ok({ user: { id: "u1", username: "newuser", locale: "hu" }, accessToken: "tok" }, 201);
    if (url.pathname === "/auth/login") return ok({ user: { id: "u1", username: "alice", locale: "hu" }, accessToken: "tok" });
    if (url.pathname === "/me") return ok({ user: opts.me() });
    if (url.pathname === "/me/onboarding") return ok({ profile: onboarded });
    if (url.pathname === "/meals/week") return ok(emptyWeek);
    if (url.pathname === "/meals/today") return ok({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals });
    if (url.pathname === "/me/plates" && method === "GET") return ok({ plates });
    if (url.pathname === "/me/plates" && method === "POST") { const plate = { id: `p${plates.length + 1}`, ...body, capacityMl: body.capacityMl ?? null, diameterMm: body.diameterMm ?? null }; plates.push(plate); return ok({ plate }, 201); }
    if (url.pathname === "/me/plate-setup") return ok({ plateSetup: body.answer });
    throw new Error(`Unexpected request: ${url.pathname} ${method}`);
  }));
  return calls;
}

async function login() {
  render(<App/>);
  fireEvent.click(screen.getByTestId("auth-mode-login"));
  fireEvent.change(screen.getByLabelText("Felhasználónév vagy e-mail"), { target: { value: "alice" } });
  fireEvent.change(screen.getByLabelText("Jelszó"), { target: { value: "supersecret" } });
  fireEvent.click(screen.getByTestId("auth-submit"));
}

describe("plateSetupPending", () => {
  it("open only for an onboarded user with no saved plate and no answer", () => {
    expect(plateSetupPending({ profile: { onboardingDone: true, plateSetup: null }, _count: { plates: 0 } })).toBe(true);
    expect(plateSetupPending({ profile: { onboardingDone: true, plateSetup: "skipped" }, _count: { plates: 0 } })).toBe(false);
    expect(plateSetupPending({ profile: { onboardingDone: true, plateSetup: "saved" }, _count: { plates: 0 } })).toBe(false);
    expect(plateSetupPending({ profile: { onboardingDone: true, plateSetup: null }, _count: { plates: 2 } })).toBe(false);
    expect(plateSetupPending({ profile: { onboardingDone: false }, _count: { plates: 0 } })).toBe(false);
    expect(plateSetupPending({ profile: { onboardingDone: true } })).toBe(false);
  });
});

describe("plate question after registration (Milyen tányérjaid vannak?)", () => {
  it("shows right after a new user's registration and first setup, with the existing plate editor", async () => {
    let profile: any = null;
    stubServer({ me: () => ({ id: "u1", username: "newuser", locale: "hu", profile, _count: { plates: 0 } }) });
    render(<App/>);
    fireEvent.click(screen.getByTestId("auth-mode-register"));
    fireEvent.change(screen.getByLabelText("Felhasználónév"), { target: { value: "newuser" } });
    fireEvent.change(screen.getByLabelText("E-mail cím"), { target: { value: "newuser@example.com" } });
    fireEvent.change(screen.getByLabelText("Jelszó"), { target: { value: "supersecret1" } });
    fireEvent.click(screen.getByTestId("health-consent"));
    fireEvent.click(screen.getByTestId("auth-submit"));
    const form = (await screen.findByText("Kezdő beállítások")).closest("form")!;
    profile = { ...onboarded, plateSetup: null };
    fireEvent.submit(form);
    expect(await screen.findByText(hu.title)).toBeTruthy();
    // The saved-plates editor from #67, already open; no grams field anywhere.
    expect(await screen.findByLabelText("Név (pl. mély tányér)")).toBeTruthy();
    expect(screen.queryByText(/Hány grammot/)).toBeNull();
    expect((screen.getByText(hu.done) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(hu.skip)).toBeTruthy();
  });

  it("shows once for an existing user with no plates and no answer; skip persists and hides it", async () => {
    let plateSetup: string | null = null;
    const calls = stubServer({ me: () => ({ id: "u1", username: "alice", locale: "hu", profile: { ...onboarded, plateSetup }, _count: { plates: 0 } }) });
    await login();
    fireEvent.click(await screen.findByText(hu.skip));
    await waitFor(() => expect(screen.queryByText(hu.title)).toBeNull());
    expect(calls.filter((call) => call.path === "/me/plate-setup")).toEqual([{ path: "/me/plate-setup", method: "PUT", body: { answer: "skipped" } }]);
    expect(screen.getByText("Napi áttekintés")).toBeTruthy();
    // Next session: the server returns the stored answer -> never again.
    cleanup(); localStorage.clear(); plateSetup = "skipped";
    await login();
    await screen.findByText("Napi áttekintés");
    expect(screen.queryByText(hu.title)).toBeNull();
  });

  it("save plates and continue: stores 'saved' and hides it", async () => {
    const calls = stubServer({ me: () => ({ id: "u1", username: "alice", locale: "hu", profile: { ...onboarded, plateSetup: null }, _count: { plates: 0 } }) });
    await login();
    fireEvent.change(await screen.findByLabelText("Név (pl. mély tányér)"), { target: { value: "Lapos" } });
    fireEvent.click(screen.getByLabelText("Lapos tányér"));
    fireEvent.change(screen.getByLabelText("Átmérő (cm)"), { target: { value: "24" } });
    fireEvent.click(screen.getByText("Mentés"));
    await screen.findByText(/Lapos · Lapos tányér · Ø 24 cm/);
    fireEvent.click(screen.getByText(hu.done));
    await waitFor(() => expect(screen.queryByText(hu.title)).toBeNull());
    expect(calls.find((call) => call.path === "/me/plates" && call.method === "POST")?.body).toEqual({ kind: "flat", name: "Lapos", diameterMm: 240 });
    expect(calls.find((call) => call.path === "/me/plate-setup")?.body).toEqual({ answer: "saved" });
  });

  it.each([
    ["already answered", { plateSetup: "saved" }, 0],
    ["has saved plates", { plateSetup: null }, 1]
  ])("is not shown when the user %s", async (_label, extra, plateCount) => {
    stubServer({ me: () => ({ id: "u1", username: "alice", locale: "hu", profile: { ...onboarded, ...extra }, _count: { plates: plateCount } }) });
    await login();
    await screen.findByText("Napi áttekintés");
    expect(screen.queryByText(hu.title)).toBeNull();
  });

  it("has HU/DE/EN text", () => {
    for (const lang of ["hu", "de", "en"] as const) {
      const t = dict[lang].plateSetup;
      for (const key of ["kicker", "title", "lead", "done", "skip", "later", "failed"] as const) expect(t[key].length).toBeGreaterThan(0);
    }
    expect(dict.de.plateSetup.title).toBe("Welche Teller hast du?");
    expect(dict.en.plateSetup.skip).toBe("I’d rather not say");
  });
});

describe("Tányérjaim (header entry to the saved-plates editor)", () => {
  it("opens the existing plate manager any time and closes again", async () => {
    stubServer({
      me: () => ({ id: "u1", username: "alice", locale: "hu", profile: { ...onboarded, plateSetup: "skipped" }, _count: { plates: 1 } }),
      plates: [{ id: "p1", name: "Mély", kind: "deep", capacityMl: 600, diameterMm: null }]
    });
    await login();
    await screen.findByText("Napi áttekintés");
    fireEvent.click(screen.getByRole("button", { name: dict.hu.myPlates.open }));
    expect(await screen.findByText(/Mély · Mély tányér · 600 ml/)).toBeTruthy();
    expect(screen.getByText("Új tányér")).toBeTruthy();
    expect(screen.queryByText("Kiszámolom")).toBeNull();
    fireEvent.click(screen.getByText(dict.hu.myPlates.close));
    await waitFor(() => expect(screen.queryByText(/Mély · Mély tányér · 600 ml/)).toBeNull());
  });

  it("is not offered before login or before the first setup", async () => {
    stubServer({ me: () => ({ id: "u1", username: "alice", locale: "hu", profile: null }) });
    render(<App/>);
    expect(screen.queryByRole("button", { name: dict.hu.myPlates.open })).toBeNull();
  });

  it("has HU/DE/EN labels", () => {
    expect([dict.hu.myPlates.open, dict.de.myPlates.open, dict.en.myPlates.open]).toEqual(["Tányérjaim", "Meine Teller", "My plates"]);
  });
});
