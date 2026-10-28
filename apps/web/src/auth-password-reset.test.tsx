// @vitest-environment jsdom
// Tester release (2026-10-15): e-mail on registration, "forgot password"
// and the reset link (#reset=<token>).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthForm, resetTokenFromHash } from "./AuthForm";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

const TOKEN = "abcdefghijklmnopqrstuvwxyz012345";
function stub(response: () => Response) {
  const calls: Array<{ url: string; body: any }> = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { calls.push({ url: String(input), body: JSON.parse(String(init?.body ?? "{}")) }); return response(); }));
  return calls;
}
const renderForm = (mode: "login" | "register" = "login") => render(<AuthForm mode={mode} lang="hu" state={{ token: null, setToken: vi.fn() }} onSuccess={vi.fn()}/>);

describe("password reset UI", () => {
  it("sends the e-mail on registration and links the privacy notice", async () => {
    const calls = stub(() => new Response(JSON.stringify({ user: { id: "u", username: "anna", locale: "hu" }, accessToken: "t" }), { status: 201 }));
    renderForm("register");
    expect(screen.getByRole("link", { name: "Adatvédelmi tájékoztató" }).getAttribute("href")).toBe("#adatvedelem");
    fireEvent.change(screen.getByLabelText("Felhasználónév"), { target: { value: "anna" } });
    fireEvent.change(screen.getByLabelText("E-mail cím"), { target: { value: "anna@example.com" } });
    fireEvent.change(screen.getByLabelText("Jelszó"), { target: { value: "supersecret1" } });
    // Without the health-data consent the form is not sent
    fireEvent.click(screen.getByTestId("auth-submit"));
    expect(calls).toHaveLength(0);
    fireEvent.click(screen.getByTestId("health-consent"));
    fireEvent.click(screen.getByTestId("auth-submit"));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].url).toMatch(/\/auth\/register$/);
    expect(calls[0].body).toMatchObject({ username: "anna", email: "anna@example.com", locale: "hu", healthConsent: true });
  });

  it("asks for the e-mail and shows the same neutral answer", async () => {
    const calls = stub(() => new Response(JSON.stringify({ ok: true }), { status: 202 }));
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Elfelejtett jelszó?" }));
    expect(screen.getByRole("heading", { name: "Új jelszó kérése" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("E-mail cím"), { target: { value: "anna@example.com" } });
    fireEvent.click(screen.getByTestId("auth-submit"));
    expect((await screen.findByRole("status")).textContent).toContain("Ha ez az e-mail cím regisztrálva van");
    expect(calls[0]).toMatchObject({ body: { email: "anna@example.com", locale: "hu" } });
    expect(calls[0].url).toMatch(/\/auth\/password-reset\/request$/);
    expect(screen.queryByTestId("auth-submit")).toBeNull();
  });

  it("opens the reset form from the link, saves the new password and returns to login", async () => {
    window.history.replaceState(null, "", `/#reset=${TOKEN}`);
    const calls = stub(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    renderForm();
    expect(screen.getByRole("heading", { name: "Új jelszó beállítása" })).toBeTruthy();
    const password = screen.getByLabelText("Új jelszó (legalább 10 karakter)") as HTMLInputElement;
    expect(password.minLength).toBe(10);
    fireEvent.change(password, { target: { value: "uj-jelszo-123" } });
    fireEvent.click(screen.getByTestId("auth-submit"));
    expect((await screen.findByRole("status")).textContent).toBe("Az új jelszó elmentve. Most jelentkezz be vele.");
    expect(calls[0]).toMatchObject({ body: { token: TOKEN, password: "uj-jelszo-123" } });
    expect(window.location.hash).toBe("");
    expect(screen.getByLabelText("Felhasználónév vagy e-mail")).toBeTruthy();
  });

  it("explains an expired link", async () => {
    window.history.replaceState(null, "", `/#reset=${TOKEN}`);
    stub(() => new Response(JSON.stringify({ error: "invalid_or_expired_token" }), { status: 400 }));
    renderForm();
    fireEvent.change(screen.getByLabelText("Új jelszó (legalább 10 karakter)"), { target: { value: "uj-jelszo-123" } });
    fireEvent.click(screen.getByTestId("auth-submit"));
    expect((await screen.findByRole("alert")).textContent).toBe("A link lejárt vagy már felhasználták. Kérj újat.");
  });

  it("reads only well-formed reset hashes", () => {
    expect(resetTokenFromHash(`#reset=${TOKEN}`)).toBe(TOKEN);
    expect(resetTokenFromHash("#reset=short")).toBeNull();
    expect(resetTokenFromHash("#adatvedelem")).toBeNull();
  });
});
