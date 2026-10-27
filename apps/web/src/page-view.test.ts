import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn().mockResolvedValue({});
vi.mock("./api", () => ({ api: (...args: unknown[]) => api(...args) }));

describe("reportPageView", () => {
  beforeEach(() => api.mockClear());

  it("reports a view once a minute at most", async () => {
    const { reportPageView } = await import("./page-view");
    reportPageView("week", 1_000);
    reportPageView("week", 30_000);
    reportPageView("stats", 30_000);
    reportPageView("week", 62_000);
    expect(api.mock.calls.map((c) => JSON.parse((c[1] as { body: string }).body).view)).toEqual(["week", "stats", "week"]);
    expect(api.mock.calls[0][0]).toBe("/public/pageview");
  });
});
