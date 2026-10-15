import { afterEach, describe, expect, it, vi } from "vitest";
import { dueReminders, localClock, runReminders } from "./reminders.js";
import { resetSettingsForTests } from "../admin/runtime-settings.js";

afterEach(() => resetSettingsForTests());
const r = { lunchAt: "14:00", dinnerAt: "20:30", timeZone: "Europe/Berlin" };

describe("emlékeztetők", () => {
  it("reads the local clock in the user's time zone, DST included", () => {
    expect(localClock(new Date("2026-10-16T12:05:00Z"), "Europe/Berlin")).toEqual({ date: "2026-10-16", minutes: 14 * 60 + 5 });
    expect(localClock(new Date("2026-12-16T12:05:00Z"), "Europe/Berlin")).toEqual({ date: "2026-12-16", minutes: 13 * 60 + 5 });
  });

  it("is due after the chosen time, within two hours, once a day", () => {
    expect(dueReminders(r, new Date("2026-10-16T11:59:00Z"))).toEqual([]);
    expect(dueReminders(r, new Date("2026-10-16T12:10:00Z"))).toEqual([{ kind: "lunch", date: "2026-10-16" }]);
    expect(dueReminders(r, new Date("2026-10-16T14:30:00Z"))).toEqual([]);
    expect(dueReminders({ ...r, lastSent: { lunch: "2026-10-16" } }, new Date("2026-10-16T12:10:00Z"))).toEqual([]);
    expect(dueReminders({ ...r, timeZone: "Mars/Base" }, new Date("2026-10-16T12:10:00Z"))).toEqual([]);
  });

  it("e-mails only confirmed users who have not logged that meal, and records the day", async () => {
    const updates: any[] = [];
    const prisma = {
      profile: {
        findMany: vi.fn(async () => [
          { userId: "a", reminders: r, user: { email: "a@x.hu", emailVerifiedAt: new Date(), locale: "hu", entitlements: [] } },
          { userId: "b", reminders: r, user: { email: "b@x.hu", emailVerifiedAt: new Date(), locale: "hu", entitlements: [] } },
          { userId: "c", reminders: r, user: { email: "c@x.hu", emailVerifiedAt: null, locale: "hu", entitlements: [] } }
        ]),
        update: vi.fn(async (args: any) => { updates.push(args); })
      },
      meal: { findMany: vi.fn(async ({ where }: any) => where.userId === "b" ? [{ eatenAt: new Date("2026-10-16T10:30:00Z"), mealType: "lunch" }] : []) }
    };
    const send = vi.fn(async () => ({ outcome: "sent" as const }));
    const sent = await runReminders({ prisma, mailer: { send }, webAppUrl: "https://ketomentor.norbapp.com", admins: [], now: () => new Date("2026-10-16T12:10:00Z"), log: () => undefined });
    expect(sent).toBe(1);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "a@x.hu", subject: "Még nem rögzítetted az ebédet" }));
    expect(updates.map((u) => [u.where.userId, u.data.reminders.lastSent])).toEqual([["a", { lunch: "2026-10-16" }], ["b", { lunch: "2026-10-16" }]]);
  });
});
