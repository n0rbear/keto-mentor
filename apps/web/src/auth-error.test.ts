import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { authErrorText } from "./auth-error";

describe("auth error feedback", () => {
  it("shows localized invalid credential feedback", () => {
    const error = new ApiError("invalid_credentials", 401);
    expect(authErrorText(error, "hu")).toBe("Hibás felhasználónév, e-mail cím vagy jelszó.");
    expect(authErrorText(error, "de")).toBe("Benutzername, E-Mail oder Passwort ist falsch.");
    expect(authErrorText(error, "en")).toBe("Incorrect username, e-mail or password.");
  });

  it("falls back safely for unknown errors", () => {
    expect(authErrorText(new Error("boom"), "hu")).toBe("A belépés nem sikerült. Próbáld újra.");
  });
});
