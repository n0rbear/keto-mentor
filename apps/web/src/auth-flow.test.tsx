
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "./AuthForm";
import type { ApiState } from "./api";

afterEach(() => vi.restoreAllMocks());

function makeState(): ApiState {
  return { token: null, setToken: vi.fn() };
}

function renderForm(state: ApiState = makeState(), onSuccess = vi.fn()) {
  return render(<AuthForm mode="register" lang="en" state={state} onSuccess={onSuccess} />);
}

function mockFetchOnce(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response);
}

describe("AuthForm password validation matches backend schema", () => {
  it("register mode requires a 10+ character password (HTML minLength)", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("auth-mode-register"));
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password.minLength).toBe(10);
  });

  it("login mode does NOT enforce the 10 character registration minimum", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("auth-mode-login"));
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password.minLength).toBe(1);
  });
});

describe("AuthForm submitting state and double-submit prevention", () => {
  it("shows a loading state and disables controls while the request is in flight", async () => {
    const fetchSpy = mockFetchOnce(201, { user: { id: "u1", username: "alice", locale: "en" }, accessToken: "tok" });
    const resolve = { current: false };
    fetchSpy.mockImplementation(() => new Promise<Response>((r) => {
      const tick = () => { if (resolve.current) r({ ok: true, status: 201, json: async () => ({ user: { id: "u1", username: "alice", locale: "en" }, accessToken: "tok" }) } as Response); else setTimeout(tick, 5); };
      tick();
    }));

    renderForm();
    const submit = screen.getByTestId("auth-submit") as HTMLButtonElement;
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const username = screen.getByLabelText("Username") as HTMLInputElement;

    fireEvent.change(username, { target: { value: "alice" } });
    fireEvent.change(password, { target: { value: "supersecret" } });
    fireEvent.click(submit);

    await waitFor(() => expect(submit.disabled).toBe(true));
    const loginSeg = screen.getByTestId("auth-mode-login") as HTMLButtonElement;
    expect(loginSeg.disabled).toBe(true);

    resolve.current = true;
    await waitFor(() => expect(submit.disabled).toBe(false));
  });

  it("prevents a second submission while the first is still pending", async () => {
    const fetchSpy = mockFetchOnce(201, { user: { id: "u1", username: "alice", locale: "en" }, accessToken: "tok" });
    let calls = 0;
    fetchSpy.mockImplementation(() => {
      calls += 1;
      return new Promise<Response>((resolve) => setTimeout(() => resolve({ ok: true, status: 201, json: async () => ({ user: { id: "u1", username: "alice", locale: "en" }, accessToken: "tok" }) } as Response), 50));
    });

    renderForm();
    const submit = screen.getByTestId("auth-submit") as HTMLButtonElement;
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const username = screen.getByLabelText("Username") as HTMLInputElement;

    fireEvent.change(username, { target: { value: "alice" } });
    fireEvent.change(password, { target: { value: "supersecret" } });

    fireEvent.click(submit);
    fireEvent.click(submit); // immediate second click

    expect(calls).toBe(1);
  });
});

describe("AuthForm invalid credentials UX", () => {
  it("displays a localized error message for invalid credentials", async () => {
    mockFetchOnce(401, { error: "invalid_credentials" });

    renderForm();
    const submit = screen.getByTestId("auth-submit") as HTMLButtonElement;
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const username = screen.getByLabelText("Username") as HTMLInputElement;

    fireEvent.change(username, { target: { value: "alice" } });
    fireEvent.change(password, { target: { value: "supersecret" } });
    fireEvent.click(submit);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Incorrect username or password.");
    expect(submit.disabled).toBe(false);
  });

  it("shows the network error message when the request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    renderForm();
    const submit = screen.getByTestId("auth-submit") as HTMLButtonElement;
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const username = screen.getByLabelText("Username") as HTMLInputElement;

    fireEvent.change(username, { target: { value: "alice" } });
    fireEvent.change(password, { target: { value: "supersecret" } });
    fireEvent.click(submit);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("The server is currently unavailable. Please try again later.");
  });
});