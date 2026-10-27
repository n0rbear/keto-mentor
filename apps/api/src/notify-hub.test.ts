import { describe, expect, it, vi } from "vitest";
import { hubNotifier } from "./notify-hub.js";

describe("hubNotifier", () => {
  it("sends nothing without a token", () => {
    const fetchImpl = vi.fn();
    hubNotifier({ token: "" }, { fetchImpl: fetchImpl as any })({ event: "signup", label: "Új regisztráció", on: true, message: "x" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the event to the hub as Keto Mentor", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    hubNotifier({ token: "t0k3n", url: "https://hub.example/api/notify" }, { fetchImpl: fetchImpl as any })({ event: "signup", label: "Új regisztráció", on: true, message: "@anna" });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://hub.example/api/notify");
    expect(init.headers.authorization).toBe("Bearer t0k3n");
    expect(JSON.parse(init.body)).toMatchObject({ site: "keto", siteLabel: "Keto Mentor", event: "signup", label: "Új regisztráció", default: true, message: "@anna" });
  });

  it("only logs when the hub fails", async () => {
    const log = vi.fn();
    const fetchImpl = vi.fn().mockRejectedValue(Object.assign(new Error("down"), { name: "TimeoutError" }));
    hubNotifier({ token: "t" }, { fetchImpl: fetchImpl as any, log })({ event: "feedback", label: "Visszajelzés", on: true, message: "m" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(log).toHaveBeenCalledWith("notify_hub event=feedback failed=TimeoutError");
  });
});

describe("registerWithHub", () => {
  it("announces every event type and retries while the hub is down", async () => {
    const { registerWithHub, KETO_EVENTS } = await import("./notify-hub.js");
    const fetchImpl = vi.fn().mockRejectedValueOnce(new Error("asleep")).mockResolvedValue(new Response(null, { status: 200 }));
    registerWithHub({ token: "t", url: "https://hub.example/api/notify" }, { fetchImpl: fetchImpl as any, log: () => undefined, retryMs: 1 });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [url, init] = fetchImpl.mock.calls[1];
    expect(url).toBe("https://hub.example/api/notify/register");
    const body = JSON.parse(init.body);
    expect(body.site).toBe("keto");
    expect(body.events).toHaveLength(KETO_EVENTS.length);
    expect(body.events[0]).toEqual({ event: "signup", label: "Új regisztráció", default: true });
  });
});
