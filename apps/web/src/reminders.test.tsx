// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { dueReminder, RemindersCard } from "./Reminders";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const at = (h: number, m = 0) => { const d = new Date(2026, 9, 16, h, m); return d; };

describe("Emlékeztetők", () => {
  it("shows the band after the chosen time until that meal is logged", () => {
    const s = { lunchAt: "14:00", dinnerAt: "20:30", timeZone: "Europe/Berlin" };
    expect(dueReminder(s, [], at(13, 59))).toBeNull();
    expect(dueReminder(s, [], at(14, 5))).toBe("lunch");
    expect(dueReminder(s, [{ eatenAt: at(12, 30).toISOString(), mealType: "lunch" }], at(14, 5))).toBeNull();
    expect(dueReminder(s, [{ eatenAt: at(8).toISOString(), mealType: "breakfast" }], at(14, 5))).toBe("lunch");
    expect(dueReminder(s, [{ eatenAt: at(12).toISOString(), mealType: "lunch" }], at(20, 45))).toBe("dinner");
    expect(dueReminder(null, [], at(20, 45))).toBeNull();
  });

  it("saves the chosen times with the browser's time zone and can turn them off", async () => {
    const bodies: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) => { const b = JSON.parse(String(init?.body)); bodies.push(b); return new Response(JSON.stringify({ reminders: b.lunchAt || b.dinnerAt ? b : null }), { status: 200 }); }));
    const onSaved = vi.fn();
    render(<RemindersCard lang="hu" state={state} settings={null} emailConfirmed={false} onSaved={onSaved}/>);
    expect(screen.getByText(/megerősített e-mail cím kell/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Ebéd emlékeztető"));
    fireEvent.change(screen.getByLabelText("Ebéd emlékeztető – Időpont"), { target: { value: "13:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Emlékeztetők mentése" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(bodies[0]).toMatchObject({ lunchAt: "13:30", dinnerAt: null });
    expect(typeof bodies[0].timeZone).toBe("string");
  });
});
