// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HealthConsentCheckbox, HealthConsentGate } from "./HealthConsent";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "tok", setToken: vi.fn() };

describe("health-data consent", () => {
  it("the sign-up box is required", () => {
    render(<form><HealthConsentCheckbox lang="hu"/></form>);
    const box = screen.getByTestId("health-consent") as HTMLInputElement;
    expect(box.required).toBe(true);
    expect(document.body.textContent).toContain("egészségügyi adatnak");
  });

  it("existing accounts must tick the box before the consent is sent", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { calls.push([String(input), init]); return new Response(JSON.stringify({ healthConsent: true }), { status: 200 }); }));
    const onGiven = vi.fn();
    render(<HealthConsentGate lang="en" state={state} onGiven={onGiven} onLogout={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: "I consent" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(calls).toHaveLength(0);
    fireEvent.click(screen.getByTestId("health-consent"));
    fireEvent.click(screen.getByRole("button", { name: "I consent" }));
    await waitFor(() => expect(onGiven).toHaveBeenCalled());
    expect(calls[0][0]).toMatch(/\/me\/health-consent$/);
    expect(JSON.parse(calls[0][1].body)).toEqual({ consent: true });
  });
});
