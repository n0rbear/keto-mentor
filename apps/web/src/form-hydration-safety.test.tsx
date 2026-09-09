// @vitest-environment jsdom
// Regression coverage for a real production bug: submitting a form in the
// brief window before React attaches its onSubmit handler (a hydration
// race — reproduced live via a stale/just-activated service worker) falls
// back to the browser's native form submission. Without an explicit
// method="post", that native submission defaults to GET, appending every
// field — including the password on the auth form — to the URL, where it
// lands in browser history and can reach server access logs. Setting
// method="post" makes that fallback safe (body, not query string) without
// changing any JS-handled submit behavior, since event.preventDefault()
// still runs first in the normal case.
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

function stubRegisterThenOnboarding() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/register") return new Response(JSON.stringify({ user: { id: "u1", username: "newuser", locale: "hu" }, accessToken: "tok" }), { status: 201 });
    if (url.pathname === "/me") return new Response(JSON.stringify({ user: { id: "u1", username: "newuser", locale: "hu", profile: null } }), { status: 200 });
    throw new Error(`Unexpected request: ${url.pathname} ${init?.method ?? "GET"}`);
  }));
}

describe("forms never fall back to a native GET that leaks fields into the URL", () => {
  it("the onboarding form declares method=\"post\"", async () => {
    stubRegisterThenOnboarding();
    render(<App/>);
    fireEvent.click(screen.getByTestId("auth-mode-register"));
    fireEvent.change(screen.getByLabelText("Felhasználónév"), { target: { value: "newuser" } });
    fireEvent.change(screen.getByLabelText("Jelszó"), { target: { value: "supersecret1" } });
    fireEvent.click(screen.getByTestId("auth-submit"));

    await waitFor(() => expect(screen.getByText("Kezdő beállítások")).toBeTruthy());
    const form = screen.getByText("Kezdő beállítások").closest("form");
    expect(form?.getAttribute("method")).toBe("post");
  });
});
