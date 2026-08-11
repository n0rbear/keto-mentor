import { ApiError } from "./api";
import type { Lang } from "./i18n";

const messages: Record<Lang, Record<string, string>> = {
  hu: {
    invalid_credentials: "Hibás felhasználónév vagy jelszó.",
    username_taken: "Ez a felhasználónév már foglalt.",
    network_error: "A szerver jelenleg nem érhető el. Próbáld újra később.",
    unknown: "A belépés nem sikerült. Próbáld újra."
  },
  de: {
    invalid_credentials: "Benutzername oder Passwort ist falsch.",
    username_taken: "Dieser Benutzername ist bereits vergeben.",
    network_error: "Der Server ist derzeit nicht erreichbar. Bitte versuche es später erneut.",
    unknown: "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut."
  },
  en: {
    invalid_credentials: "Incorrect username or password.",
    username_taken: "This username is already taken.",
    network_error: "The server is currently unavailable. Please try again later.",
    unknown: "Authentication failed. Please try again."
  }
};

export function authErrorText(error: unknown, lang: Lang) {
  if (!(error instanceof ApiError)) return messages[lang].unknown;
  return messages[lang][error.code] ?? messages[lang].unknown;
}
