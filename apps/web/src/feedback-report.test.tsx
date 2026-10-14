// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeedbackReport } from "./FeedbackReport";
import { dict } from "./i18n";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const t = dict.hu.feedback;
const context = () => ({ view: "dashboard", lastInput: "2 tojás szalonnával", operationId: "op-42" });

function stubFetch(feedbackResponse: () => Response) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.endsWith("/build-info")) return new Response(JSON.stringify({ environment: "staging", branch: "main", commit: "abc1234", bootedAt: "x" }), { status: 200 });
    return feedbackResponse();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPanel() {
  render(<FeedbackReport lang="hu" state={{ token: "secret-token", setToken: vi.fn() }} getContext={context}/>);
  fireEvent.click(screen.getByRole("button", { name: t.open }));
  return screen.getByPlaceholderText(t.placeholder) as HTMLTextAreaElement;
}

describe("FeedbackReport", () => {
  it("opens a panel with a counter and closes on cancel without sending", () => {
    const fetchMock = stubFetch(() => new Response("{}", { status: 201 }));
    const textarea = renderPanel();
    expect(screen.getByRole("dialog", { name: t.title })).toBeTruthy();
    expect(textarea.maxLength).toBe(2000);
    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(screen.getByText("5/2000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: t.cancel }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the text with context and keeps the ticket id visible until closed", async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify({ id: "abc123" }), { status: 201 }));
    const textarea = renderPanel();
    expect((screen.getByRole("button", { name: t.send }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(textarea, { target: { value: "A mentés nem működött" } });
    fireEvent.click(screen.getByRole("button", { name: t.send }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Hibajegy: #abc123"));
    // Owner report 6c6ae5: a timed toast was missed — the confirmation stays
    // inside the open panel until the user dismisses it.
    expect(screen.getByRole("dialog", { name: t.title })).toBeTruthy();
    expect(screen.queryByPlaceholderText(t.placeholder)).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole("status").textContent).toContain("#abc123");
    fireEvent.click(screen.getAllByRole("button", { name: t.close }).at(-1)!);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();

    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/feedback"))!;
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.message).toBe("A mentés nem működött");
    expect(body.context).toMatchObject({ view: "dashboard", lang: "hu", build: "main@abc1234 staging", lastInput: "2 tojás szalonnával", operationId: "op-42" });
    expect(typeof body.context.clientTime).toBe("string");
    // The token travels only as the Authorization header, never in the report.
    expect(JSON.stringify(body)).not.toContain("secret-token");
  });

  it("keeps the text and shows an error when sending fails", async () => {
    stubFetch(() => new Response(JSON.stringify({ error: "internal_error" }), { status: 500 }));
    const textarea = renderPanel();
    fireEvent.change(textarea, { target: { value: "Nem ment" } });
    fireEvent.click(screen.getByRole("button", { name: t.send }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(t.failed));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect((screen.getByPlaceholderText(t.placeholder) as HTMLTextAreaElement).value).toBe("Nem ment");
  });

  it("tells the user when the rate limit is hit", async () => {
    stubFetch(() => new Response(JSON.stringify({ error: "too_many" }), { status: 429 }));
    const textarea = renderPanel();
    fireEvent.change(textarea, { target: { value: "Megint" } });
    fireEvent.click(screen.getByRole("button", { name: t.send }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(t.rateLimited));
  });
});
