import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { FEEDBACK_RATE_LIMIT, feedbackRouter, formatFeedbackLine } from "./feedback.js";

const servers: any[] = [];
afterEach(() => { for (const s of servers.splice(0)) s.close(); });

async function start() {
  const lines: string[] = [];
  const app = express();
  app.use(express.json());
  // Mirrors requireAuth's contract: 401 without a bearer token; the user id
  // comes from the token, never from the body.
  const requireAuth: express.RequestHandler = (req, res, next) => {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "missing_token" });
    (req as any).user = { id: header.slice(7) === "tok-2" ? "user-2" : "user-1", username: "secret-name", locale: "hu" };
    next();
  };
  app.use(feedbackRouter(requireAuth, (line) => lines.push(line)));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
    res.status(error?.name === "ZodError" ? 400 : 500).json({ error: error?.name === "ZodError" ? "validation_error" : "internal_error" }));
  const server = app.listen(0);
  servers.push(server);
  return { base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, lines };
}

const post = (base: string, body: unknown, token: string | null = "tok-1") => fetch(`${base}/feedback`, {
  method: "POST",
  headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body)
});

describe("POST /feedback", () => {
  it("requires authentication", async () => {
    const { base, lines } = await start();
    expect((await post(base, { message: "hiba" }, null)).status).toBe(401);
    expect(lines).toHaveLength(0);
  });

  it("rejects an empty or too long message", async () => {
    const { base, lines } = await start();
    expect((await post(base, { message: "" })).status).toBe(400);
    expect((await post(base, { message: "   " })).status).toBe(400);
    expect((await post(base, {})).status).toBe(400);
    expect((await post(base, { message: "x".repeat(2001) })).status).toBe(400);
    expect((await post(base, { message: "ok", context: { view: "v".repeat(41) } })).status).toBe(400);
    expect(lines).toHaveLength(0);
    expect((await post(base, { message: "x".repeat(2000) })).status).toBe(201);
  });

  it("writes exactly one escaped line with context and returns the short id", async () => {
    const { base, lines } = await start();
    const response = await post(base, {
      message: "Nem működik\nuser_feedback id=fake user=admin message=\"forged\"\r\nvége \u2028 \"idézet\"",
      context: { view: "today", lang: "hu", build: "main@abc1234", clientTime: "2026-10-13T10:00:00.000Z", lastInput: "2 tojás\nszalonna", operationId: "op-123", password: "hunter2", token: "jwt" }
    }, "tok-1");
    expect(response.status).toBe(201);
    const { id } = await response.json();
    expect(id).toMatch(/^[0-9a-f]{6}$/);
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).not.toMatch(/[\n\r\u2028\u2029]/);
    expect(line.startsWith(`user_feedback id=${id} user=user-1 view="today" lang="hu" build="main@abc1234"`)).toBe(true);
    expect(line).toContain('operationId="op-123"');
    expect(line).toContain('lastInput="2 tojás\\nszalonna"');
    expect(line).toContain('message="Nem működik\\nuser_feedback id=fake user=admin message=\\"forged\\"\\r\\nvége \\u2028 \\"idézet\\""');
    // Only one real key=value prefix: the forged one stays inside the quoted message.
    expect(line.match(/(^| )user_feedback id=/g)).toHaveLength(1);
    expect(line).not.toContain("hunter2");
    expect(line).not.toContain("jwt");
    expect(line).not.toContain("tok-1");
    expect(line).not.toContain("secret-name");
  });

  it("marks an idea in the log line (Ötletem van, 2026-10-15)", async () => {
    const { base, lines } = await start();
    expect((await post(base, { kind: "idea", message: "Legyen sötét mód" })).status).toBe(201);
    expect(lines[0]).toMatch(/^user_feedback id=[0-9a-f]{6} kind=idea user=user-1 /);
    expect((await post(base, { kind: "wish", message: "x" })).status).toBe(400);
  });

  it("marks missing context fields and caps a long last input", () => {
    const line = formatFeedbackLine("abc123", "u1", { kind: "bug", message: "m", context: { lastInput: "y".repeat(500) } });
    expect(line).toContain('view=- lang=- build=-');
    expect(line).toContain(`lastInput="${"y".repeat(300)}…"`);
  });

  it("rate-limits per user", async () => {
    const { base, lines } = await start();
    for (let i = 0; i < FEEDBACK_RATE_LIMIT.limit; i++) expect((await post(base, { message: `#${i}` })).status).toBe(201);
    expect((await post(base, { message: "too many" })).status).toBe(429);
    expect((await post(base, { message: "other user" }, "tok-2")).status).toBe(201);
    expect(lines).toHaveLength(FEEDBACK_RATE_LIMIT.limit + 1);
  });
});
