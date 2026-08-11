import { describe, expect, it } from "vitest";
import {
  assertProductionDatabaseSchema,
  databaseSchemaFromUrl,
  KETO_MENTOR_DATABASE_SCHEMA
} from "./database-url.js";

describe("production database schema isolation", () => {
  it("accepts the dedicated ketomentor schema", () => {
    const url = "postgresql://user:secret@db.example.test/app?sslmode=require&schema=ketomentor";
    expect(databaseSchemaFromUrl(url)).toBe(KETO_MENTOR_DATABASE_SCHEMA);
    expect(() => assertProductionDatabaseSchema(url, "production")).not.toThrow();
  });

  it("rejects public, missing, and legacy schema values in production", () => {
    const urls = [
      "postgresql://user:secret@db.example.test/app",
      "postgresql://user:secret@db.example.test/app?schema=public",
      "postgresql://user:secret@db.example.test/app?schema=keto_mentor"
    ];

    for (const url of urls) {
      expect(() => assertProductionDatabaseSchema(url, "production")).toThrow(
        "Production DATABASE_URL must select the ketomentor PostgreSQL schema"
      );
    }
  });

  it("does not expose credentials in validation errors", () => {
    const password = "do-not-log-this-password";
    let message = "";
    try {
      assertProductionDatabaseSchema(
        `postgresql://user:${password}@db.example.test/app?schema=public`,
        "production"
      );
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).not.toContain(password);
  });

  it("does not require the production schema for local test databases", () => {
    expect(() =>
      assertProductionDatabaseSchema("postgresql://user:secret@localhost/test", "test")
    ).not.toThrow();
  });
});
