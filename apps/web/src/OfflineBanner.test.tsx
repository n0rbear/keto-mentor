// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { OfflineBanner } from "./OfflineBanner";
import { dict, type Lang } from "./i18n";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  setOnline(true);
});

describe("OfflineBanner", () => {
  it("renders nothing while online", () => {
    setOnline(true);
    render(<OfflineBanner lang="en"/>);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a localized message once the browser goes offline, and hides again when back online", () => {
    setOnline(true);
    render(<OfflineBanner lang="en"/>);
    act(() => { setOnline(false); window.dispatchEvent(new Event("offline")); });
    expect(screen.getByText(dict.en.pwa.offlineMessage)).toBeTruthy();
    act(() => { setOnline(true); window.dispatchEvent(new Event("online")); });
    expect(screen.queryByText(dict.en.pwa.offlineMessage)).toBeNull();
  });

  it("starts already showing the offline state if the browser is offline on mount", () => {
    setOnline(false);
    render(<OfflineBanner lang="en"/>);
    expect(screen.getByText(dict.en.pwa.offlineMessage)).toBeTruthy();
  });

  it.each(["hu", "de", "en"] as const)("renders localized offline copy for %s", (lang: Lang) => {
    setOnline(false);
    render(<OfflineBanner lang={lang}/>);
    expect(screen.getByText(dict[lang].pwa.offlineMessage)).toBeTruthy();
  });
});
