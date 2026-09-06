import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger.js";

function captureLogger() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    }
  });
  const logger = createLogger("info", stream);
  return { logger, output: () => chunks.join("") };
}

describe("request log redaction", () => {
  it("never logs the request cookie header value", () => {
    const { logger, output } = captureLogger();
    logger.info({ req: { headers: { cookie: "km_refresh=SUPER_SECRET_REFRESH_TOKEN" } } }, "request completed");
    expect(output()).not.toContain("SUPER_SECRET_REFRESH_TOKEN");
    expect(output()).toContain("[Redacted]");
  });

  it("never logs the authorization header value", () => {
    const { logger, output } = captureLogger();
    logger.info({ req: { headers: { authorization: "Bearer SUPER_SECRET_ACCESS_TOKEN" } } }, "request completed");
    expect(output()).not.toContain("SUPER_SECRET_ACCESS_TOKEN");
    expect(output()).toContain("[Redacted]");
  });

  it("never logs the response set-cookie header value", () => {
    const { logger, output } = captureLogger();
    logger.info({ res: { headers: { "set-cookie": "km_refresh=SUPER_SECRET_RESPONSE_TOKEN; HttpOnly" } } }, "request completed");
    expect(output()).not.toContain("SUPER_SECRET_RESPONSE_TOKEN");
    expect(output()).toContain("[Redacted]");
  });

  it("still logs useful non-sensitive request metadata", () => {
    const { logger, output } = captureLogger();
    logger.info(
      { req: { method: "GET", url: "/meals/today", headers: { cookie: "km_refresh=x" } }, res: { statusCode: 200 }, responseTime: 5 },
      "request completed"
    );
    const text = output();
    expect(text).toContain("GET");
    expect(text).toContain("/meals/today");
    expect(text).toContain("200");
  });
});
