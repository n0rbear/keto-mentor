// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EmailPrompt } from "./EmailPrompt";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); sessionStorage.clear(); });

describe("EmailPrompt for accounts without an e-mail (2026-10-15)", () => {
  it("saves the e-mail with the current password", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { calls.push([String(input), init]); return new Response(JSON.stringify({ email: "norbi@example.com" }), { status: 200 }); }));
    const onSaved = vi.fn();
    render(<EmailPrompt lang="hu" state={{ token: "tok", setToken: vi.fn() }} onSaved={onSaved}/>);
    fireEvent.change(screen.getByLabelText("E-mail cím"), { target: { value: "Norbi@Example.com" } });
    fireEvent.change(screen.getByLabelText("Jelenlegi jelszó"), { target: { value: "titok-jelszo" } });
    fireEvent.click(screen.getByRole("button", { name: "Mentés" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("norbi@example.com"));
    expect(calls[0][0]).toMatch(/\/me\/email$/);
    expect(calls[0][1].method).toBe("PUT");
    expect(JSON.parse(calls[0][1].body)).toEqual({ email: "Norbi@Example.com", currentPassword: "titok-jelszo" });
    expect(screen.getByRole("status").textContent).toBe("Az e-mail cím elmentve.");
  });

  it("shows a wrong password and can be postponed for the session", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "invalid_credentials" }), { status: 401 })));
    const state = { token: null, setToken: vi.fn() };
    const { unmount } = render(<EmailPrompt lang="hu" state={state} onSaved={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText("E-mail cím"), { target: { value: "a@b.hu" } });
    fireEvent.change(screen.getByLabelText("Jelenlegi jelszó"), { target: { value: "rossz" } });
    fireEvent.click(screen.getByRole("button", { name: "Mentés" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Hibás felhasználónév, e-mail cím vagy jelszó.");
    fireEvent.click(screen.getByRole("button", { name: "Később" }));
    expect(screen.queryByRole("button", { name: "Mentés" })).toBeNull();
    unmount();
    render(<EmailPrompt lang="hu" state={state} onSaved={vi.fn()}/>);
    expect(screen.queryByRole("button", { name: "Mentés" })).toBeNull();
  });
});
