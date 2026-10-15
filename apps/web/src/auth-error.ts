import { ApiError } from "./api";
import type { Lang } from "./i18n";

const messages: Record<Lang, Record<string, string>> = {

  hu: {
    invalid_credentials: "Hibás felhasználónév, e-mail cím vagy jelszó.",
    username_taken: "Ez a felhasználónév már foglalt.",
    email_taken: "Ezzel az e-mail címmel már van fiók.",
    invalid_or_expired_token: "A link lejárt vagy már felhasználták. Kérj újat.",
    validation_error: "Kérjük, ellenőrizd az űrlap adatait.",
    request_failed: "A kérés nem sikerült. Próbáld újra.",
    too_many: "Túl sok próbálkozás. Várj néhány percet.",
    network_error: "A szerver jelenleg nem érhető el. Próbáld újra később.",
    unknown: "A belépés nem sikerült. Próbáld újra."
  },
  de: {
    invalid_credentials: "Benutzername, E-Mail oder Passwort ist falsch.",
    username_taken: "Dieser Benutzername ist bereits vergeben.",
    email_taken: "Mit dieser E-Mail-Adresse gibt es bereits ein Konto.",
    invalid_or_expired_token: "Der Link ist abgelaufen oder wurde schon verwendet. Fordere einen neuen an.",
    validation_error: "Bitte überprüfe die Eingaben im Formular.",
    request_failed: "Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.",
    too_many: "Zu viele Versuche. Bitte warte einige Minuten.",
    network_error: "Der Server ist derzeit nicht erreichbar. Bitte versuche es später erneut.",
    unknown: "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut."
  },
  en: {
    invalid_credentials: "Incorrect username, e-mail or password.",
    username_taken: "This username is already taken.",
    email_taken: "An account with this e-mail address already exists.",
    invalid_or_expired_token: "The link has expired or was already used. Ask for a new one.",
    validation_error: "Please check the form fields.",
    request_failed: "The request failed. Please try again.",
    too_many: "Too many attempts. Please wait a few minutes.",
    network_error: "The server is currently unavailable. Please try again later.",
    unknown: "Authentication failed. Please try again."
  }
};

export function authErrorText(error: unknown, lang: Lang) {
  if (!(error instanceof ApiError)) return messages[lang].unknown;
  if (error.status === 429) return messages[lang].too_many;
  return messages[lang][error.code] ?? messages[lang].unknown;
}
