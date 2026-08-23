process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

const { signRefreshToken, verifyRefreshToken } = await import("./auth.js");

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

describe("verifyRefreshToken payload validation", () => {
  it("accepts a valid new payload with sessionId + secret", () => {
    const token = jwt.sign({ sessionId: "sess_1", secret: "abc" }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "keto-mentor",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(token)).toEqual({ sessionId: "sess_1", secret: "abc" });
  });

  it("rejects a legacy signed token carrying only { sessionId }", () => {
    const legacy = jwt.sign({ sessionId: "sess_1" }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "keto-mentor",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(legacy)).toBeNull();
  });

  it("rejects a token missing sessionId", () => {
    const token = jwt.sign({ secret: "abc" }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "keto-mentor",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(token)).toBeNull();
  });

  it("rejects a token missing secret", () => {
    const token = jwt.sign({ sessionId: "sess_1" }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "keto-mentor",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(token)).toBeNull();
  });

  it("rejects wrong-typed fields (numbers)", () => {
    const token = jwt.sign({ sessionId: 123, secret: 456 }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "keto-mentor",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(token)).toBeNull();
  });

  it("rejects empty-string fields", () => {
    const token = jwt.sign({ sessionId: "", secret: "" }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "keto-mentor",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(token)).toBeNull();
  });

  it("rejects a tampered/invalid signature", () => {
    const token = signRefreshToken("sess_1", "abc") + "tamper";
    expect(verifyRefreshToken(token)).toBeNull();
  });

  it("rejects a token signed with the wrong audience", () => {
    const token = jwt.sign({ sessionId: "sess_1", secret: "abc" }, REFRESH_SECRET, {
      expiresIn: "30d",
      audience: "evil",
      issuer: "keto-mentor-api"
    });
    expect(verifyRefreshToken(token)).toBeNull();
  });
});