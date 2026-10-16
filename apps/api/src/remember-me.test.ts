process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { describe, expect, it } from "vitest";
const { rememberFromCookie, setRefreshCookie } = await import("./auth.js");

const fakeRes = () => { const cookies: Record<string, { value: string; options: any }> = {}; return { cookies, res: { cookie: (name: string, value: string, options: any) => { cookies[name] = { value, options }; } } as any }; };

describe("Bejelentkezve maradok", () => {
  it("sets a 30-day cookie when remembered and a browser-session cookie otherwise", () => {
    const a = fakeRes(); setRefreshCookie(a.res, "t1");
    expect(a.cookies.km_refresh.options.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
    expect(a.cookies.km_remember.value).toBe("1");
    const b = fakeRes(); setRefreshCookie(b.res, "t2", false);
    expect(b.cookies.km_refresh.options.maxAge).toBeUndefined();
    expect(b.cookies.km_remember).toMatchObject({ value: "0" });
    expect(b.cookies.km_refresh.options.httpOnly).toBe(true);
  });
  it("keeps the choice on refresh", () => {
    expect(rememberFromCookie({ cookies: { km_remember: "0" } } as any)).toBe(false);
    expect(rememberFromCookie({ cookies: {} } as any)).toBe(true);
  });
});
