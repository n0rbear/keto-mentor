import { describe, expect, it } from "vitest";
import { pickDisplayName } from "./food-display-name";

describe("pickDisplayName: locale -> English -> originalName -> name fallback chain", () => {
  it("prefers the exact locale's name when present", () => {
    expect(pickDisplayName({ name: "Pork hock", originalName: "Pork hock", names: { en: "Pork hock", hu: "Sertéscsülök", de: "Schweinshaxe" } }, "hu")).toBe("Sertéscsülök");
    expect(pickDisplayName({ name: "Pork hock", originalName: "Pork hock", names: { en: "Pork hock", hu: "Sertéscsülök", de: "Schweinshaxe" } }, "de")).toBe("Schweinshaxe");
  });

  it("falls back to the English name — an honest fallback, never a fabricated translation — when the locale is missing", () => {
    expect(pickDisplayName({ name: "Pork hock", originalName: "Pork hock", names: { en: "Pork hock" } }, "hu")).toBe("Pork hock");
  });

  it("falls back to originalName when there is no names map at all", () => {
    expect(pickDisplayName({ name: "Pork hock (fallback)", originalName: "Pork hock" }, "hu")).toBe("Pork hock");
  });

  it("falls back to the plain name field as the last resort", () => {
    expect(pickDisplayName({ name: "Pork hock" }, "hu")).toBe("Pork hock");
  });

  it("never throws on null/undefined — returns an empty string", () => {
    expect(pickDisplayName(null, "hu")).toBe("");
    expect(pickDisplayName(undefined, "hu")).toBe("");
  });

  it("English UI shows the authoritative English name directly", () => {
    expect(pickDisplayName({ name: "Pork hock", originalName: "Pork hock", names: { en: "Pork hock", hu: "Sertéscsülök" } }, "en")).toBe("Pork hock");
  });
});
