// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { dict, type Lang } from "./i18n";
import { UpdateBanner } from "./UpdateBanner";

const { updateServiceWorkerMock, needRefreshState } = vi.hoisted(() => ({
  updateServiceWorkerMock: vi.fn(),
  needRefreshState: { value: false }
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefreshState.value, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: updateServiceWorkerMock
  })
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  updateServiceWorkerMock.mockReset();
  needRefreshState.value = false;
});

describe("UpdateBanner", () => {
  it("renders nothing when no update is available", async () => {
    needRefreshState.value = false;
    render(<UpdateBanner lang="en"/>);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a localized banner and calls updateServiceWorker on click when an update is available", async () => {
    needRefreshState.value = true;
    render(<UpdateBanner lang="en"/>);
    expect(screen.getByText(dict.en.pwa.updateAvailable)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: dict.en.pwa.updateButton }));
    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
  });

  it.each(["hu", "de", "en"] as const)("renders localized update copy for %s", async (lang: Lang) => {
    needRefreshState.value = true;
    render(<UpdateBanner lang={lang}/>);
    expect(screen.getByText(dict[lang].pwa.updateAvailable)).toBeTruthy();
    expect(screen.getByRole("button", { name: dict[lang].pwa.updateButton })).toBeTruthy();
  });
});
