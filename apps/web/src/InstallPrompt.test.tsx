// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { InstallPrompt } from "./InstallPrompt";
import { dict, type Lang } from "./i18n";

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", { value: vi.fn().mockReturnValue({ matches }), configurable: true });
}
function setUserAgent(ua: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
}

const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const DESKTOP_CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
const FIREFOX_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  Reflect.deleteProperty(window, "matchMedia");
  Object.defineProperty(navigator, "standalone", { value: undefined, configurable: true });
});

describe("InstallPrompt", () => {
  it("renders nothing when the app is already running standalone", () => {
    setMatchMedia(true);
    setUserAgent(IOS_UA);
    render(<InstallPrompt lang="en"/>);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("renders nothing for a browser with neither beforeinstallprompt support nor iOS (e.g. Firefox)", () => {
    setMatchMedia(false);
    setUserAgent(FIREFOX_UA);
    render(<InstallPrompt lang="en"/>);
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByText(dict.en.pwa.iosInstructions)).toBeNull();
  });

  it("shows iOS Add-to-Home-Screen instructions on iOS Safari, with no Install button", () => {
    setMatchMedia(false);
    setUserAgent(IOS_UA);
    render(<InstallPrompt lang="en"/>);
    expect(screen.getByText(dict.en.pwa.iosInstructions)).toBeTruthy();
    expect(screen.queryByRole("button", { name: dict.en.pwa.installButton })).toBeNull();
  });

  it("does not show iOS instructions on a non-iOS browser even without beforeinstallprompt", () => {
    setMatchMedia(false);
    setUserAgent(DESKTOP_CHROME_UA);
    render(<InstallPrompt lang="en"/>);
    expect(screen.queryByText(dict.en.pwa.iosInstructions)).toBeNull();
  });

  it("shows an Install button and triggers the captured beforeinstallprompt on click", async () => {
    setMatchMedia(false);
    setUserAgent(DESKTOP_CHROME_UA);
    render(<InstallPrompt lang="en"/>);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: "accepted" as const });
    const event = new Event("beforeinstallprompt", { cancelable: true }) as any;
    event.prompt = prompt;
    event.userChoice = userChoice;
    fireEvent(window, event);

    const installButton = await screen.findByRole("button", { name: dict.en.pwa.installButton });
    fireEvent.click(installButton);
    await userChoice;
    expect(prompt).toHaveBeenCalled();
  });

  it("dismissing persists locally so the prompt does not reappear on a fresh mount", () => {
    setMatchMedia(false);
    setUserAgent(IOS_UA);
    const { unmount } = render(<InstallPrompt lang="en"/>);
    fireEvent.click(screen.getByRole("button", { name: dict.en.pwa.installDismiss }));
    expect(screen.queryByText(dict.en.pwa.iosInstructions)).toBeNull();
    unmount();
    render(<InstallPrompt lang="en"/>);
    expect(screen.queryByText(dict.en.pwa.iosInstructions)).toBeNull();
  });

  it.each(["hu", "de", "en"] as const)("renders localized iOS instructions for %s", (lang: Lang) => {
    setMatchMedia(false);
    setUserAgent(IOS_UA);
    render(<InstallPrompt lang={lang}/>);
    expect(screen.getByText(dict[lang].pwa.iosInstructions)).toBeTruthy();
    expect(screen.getByText(dict[lang].pwa.installTitle)).toBeTruthy();
  });
});
