export type Lang = "hu" | "de" | "en";

export const quantityLabels = {
  hu: { estimated: "Becsült mennyiség", aiEstimated: "AI-val becsült mennyiség", range: "Valószínű tartomány", confidence: "Becslési bizonyosság", accept: "Elfogadom", change: "Módosítom", missing: "Mennyit ettél belőle?", gramsRequired: "Hány grammot ettél belőle?", grams: "Elfogyasztott gramm" },
  de: { estimated: "Geschätzte Menge", aiEstimated: "KI-geschätzte Menge", range: "Wahrscheinlicher Bereich", confidence: "Schätzsicherheit", accept: "Akzeptieren", change: "Ändern", missing: "Wie viel hast du davon gegessen?", gramsRequired: "Wie viele Gramm hast du davon gegessen?", grams: "Verzehrte Gramm" },
  en: { estimated: "Estimated amount", aiEstimated: "AI-estimated amount", range: "Likely range", confidence: "Estimate confidence", accept: "Accept", change: "Change", missing: "How much did you eat?", gramsRequired: "How many grams did you eat?", grams: "Grams consumed" }
};

export const dict = {
  hu: {
    app: "Keto Mentor",
    hero: "Egyszerű keto követés, NorbApp módra.",
    lead: "Vezetett célok, érthető napi makrók és gyors étkezésnapló kezdőknek.",
    username: "Felhasználónév",
    password: "Jelszó",
    register: "Regisztráció",
    login: "Belépés",
    logout: "Kilépés",
    today: "Ma",
    diary: {
      previousDay: "Előző nap", nextDay: "Következő nap", selectDate: "Dátum kiválasztása", noMeals: "Ezen a napon nem volt rögzített étkezés.",
      editMeal: "Étkezés szerkesztése", deleteMeal: "Törlés", editTime: "Időpont", removeItem: "Tétel eltávolítása",
      cancel: "Mégse", confirmDelete: "Biztosan törlöd ezt az étkezést?", mealDeleted: "Az étkezés törölve, a napi összesítés frissült.", mealUpdated: "Az étkezés frissítve."
    },
    onboarding: "Kezdő beállítások",
    dashboard: "Napi áttekintés",
    goal: "Fő cél",
    save: "Mentés",
    addMeal: "Étkezés hozzáadása",
    mealName: "Étkezés neve",
    foodName: "Étel",
    quantity: "Mennyiség",
    unit: "Egység",
    serving: "adag",
    savingMeal: "Mentés...",
    mealSaved: "Az étkezés elmentve, a napi összesítés frissült.",
    foodSearch: { label: "Étel keresése", placeholder: "Például: csirkemell", loading: "Keresés...", noResults: "Nincs találat.", hint: "A kereséshez írj be legalább 2 karaktert.", selected: "Kiválasztva" },
    foodUnderstanding: {
      understood: "Így értettem:", aiAssisted: "AI-segített értelmezés", dish: "Étel",
      preparation: "Elkészítés", modifiers: "Kiegészítések", excluded: "Nélküle",
      inferred: "Szokásos összetevő – megerősítés szükséges", trusted: "Megbízható ételadathoz kapcsolva",
      unresolved: "A tápérték még nincs megbízható ételadathoz kapcsolva", needsDetail: "Pontosítás szükséges.",
      conversionMissing: "Az étel megvan, de ehhez a mértékhez nincs hiteles grammsúly. Add meg kézzel a grammot.",
      review: "Ellenőrizd és válaszd ki a megfelelő ételt.", verified: "ellenőrzött", estimated: "becsült", logAll: "Összes naplózása"
    },
    mealErrors: { selectFood: "Válassz ételt a találati listából.", network_error: "Az API nem érhető el. Ellenőrizd a kapcsolatot; ezt CORS vagy hálózati hiba is okozhatja.", validation_error: "Ellenőrizd az étkezés nevét és a mennyiséget.", food_not_found: "A kiválasztott étel már nem található. Keress rá újra.", unauthorized: "A munkamenet lejárt. Jelentkezz be újra.", server: "A szerver nem tudta elmenteni az étkezést. Próbáld meg később.", unknown: "Az étkezést nem sikerült elmenteni.", meal_not_found: "Ez az étkezés már nem található.", meal_item_not_found: "Ez a tétel már nem található ebben az étkezésben.", meal_items_empty: "Egy étkezésben legalább egy tételnek maradnia kell — inkább töröld az egész étkezést.", future_eaten_at: "Az időpont nem lehet a jövőben." },
    disclaimer: "A Keto Mentor tájékoztató jellegű étkezéskövető. Nem diagnosztizál, nem kezel betegséget, és egészségügyi döntéshez kérj szakembert.",
    explain: "A nettó szénhidrát a szénhidrát mínusz rost. Kezdőként ezt érdemes figyelni, de a teljes ételminőség is számít.",
    goals: {
      weight_loss: "Testsúly csökkentése",
      maintenance: "Testsúly megtartása",
      energy: "Energiaszint támogatása",
      medical_support: "Orvosi javaslat támogatása",
      learning: "Keto alapok megtanulása"
    },
    fields: {
      dailyKcal: ["Napi kalóriacél", "A teljes napi energiakeret kilokalóriában. Példa: 1800 kcal."],
      dailyNetCarbs: ["Nettó szénhidrát cél", "A szénhidrát mínusz rost napi célja grammban. Kezdő keto cél gyakran 20-30 g."],
      dailyProtein: ["Fehérjecél", "Napi fehérjecél grammban. Példa: 110 g."],
      dailyFat: ["Zsírcél", "Napi zsírcél grammban. Példa: 130 g."],
      dailyFiber: ["Rostcél", "Napi rostcél grammban. Példa: 25 g."],
      preferences: ["Preferált ételek", "Amit szívesen ennél. Példa: tojás, avokádó, csirkemell."],
      avoidedFoods: ["Kerülendő ételek", "Amit nem szeretsz vagy tudatosan kerülnél. Példa: cukor, kenyér."],
      allergies: ["Allergiák és intoleranciák", "Amit egészségügyi okból kerülni kell. Példa: laktóz, diófélék."]
    }
  },
  de: {
    app: "Keto Mentor",
    hero: "Einfaches Keto-Tracking im NorbApp Stil.",
    lead: "Geführte Ziele, klare Tagesmakros und schnelle Mahlzeiten für Einsteiger.",
    username: "Benutzername",
    password: "Passwort",
    register: "Registrieren",
    login: "Anmelden",
    logout: "Abmelden",
    today: "Heute",
    diary: {
      previousDay: "Vorheriger Tag", nextDay: "Nächster Tag", selectDate: "Datum auswählen", noMeals: "An diesem Tag wurden keine Mahlzeiten erfasst.",
      editMeal: "Mahlzeit bearbeiten", deleteMeal: "Löschen", editTime: "Uhrzeit", removeItem: "Zutat entfernen",
      cancel: "Abbrechen", confirmDelete: "Diese Mahlzeit wirklich löschen?", mealDeleted: "Mahlzeit gelöscht und Tageswerte aktualisiert.", mealUpdated: "Mahlzeit aktualisiert."
    },
    onboarding: "Erste Einstellungen",
    dashboard: "Tagesübersicht",
    goal: "Hauptziel",
    save: "Speichern",
    addMeal: "Mahlzeit hinzufügen",
    mealName: "Mahlzeit",
    foodName: "Lebensmittel",
    quantity: "Menge",
    unit: "Einheit",
    serving: "Portion",
    savingMeal: "Speichern...",
    mealSaved: "Mahlzeit gespeichert und Tageswerte aktualisiert.",
    foodSearch: { label: "Lebensmittel suchen", placeholder: "Zum Beispiel: Hähnchenbrust", loading: "Suche...", noResults: "Keine Treffer.", hint: "Mindestens 2 Zeichen eingeben.", selected: "Ausgewählt" },
    foodUnderstanding: {
      understood: "So habe ich es verstanden:", aiAssisted: "KI-gestützte Interpretation", dish: "Gericht",
      preparation: "Zubereitung", modifiers: "Zusätze", excluded: "Ohne",
      inferred: "Übliche Zutat – Bestätigung erforderlich", trusted: "Mit verlässlichen Lebensmitteldaten verknüpft",
      unresolved: "Nährwerte noch nicht mit verlässlichen Lebensmitteldaten verknüpft", needsDetail: "Präzisierung erforderlich.",
      conversionMissing: "Lebensmittel gefunden, aber kein verlässliches Grammgewicht. Bitte Gramm eingeben.",
      review: "Bitte das richtige Lebensmittel auswählen.", verified: "geprüft", estimated: "geschätzt", logAll: "Alle eintragen"
    },
    mealErrors: { selectFood: "Bitte ein Lebensmittel aus der Trefferliste wählen.", network_error: "Die API ist nicht erreichbar. Netzwerk oder CORS prüfen.", validation_error: "Name und Menge der Mahlzeit prüfen.", food_not_found: "Das gewählte Lebensmittel ist nicht mehr verfügbar.", unauthorized: "Die Sitzung ist abgelaufen. Bitte neu anmelden.", server: "Die Mahlzeit konnte serverseitig nicht gespeichert werden.", unknown: "Die Mahlzeit konnte nicht gespeichert werden.", meal_not_found: "Diese Mahlzeit gibt es nicht mehr.", meal_item_not_found: "Diese Zutat gibt es in dieser Mahlzeit nicht mehr.", meal_items_empty: "Eine Mahlzeit braucht mindestens eine Zutat — lösche stattdessen die ganze Mahlzeit.", future_eaten_at: "Die Uhrzeit darf nicht in der Zukunft liegen." },
    disclaimer: "Keto Mentor ist ein informativer Tracker. Er diagnostiziert oder behandelt nicht; medizinische Entscheidungen gehören zu Fachleuten.",
    explain: "Netto-Kohlenhydrate sind Kohlenhydrate minus Ballaststoffe. Für Einsteiger ist das hilfreich, aber Lebensmittelqualität zählt ebenfalls.",
    goals: {
      weight_loss: "Gewicht reduzieren",
      maintenance: "Gewicht halten",
      energy: "Energie unterstützen",
      medical_support: "Ärztliche Empfehlung unterstützen",
      learning: "Keto-Grundlagen lernen"
    },
    fields: {
      dailyKcal: ["Tägliches Kalorienziel", "Der gesamte tägliche Energierahmen in kcal."],
      dailyNetCarbs: ["Netto-Kohlenhydrate", "Kohlenhydrate minus Ballaststoffe, in Gramm."],
      dailyProtein: ["Proteinziel", "Tägliches Proteinziel in Gramm."],
      dailyFat: ["Fettziel", "Tägliches Fettziel in Gramm."],
      dailyFiber: ["Ballaststoffziel", "Tägliches Ballaststoffziel in Gramm."],
      preferences: ["Bevorzugte Lebensmittel", "Was du gerne isst, z. B. Eier, Avocado."],
      avoidedFoods: ["Zu vermeidende Lebensmittel", "Was du nicht magst oder vermeiden möchtest."],
      allergies: ["Allergien und Intoleranzen", "Was medizinisch vermieden werden sollte."]
    }
  },
  en: {
    app: "Keto Mentor",
    hero: "Simple keto tracking, the NorbApp way.",
    lead: "Guided goals, clear daily macros and fast meal logging for beginners.",
    username: "Username",
    password: "Password",
    register: "Register",
    login: "Log in",
    logout: "Log out",
    today: "Today",
    diary: {
      previousDay: "Previous day", nextDay: "Next day", selectDate: "Select date", noMeals: "No meals logged for this day.",
      editMeal: "Edit meal", deleteMeal: "Delete", editTime: "Time", removeItem: "Remove item",
      cancel: "Cancel", confirmDelete: "Delete this meal?", mealDeleted: "Meal deleted and daily totals updated.", mealUpdated: "Meal updated."
    },
    onboarding: "Starter settings",
    dashboard: "Daily overview",
    goal: "Main goal",
    save: "Save",
    addMeal: "Add meal",
    mealName: "Meal name",
    foodName: "Food",
    quantity: "Quantity",
    unit: "Unit",
    serving: "serving",
    savingMeal: "Saving...",
    mealSaved: "Meal saved and daily totals updated.",
    foodSearch: { label: "Search foods", placeholder: "For example: chicken breast", loading: "Searching...", noResults: "No results.", hint: "Enter at least 2 characters to search.", selected: "Selected" },
    foodUnderstanding: {
      understood: "Here’s how I understood it:", aiAssisted: "AI-assisted interpretation", dish: "Dish",
      preparation: "Preparation", modifiers: "Modifiers", excluded: "Without",
      inferred: "Common ingredient – confirmation required", trusted: "Linked to trusted food data",
      unresolved: "Nutrition is not yet linked to trusted food data", needsDetail: "Clarification needed.",
      conversionMissing: "Food found, but no reliable gram conversion exists. Enter grams manually.",
      review: "Review and choose the correct food.", verified: "verified", estimated: "estimated", logAll: "Log all"
    },
    mealErrors: { selectFood: "Choose a food from the results.", network_error: "The API is unreachable. Check the network or CORS configuration.", validation_error: "Check the meal name and quantity.", food_not_found: "The selected food is no longer available. Search again.", unauthorized: "Your session expired. Log in again.", server: "The server could not save the meal. Try again later.", unknown: "The meal could not be saved.", meal_not_found: "This meal no longer exists.", meal_item_not_found: "This item no longer exists in this meal.", meal_items_empty: "A meal needs at least one item — delete the whole meal instead.", future_eaten_at: "The time can't be in the future." },
    disclaimer: "Keto Mentor is an informational food tracker. It does not diagnose or treat disease; ask a professional for medical decisions.",
    explain: "Net carbs are carbs minus fiber. Beginners can use this as a simple guardrail, while overall food quality still matters.",
    goals: {
      weight_loss: "Weight loss",
      maintenance: "Maintenance",
      energy: "Energy support",
      medical_support: "Medical guidance support",
      learning: "Learn keto basics"
    },
    fields: {
      dailyKcal: ["Daily calorie goal", "Your total daily energy target in kcal."],
      dailyNetCarbs: ["Net carb goal", "Carbs minus fiber, in grams."],
      dailyProtein: ["Protein goal", "Daily protein target in grams."],
      dailyFat: ["Fat goal", "Daily fat target in grams."],
      dailyFiber: ["Fiber goal", "Daily fiber target in grams."],
      preferences: ["Preferred foods", "Foods you like, for example eggs or avocado."],
      avoidedFoods: ["Foods to avoid", "Foods you dislike or want to avoid."],
      allergies: ["Allergies and intolerances", "Foods that should be avoided for health reasons."]
    }
  }
} as const;
