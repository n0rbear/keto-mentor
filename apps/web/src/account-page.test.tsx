// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccountPage } from "./AccountPage";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const user = { username: "bobby", email: "b@x.hu", emailVerified: false, profile: { goal: "weight_loss", dailyKcal: 1800, dailyNetCarbs: 25, dailyProtein: 110, dailyFat: 130, dailyFiber: 25, avoidedFoods: ["cukor"], allergies: [], preferences: [] } };
const props = () => ({ lang: "hu" as const, state, user, onClose: vi.fn(), onUserChange: vi.fn(), onLangChange: vi.fn(), onShortcut: vi.fn(), onLogout: vi.fn(), onDeleted: vi.fn() });

describe("Fiókom", () => {
  it("changes the password with the current one and shows a wrong-password error", async () => {
    const bodies: any[] = [];
    let first = true;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      bodies.push({ path: new URL(String(input)).pathname, body: JSON.parse(String(init?.body ?? "{}")) });
      if (first) { first = false; return new Response(JSON.stringify({ error: "invalid_credentials" }), { status: 403 }); }
      return new Response(JSON.stringify({ ok: true }));
    }));
    render(<AccountPage {...props()}/>);
    const current = screen.getAllByLabelText("Jelenlegi jelszó")[1];
    fireEvent.change(current, { target: { value: "rossz" } });
    fireEvent.change(screen.getByLabelText("Új jelszó (legalább 10 karakter)"), { target: { value: "uj-jelszo-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Jelszó mentése" }));
    expect(await screen.findByText("A jelenlegi jelszó nem jó.")).toBeTruthy();
    fireEvent.change(current, { target: { value: "jo-jelszo-12" } });
    fireEvent.click(screen.getByRole("button", { name: "Jelszó mentése" }));
    expect(await screen.findByText("A jelszavad megváltozott.")).toBeTruthy();
    expect(bodies[1]).toEqual({ path: "/me/password", body: { currentPassword: "jo-jelszo-12", newPassword: "uj-jelszo-123" } });
  });

  it("saves the profile with all targets and lists, and offers shortcuts and sign-out", async () => {
    let body: any;
    vi.stubGlobal("fetch", vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ profile: body })); }));
    const p = props();
    render(<AccountPage {...p}/>);
    fireEvent.change(screen.getByLabelText("Nettó szénhidrát (g)"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Allergiák (vesszővel)"), { target: { value: "laktóz, dió" } });
    fireEvent.click(screen.getByRole("button", { name: "Profil mentése" }));
    await waitFor(() => expect(p.onUserChange).toHaveBeenCalled());
    expect(body).toMatchObject({ locale: "hu", goal: "weight_loss", dailyNetCarbs: 30, avoidedFoods: ["cukor"], allergies: ["laktóz", "dió"] });
    fireEvent.click(screen.getByRole("button", { name: "Emlékeztetők" }));
    expect(p.onShortcut).toHaveBeenCalledWith("reminders");
    fireEvent.click(screen.getByRole("button", { name: "Kijelentkezés" }));
    expect(p.onLogout).toHaveBeenCalled();
    expect(screen.getByText(/még nincs megerősítve/)).toBeTruthy();
  });
});
