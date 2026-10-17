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
    ["kájzersmarn", "Kaiserschmarrn"]
  ])("%s → %s", (spoken, expected) => {
    expect(normalizeSpokenDishNames(spoken)).toBe(expected);
  });

  it("leaves ordinary words alone", () => {
    for (const text of ["2 kifli vajjal", "kaszinótojás", "egy pohár kefír", "Käse und Kren", "kenyér", "sajtos kolbász", "Kaiser Semmel"]) {
      expect(normalizeSpokenDishNames(text)).toBe(text);
    }
  });
});
