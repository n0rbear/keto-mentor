// @vitest-environment jsdom
// Tester release (2026-10-15): mandatory source attribution (BLS CC BY 4.0)
// and the privacy notice with self-service account deletion.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LegalFooter, LegalPageView, legalPageFromHash } from "./LegalPages";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "tok", setToken: vi.fn() };

describe("legal pages", () => {
  it("maps the footer hashes", () => {
    render(<LegalFooter lang="hu"/>);
    expect(screen.getByRole("link", { name: "Források és licencek" }).getAttribute("href")).toBe("#forrasok");
    expect(screen.getByRole("link", { name: "Adatvédelmi tájékoztató" }).getAttribute("href")).toBe("#adatvedelem");
    expect(legalPageFromHash("#forrasok")).toBe("sources");
    expect(legalPageFromHash("#adatvedelem")).toBe("privacy");
    expect(legalPageFromHash("#reset=abc")).toBeNull();
  });

  it.each(["hu", "de", "en"] as const)("credits BLS exactly as its licence requires (%s)", (lang) => {
    render(<LegalPageView page="sources" lang={lang} state={state} signedIn={false} onClose={vi.fn()} onAccountDeleted={vi.fn()}/>);
    expect(document.body.textContent).toContain("Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0.");
    expect(screen.getByRole("link", { name: /CC BY 4\.0/ }).getAttribute("href")).toMatch(/^https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//);
    expect(screen.getByRole("link", { name: /ODbL/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /CC0/ })).toBeTruthy();
  });

  it.each([["hu", "Ország: Németország"], ["de", "Land: Deutschland"], ["en", "Country: Germany"]] as const)("names the controller (%s) and shows no deletion form when signed out", (lang, country) => {
    render(<LegalPageView page="privacy" lang={lang} state={state} signedIn={false} onClose={vi.fn()} onAccountDeleted={vi.fn()}/>);
    expect(document.body.textContent).toContain("Norbert Horváth");
    expect(document.body.textContent).toContain("norbert@norbapp.com");
    expect(document.body.textContent).toContain(country);
    expect(document.body.textContent).not.toContain("⚠");
    expect(document.body.textContent).toContain("OpenAI");
    expect(screen.queryByRole("form", { name: "Fiók törlése" })).toBeNull();
  });

  it("deletes the account only after the confirmation box and the password", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { calls.push([String(input), init]); return new Response(null, { status: 204 }); }));
    const onDeleted = vi.fn();
    render(<LegalPageView page="privacy" lang="hu" state={state} signedIn onClose={vi.fn()} onAccountDeleted={onDeleted}/>);
    const button = screen.getByRole("button", { name: "Fiók végleges törlése" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Jelenlegi jelszó"), { target: { value: "titok" } });
    fireEvent.click(screen.getByLabelText("Megértettem, véglegesen törlöm a fiókomat"));
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(calls[0][0]).toMatch(/\/me$/);
    expect(calls[0][1].method).toBe("DELETE");
    expect(JSON.parse(calls[0][1].body)).toEqual({ currentPassword: "titok" });
  });
});
