import { describe, expect, it } from "vitest";
import { FOOD_NLP_SYSTEM_INSTRUCTION } from "./food-nlp-prompt.js";

// Owner-beta blocker (2026-09-12): a static guard on the two real fixes made
// to this instruction — every other test that exercises food understanding
// uses a fixture AiProvider that never actually reads the instruction text,
// so a future accidental revert here would go unnoticed by anything else.
describe("FOOD_NLP_SYSTEM_INSTRUCTION", () => {
  it("teaches the dishIsComposition field and its explicit composition cues", () => {
    expect(FOOD_NLP_SYSTEM_INSTRUCTION).toContain("dishIsComposition");
    expect(FOOD_NLP_SYSTEM_INSTRUCTION).toContain("a következőkből");
    expect(FOOD_NLP_SYSTEM_INSTRUCTION).toContain("bestehend aus");
    expect(FOOD_NLP_SYSTEM_INSTRUCTION.toLowerCase()).toContain("made from");
    expect(FOOD_NLP_SYSTEM_INSTRUCTION.toLowerCase()).toContain("must not also appear as a separate item");
  });

  it("teaches that a product category (sauce/dressing/...) must be preserved, never simplified to its base ingredient", () => {
    expect(FOOD_NLP_SYSTEM_INSTRUCTION).toContain("tejfölös szósz");
    expect(FOOD_NLP_SYSTEM_INSTRUCTION.toLowerCase()).toContain("never simplified down to just");
  });
});
