import { describe, expect, it } from "vitest";
import { normalizeSpokenDishNames } from "./spoken-dish-names.js";

describe("kiejtés szerint leírt ételnevek", () => {
  it.each([
    ["Két kaserkrainer mustárral", "Két Käsekrainer mustárral"],
    ["két kaserkréner mustárral", "két Käsekrainer mustárral"],
    ["2 kézekrájner", "2 Käsekrainer"],
    ["Zwei Käsekreiner mit Senf", "Zwei Käsekrainer mit Senf"],
    ["egy szelet léberkéze", "egy szelet Leberkäse"],
    ["fél svájnszhakszi", "fél Schweinshaxe"],
    ["kájzersmarn", "Kaiserschmarrn"],
    ["Svajpar Frankfurterwürstchen.", "zwei Paar Frankfurterwürstchen."],
    ["zweipaar Wiener", "zwei Paar Wiener"],
    ["drajpár virsli", "drei Paar virsli"]
  ])("%s → %s", (spoken, expected) => {
    expect(normalizeSpokenDishNames(spoken)).toBe(expected);
  });

  it("leaves ordinary words alone", () => {
    for (const text of ["2 kifli vajjal", "kaszinótojás", "egy pohár kefír", "Käse und Kren", "kenyér", "sajtos kolbász", "Kaiser Semmel", "zwei Paar Würstel", "Paprika", "svájci sajt"]) {
      expect(normalizeSpokenDishNames(text)).toBe(text);
    }
  });
});

describe("kész ételek címe minden nyelven", async () => {
  const { referenceTitles } = await import("./local-recipe-lookup.js");
  it("passes on a reference dish's titles, and nothing for a recipe without them", () => {
    expect(referenceTitles({ titles: { hu: "virsli mustárral", de: "Würstchen mit Senf", en: "Frankfurters with mustard", x: 3 } })).toEqual({ hu: "virsli mustárral", de: "Würstchen mit Senf", en: "Frankfurters with mustard" });
    expect(referenceTitles({ referenceVariantId: "a" })).toBeUndefined();
    expect(referenceTitles(null)).toBeUndefined();
  });
});
