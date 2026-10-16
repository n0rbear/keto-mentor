// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminPage } from "./AdminPage";
import { captureCampaignRef, currentCampaignRef } from "./campaign-ref";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("kampánylinkek – látogató", () => {
  it("counts a ?ref= visit once per session, cleans the address and remembers the code for 30 days", async () => {
    const calls: Array<[string, string]> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => { calls.push([String(url), String(init.body)]); return new Response(null, { status: 204 }); }));
    window.history.replaceState(null, "", "/?ref=tiktok&lang=de");
    captureCampaignRef();
    captureCampaignRef(); // same session, reload
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0][0]).toContain("/public/ref");
    expect(JSON.parse(calls[0][1])).toEqual({ code: "tiktok" });
    expect(window.location.search).toBe("?lang=de");
    expect(currentCampaignRef()).toBe("tiktok");
    expect(currentCampaignRef(Date.now() + 31 * 24 * 60 * 60 * 1000)).toBeUndefined();
  });

  it("ignores malformed codes", () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState(null, "", "/?ref=%3Cscript%3E");
    captureCampaignRef();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(currentCampaignRef()).toBeUndefined();
  });
});

describe("kampánylinkek – admin", () => {
  it("lists links with clicks and registrations and creates a new one", async () => {
    const links = [{ code: "tiktok", label: "TikTok", createdAt: "2026-10-16", visits: { total: 40, last30: 30 }, signups: { total: 10, last30: 8 } }];
    const posted: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
      if (String(url).endsWith("/admin/campaign-links") && init.method === "POST") { posted.push(String(init.body)); links.push({ code: "keto-csoport", label: "Keto csoport", createdAt: "2026-10-16", visits: { total: 0, last30: 0 }, signups: { total: 0, last30: 0 } }); return json({}, 201); }
      if (String(url).endsWith("/admin/campaign-links")) return json({ links });
      return json({}, 404);
    }));
    render(<AdminPage state={{ token: "t", setToken: () => undefined }}/>);
    fireEvent.click(screen.getByRole("tab", { name: "Linkek" }));
    expect(await screen.findByText("https://ketomentor.norbapp.com/?ref=tiktok")).toBeTruthy();
    expect(screen.getByText("30 / 40")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Új link neve"), { target: { value: "Keto csoport" } });
    fireEvent.click(screen.getByRole("button", { name: "Link létrehozása" }));
    expect(await screen.findByText("https://ketomentor.norbapp.com/?ref=keto-csoport")).toBeTruthy();
    expect(JSON.parse(posted[0])).toEqual({ label: "Keto csoport" });
  });
});
