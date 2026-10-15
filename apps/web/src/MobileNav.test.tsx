// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MobileMenu, MobileNav, MOBILE_VIEW_LABELS } from "./MobileNav";
import type { Lang } from "./i18n";

afterEach(() => cleanup());

describe("MobileNav (bottom bar)", () => {
  it("switches between the four main parts and marks the active one", () => {
    const onSelect = vi.fn();
    render(<MobileNav lang="hu" active="today" onSelect={onSelect}/>);
    const buttons = screen.getByRole("navigation").querySelectorAll("button");
    expect([...buttons].map((b) => b.textContent)).toEqual(["Ma", "Rögzítés", "Vacsora", "Receptek"]);
    expect(buttons[0].getAttribute("aria-current")).toBe("page");
    fireEvent.click(buttons[2]);
    expect(onSelect).toHaveBeenCalledWith("dinner");
  });
});

describe("MobileMenu (header drop-down)", () => {
  it("lists every part, marks premium, selects and closes", () => {
    const onSelect = vi.fn();
    render(<MobileMenu lang="hu" active="today" onSelect={onSelect}/>);
    fireEvent.click(screen.getByRole("button", { name: "Menü" }));
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Ma", "Rögzítés", "Heti áttekintés", "VacsoraajánlóPrémium", "Heti étrendtervPrémium", "Receptek", "Prémium – hamarosan", "Ötletem van"]);
    fireEvent.click(items[2]);
    expect(onSelect).toHaveBeenCalledWith("week");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes on Escape", () => {
    render(<MobileMenu lang="en" active="today" onSelect={() => undefined}/>);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it.each(["hu", "de", "en"] as const)("has labels for %s", (lang: Lang) => {
    expect(Object.values(MOBILE_VIEW_LABELS[lang]).every(Boolean)).toBe(true);
  });
});
