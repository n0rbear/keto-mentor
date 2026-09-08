// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MobileNav, pickActiveSection } from "./MobileNav";
import { dict, type Lang } from "./i18n";

afterEach(() => cleanup());

const SECTIONS = [{ id: "today", top: 0 }, { id: "log-meal", top: 900 }, { id: "recipes", top: 1800 }];

describe("pickActiveSection", () => {
  it("picks the first destination before any scrolling (all tops below the activation line)", () => {
    expect(pickActiveSection(SECTIONS)).toBe("today");
  });

  it("picks the last destination whose top has crossed above the activation line", () => {
    const scrolledPastToday = [{ id: "today", top: -820 }, { id: "log-meal", top: 80 }, { id: "recipes", top: 980 }];
    expect(pickActiveSection(scrolledPastToday)).toBe("log-meal");
  });

  it("stays on the final destination once scrolled past every section — even a very tall one — rather than reverting to the default", () => {
    // Scrolled to the very bottom of the page: every section's top is far
    // above the viewport. A naive "isIntersecting" check would find nothing
    // intersecting here and never update away from the initial default.
    const scrolledToBottom = [{ id: "today", top: -3000 }, { id: "log-meal", top: -2000 }, { id: "recipes", top: -600 }];
    expect(pickActiveSection(scrolledToBottom)).toBe("recipes");
  });

  it("returns the first id as a safe fallback for an empty list", () => {
    expect(pickActiveSection([])).toBeNull();
  });
});

describe("MobileNav", () => {
  it("renders exactly the three product destinations as anchor links", () => {
    render(<MobileNav lang="en"/>);
    const nav = screen.getByRole("navigation");
    const links = nav.querySelectorAll("a");
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute("href")).toBe("#today");
    expect(links[1].getAttribute("href")).toBe("#log-meal");
    expect(links[2].getAttribute("href")).toBe("#recipes");
  });

  it("marks Today as active by default", () => {
    render(<MobileNav lang="en"/>);
    const todayLink = screen.getByText(dict.en.nav.today).closest("a")!;
    expect(todayLink.getAttribute("aria-current")).toBe("page");
  });

  it.each(["hu", "de", "en"] as const)("renders localized destination labels for %s", (lang: Lang) => {
    render(<MobileNav lang={lang}/>);
    expect(screen.getByText(dict[lang].nav.today)).toBeTruthy();
    expect(screen.getByText(dict[lang].nav.log)).toBeTruthy();
    expect(screen.getByText(dict[lang].nav.recipes)).toBeTruthy();
  });
});
