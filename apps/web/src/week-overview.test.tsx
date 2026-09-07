// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WeekOverviewCard, type WeekOverviewData } from "./WeekOverview";

afterEach(() => cleanup());

const labels = { previousWeek: "Previous week", nextWeek: "Next week", heading: "Week overview", loggedDaysSuffix: "days logged", mealsLabel: "meals" };

const week: WeekOverviewData = {
  weekStart: "2026-09-07",
  weekEnd: "2026-09-13",
  days: [
    { date: "2026-09-07", mealCount: 2, kcal: 1500, netCarbs: 18, protein: 90, fat: 100, fiber: 20 },
    { date: "2026-09-08", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-09-09", mealCount: 1, kcal: 600, netCarbs: 10, protein: 40, fat: 30, fiber: 5 },
    { date: "2026-09-10", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-09-11", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-09-12", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-09-13", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 }
  ],
  summary: { mealCount: 3, loggedDays: 2 }
};

function baseProps(overrides: Partial<Parameters<typeof WeekOverviewCard>[0]> = {}) {
  return {
    week, lang: "en" as const, selectedDate: "2026-09-09", today: "2026-09-10", isCurrentWeek: false,
    onSelectDate: vi.fn(), onPrevWeek: vi.fn(), onNextWeek: vi.fn(), labels,
    ...overrides
  };
}

describe("WeekOverviewCard", () => {
  it("renders all 7 days, including empty days shown as zeros rather than omitted", () => {
    render(<WeekOverviewCard {...baseProps()}/>);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByText("1500 kcal")).toBeTruthy();
    // Two empty days must both render "0 kcal", not be skipped from the DOM.
    expect(screen.getAllByText("0 kcal").length).toBe(5);
  });

  it("shows the week summary (logged days and total meal count)", () => {
    render(<WeekOverviewCard {...baseProps()}/>);
    expect(screen.getByText(/2 \/ 7 days logged/)).toBeTruthy();
    expect(screen.getByText(/3 meals/)).toBeTruthy();
  });

  it("marks the currently selected day", () => {
    render(<WeekOverviewCard {...baseProps()}/>);
    const selected = screen.getByRole("listitem", { name: /9 September/i });
    expect(selected.getAttribute("aria-current")).toBe("date");
  });

  it("calls onSelectDate when a past/present day is clicked", () => {
    const onSelectDate = vi.fn();
    render(<WeekOverviewCard {...baseProps({ onSelectDate })}/>);
    fireEvent.click(screen.getByRole("listitem", { name: /7 September/i }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-07");
  });

  it("disables days after today and never calls onSelectDate for them", () => {
    const onSelectDate = vi.fn();
    render(<WeekOverviewCard {...baseProps({ today: "2026-09-08", onSelectDate })}/>);
    const future = screen.getByRole("listitem", { name: /9 September/i }) as HTMLButtonElement;
    expect(future.disabled).toBe(true);
    fireEvent.click(future);
    expect(onSelectDate).not.toHaveBeenCalled();
  });

  it("allows today itself (not disabled) even though it is the boundary", () => {
    render(<WeekOverviewCard {...baseProps({ today: "2026-09-09" })}/>);
    const todayCell = screen.getByRole("listitem", { name: /9 September/i }) as HTMLButtonElement;
    expect(todayCell.disabled).toBe(false);
  });

  it("calls onPrevWeek and onNextWeek from the nav buttons", () => {
    const onPrevWeek = vi.fn();
    const onNextWeek = vi.fn();
    render(<WeekOverviewCard {...baseProps({ onPrevWeek, onNextWeek })}/>);
    fireEvent.click(screen.getByLabelText("Previous week"));
    fireEvent.click(screen.getByLabelText("Next week"));
    expect(onPrevWeek).toHaveBeenCalledTimes(1);
    expect(onNextWeek).toHaveBeenCalledTimes(1);
  });

  it("disables the next-week button when already viewing the current week", () => {
    render(<WeekOverviewCard {...baseProps({ isCurrentWeek: true })}/>);
    expect((screen.getByLabelText("Next week") as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps the previous-week button enabled when viewing the current week", () => {
    render(<WeekOverviewCard {...baseProps({ isCurrentWeek: true })}/>);
    expect((screen.getByLabelText("Previous week") as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders nothing in the strip while the week hasn't loaded yet, without crashing", () => {
    render(<WeekOverviewCard {...baseProps({ week: null })}/>);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText("Week overview")).toBeTruthy();
  });

  it.each(["hu", "de", "en"] as const)("renders localized nav labels: %s", (lang) => {
    const localizedLabels = lang === "hu"
      ? { previousWeek: "Előző hét", nextWeek: "Következő hét", heading: "Heti áttekintés", loggedDaysSuffix: "nap naplózva", mealsLabel: "étkezés" }
      : lang === "de"
      ? { previousWeek: "Vorherige Woche", nextWeek: "Nächste Woche", heading: "Wochenübersicht", loggedDaysSuffix: "Tage protokolliert", mealsLabel: "Mahlzeiten" }
      : labels;
    render(<WeekOverviewCard {...baseProps({ lang, labels: localizedLabels })}/>);
    expect(screen.getByText(localizedLabels.heading)).toBeTruthy();
    expect(screen.getByLabelText(localizedLabels.previousWeek)).toBeTruthy();
    expect(screen.getByLabelText(localizedLabels.nextWeek)).toBeTruthy();
  });
});
