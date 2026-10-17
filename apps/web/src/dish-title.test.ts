import { describe, expect, it } from "vitest";
import { dishTitle } from "./food-display-name";

describe("kész étel címe a beállított nyelven", () => {
  const dish = { title: "virsli mustárral", titles: { hu: "virsli mustárral", "de-AT": "Frankfurter mit Senf", en: "Frankfurters with mustard" } };
  it("shows the viewer's language, Austrian German for German, and the stored title otherwise", () => {
    expect(dishTitle(dish, "de")).toBe("Frankfurter mit Senf");
    expect(dishTitle(dish, "en")).toBe("Frankfurters with mustard");
    expect(dishTitle({ title: "Saját lecsóm" }, "de")).toBe("Saját lecsóm");
  });
});
