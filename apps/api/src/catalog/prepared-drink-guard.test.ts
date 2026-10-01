import { describe, expect, it } from "vitest";
import { isDryFormOfDrink, wantsPreparedDrink, withoutDryFormsForDrink } from "./prepared-drink-guard.js";

// Live 2026-09-27: "presszó kávé egy csepp tejszínnel" was offered the
// Jacobs "Mokka" OFF product (ground/instant, 385 kcal, 68 g carbs / 100 g).
const espresso = { name: "Beverages, coffee, brewed, espresso, restaurant-prepared", carbsPer100g: 1.67 };
const mokkaProduct = { name: "Mokka", carbsPer100g: 68 };
const instantPowder = { name: "Instantkaffeepulver", carbsPer100g: 26.4 };
const coffeeFromPowder = { name: "Kaffee (Getränk) entkoffeiniert, aus Instantpulver", carbsPer100g: 0 };
const brewedTea = { name: "Tee (Getränk), schwarz", carbsPer100g: 0.3 };
const instantTea = { name: "Instant tea powder, lemon, sweetened", carbsPer100g: 95 };
const bulletproof = { name: "Bulletproof coffee", carbsPer100g: 0.5 };

describe("a prepared drink is never its dry form", () => {
  it("recognises drink intent in HU / DE / EN, but not the dry form or a food made with it", () => {
    for (const identity of ["presszó kávé egy csepp tejszínnel", "espresso", "Kaffee", "cappuccino", "egy bögre tea", "Tee"]) expect(wantsPreparedDrink([identity])).toBe(true);
    for (const identity of ["instant kávé", "őrölt kávé", "Kaffeepulver", "kávépor", "kávés torta", "coffee cake", "tiramisu kávéval és mokka tortával", "teáskanál cukor", "sajt"]) expect(wantsPreparedDrink([identity])).toBe(false);
  });

  it("keeps drinks (also drinks made from powder) and drops powders, beans and carb-dense products", () => {
    expect([espresso, coffeeFromPowder, brewedTea, bulletproof].map(isDryFormOfDrink)).toEqual([false, false, false, false]);
    expect([mokkaProduct, instantPowder, instantTea, { name: "Kaffeebohnen, geröstet", carbsPer100g: 0 }].map(isDryFormOfDrink)).toEqual([true, true, true, true]);
  });

  it("filters only when the user means the drink", () => {
    const all = [espresso, mokkaProduct, instantPowder, coffeeFromPowder];
    expect(withoutDryFormsForDrink(["presszó kávé"], all)).toEqual([espresso, coffeeFromPowder]);
    expect(withoutDryFormsForDrink(["tea"], [brewedTea, instantTea])).toEqual([brewedTea]);
    expect(withoutDryFormsForDrink(["instant kávé"], all)).toEqual(all);
    expect(withoutDryFormsForDrink(["sajt"], all)).toEqual(all);
  });
});
