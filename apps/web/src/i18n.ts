export type Lang = "hu" | "de" | "en";

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
    onboarding: "Kezdő beállítások",
    dashboard: "Napi áttekintés",
    goal: "Fő cél",
    save: "Mentés",
    addMeal: "Étkezés hozzáadása",
    mealName: "Étkezés neve",
    foodName: "Étel",
    quantity: "Mennyiség",
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
    onboarding: "Erste Einstellungen",
    dashboard: "Tagesübersicht",
    goal: "Hauptziel",
    save: "Speichern",
    addMeal: "Mahlzeit hinzufügen",
    mealName: "Mahlzeit",
    foodName: "Lebensmittel",
    quantity: "Menge",
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
    onboarding: "Starter settings",
    dashboard: "Daily overview",
    goal: "Main goal",
    save: "Save",
    addMeal: "Add meal",
    mealName: "Meal name",
    foodName: "Food",
    quantity: "Quantity",
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
