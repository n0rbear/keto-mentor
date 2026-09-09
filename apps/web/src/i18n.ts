export type Lang = "hu" | "de" | "en";

export const quantityLabels = {
  hu: { estimated: "Becsült mennyiség", aiEstimated: "AI-val becsült mennyiség", range: "Valószínű tartomány", confidence: "Becslési bizonyosság", accept: "Elfogadom", change: "Módosítom", missing: "Mennyit ettél belőle?", gramsRequired: "Hány grammot ettél belőle?", grams: "Elfogyasztott gramm", basisVolume: "Becsült adag: tipikus edény mérete és az étel állaga alapján" },
  de: { estimated: "Geschätzte Menge", aiEstimated: "KI-geschätzte Menge", range: "Wahrscheinlicher Bereich", confidence: "Schätzsicherheit", accept: "Akzeptieren", change: "Ändern", missing: "Wie viel hast du davon gegessen?", gramsRequired: "Wie viele Gramm hast du davon gegessen?", grams: "Verzehrte Gramm", basisVolume: "Geschätzte Portion: basierend auf typischer Gefäßgröße und Beschaffenheit des Lebensmittels" },
  en: { estimated: "Estimated amount", aiEstimated: "AI-estimated amount", range: "Likely range", confidence: "Estimate confidence", accept: "Accept", change: "Change", missing: "How much did you eat?", gramsRequired: "How many grams did you eat?", grams: "Grams consumed", basisVolume: "Estimated portion: based on typical container size and the food's texture" }
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
      cancel: "Mégse", confirmDelete: "Biztosan törlöd ezt az étkezést?", mealDeleted: "Az étkezés törölve, a napi összesítés frissült.", mealUpdated: "Az étkezés frissítve.",
      repeatMeal: "Ismét", confirmRepeat: "Újra rögzíted ezt az étkezést most?", mealRepeated: "Étkezés újra rögzítve a mai naphoz.",
      mealsLabel: "étkezés",
      week: {
        heading: "Heti áttekintés", previousWeek: "Előző hét", nextWeek: "Következő hét",
        loggedDaysSuffix: "nap naplózva"
      }
    },
    onboarding: "Kezdő beállítások",
    dashboard: "Napi áttekintés",
    loadingProfile: "Bejelentkezve, profil betöltése…",
    serverWakingUp: "A Keto Mentor szervere ébred — ez az első megnyitásnál néhány másodpercig tarthat.",
    goal: "Fő cél",
    save: "Mentés",
    addMeal: "Étkezés hozzáadása",
    mealName: "Étkezés neve",
    foodName: "Étel",
    quantity: "Mennyiség",
    unit: "Egység",
    unitGroupPhysical: "Mértékegység", unitGroupServings: "Ehhez az ételhez",
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
      review: "Ellenőrizd és válaszd ki a megfelelő ételt.", verified: "ellenőrzött", estimated: "becsült", logAll: "Összes naplózása",
      preparationValues: {
        scrambled: "rántotta", fried: "sült", boiled: "főtt", roasted: "sült/pirított", steamed: "párolt",
        smoked: "füstölt", raw: "nyers", baked: "sütőben sült", breaded: "rántott", grilled: "grillezett"
      },
      unitValues: {
        piece: "db", slice: "szelet", portion: "adag", plate: "tányér", bowl: "tál", ladle: "merőkanál",
        tbsp: "evőkanál", tsp: "teáskanál", cup: "csésze", handful: "marék", quarter: "negyed",
        bite: "harapás", splash: "löttyintés", half: "fél"
      }
    },
    mealErrors: { selectFood: "Válassz ételt a találati listából.", network_error: "Az API nem érhető el. Ellenőrizd a kapcsolatot; ezt CORS vagy hálózati hiba is okozhatja.", validation_error: "Ellenőrizd az étkezés nevét és a mennyiséget.", food_not_found: "A kiválasztott étel már nem található. Keress rá újra.", unauthorized: "A munkamenet lejárt. Jelentkezz be újra.", server: "A szerver nem tudta elmenteni az étkezést. Próbáld meg később.", unknown: "Az étkezést nem sikerült elmenteni.", meal_not_found: "Ez az étkezés már nem található.", meal_item_not_found: "Ez a tétel már nem található ebben az étkezésben.", meal_items_empty: "Egy étkezésben legalább egy tételnek maradnia kell — inkább töröld az egész étkezést.", future_eaten_at: "Az időpont nem lehet a jövőben.", meal_repeat_invalid_source: "Ez az étkezés sérült, nem ismételhető meg." },
    recipes: {
      heading: "Receptek", subheading: "Saját alapanyagokból, kizárólag a Food katalógus tápértékeivel.",
      newRecipe: "Új recept", myRecipes: "Receptjeim", publicRecipes: "Közösségi receptek",
      searchMinePlaceholder: "Keresés a saját receptekben", searchPublicPlaceholder: "Keresés publikus receptek címében", search: "Keresés",
      emptyLibrary: "Még nincs megjeleníthető recept.", view: "Megnyitás", badgePrivate: "Privát", badgePublic: "Publikus", byAuthor: "Szerző:", netCarbsShort: "g nettó szh.",
      back: "Vissza a receptekhez", editAction: "Szerkesztés", deleteAction: "Törlés", saveAsMine: "Mentés sajátként",
      addToMeal: "Hozzáadás étkezéshez", addedToMealSuffix: " hozzáadva a mai étkezéshez.",
      deleteConfirmTitle: "Törlöd ezt a receptet?", deleteConfirmBody: "A recept eltűnik a receptkönyvtáradból. A korábbi étkezésnapló-bejegyzések változatlanok maradnak.",
      recipeDeleted: "A recept törölve, a receptkönyvtár frissült.", recipeSaved: "Recept elmentve.",
      titleLabel: "Recept neve", descriptionLabel: "Leírás (opcionális)", instructionsLabel: "Elkészítési lépések",
      servingsFieldLabel: "Adagok", finishedWeightLabel: "Kész tömeg (g)",
      visibilityLegend: "Láthatóság", visibilityPrivateOption: "Privát recept", visibilityPublicOption: "Publikus recept",
      ingredientLabel: "Alapanyag", gramsFieldLabel: "Gramm", addIngredient: "Hozzáadás", removeIngredient: "Alapanyag törlése",
      totalNutrition: "Teljes recept", perServing: "Adagonként", per100g: "100 grammonként",
      noDescription: "Nincs leírás.", noInstructions: "Nincs elkészítési leírás.", sourceLabel: "Forrás", aiExtractedTag: "AI-vel kinyerve",
      ingredientsRequired: "A recept neve és legalább egy alapanyag kötelező.", invalidIngredient: "Válassz alapanyagot és adj meg pozitív grammértéket.",
      loadFailed: "A receptek betöltése nem sikerült.",
      aiExtractedNotice: "A recept adatait AI nyerte ki az oldalról. Mentés előtt ellenőrizd.",
      import: {
        heading: "Recept importálása URL-ből", url: "Nyilvános recept URL", preview: "Előnézet", loading: "Betöltés…",
        resolved: "Feloldva", review: "Ellenőrzést igényel", unresolved: "Nincs feloldva", resolve: "Alapanyag ellenőrzése",
        blocked: "A mentéshez minden alapanyagnak biztos Food-találat és grammérték kell.", failed: "A recept előnézete nem készíthető el.",
        omit: "Kihagyás", restore: "Visszaállítás", servingsUnit: "adag"
      }
    },
    recipeErrors: {
      recipe_not_found: "Ez a recept már nem található.", food_not_found: "Az egyik kiválasztott alapanyag már nem található a katalógusban.",
      invalid_import_proof: "Az importált recept ellenőrzése sikertelen. Próbáld újra importálni.",
      recipe_servings_required: "Ehhez az adagonkénti hozzáadáshoz a receptnek meg kell adnia az adagok számát.",
      validation_error: "Ellenőrizd a recept adatait.", network_error: "Az API nem érhető el. Ellenőrizd a kapcsolatot.",
      unauthorized: "A munkamenet lejárt. Jelentkezz be újra.", server: "A szerver nem tudta feldolgozni a kérést. Próbáld meg később.",
      unknown: "Váratlan hiba történt.",
      recipe_ai_unavailable: "Az automatikus felismerés jelenleg nem érhető el. Add meg a receptet kézzel.",
      recipe_ai_timeout: "Az automatikus felismerés túl sokáig tartott. Add meg a receptet kézzel, vagy próbáld újra.",
      recipe_ai_invalid_output: "Az automatikus felismerés nem hozott használható eredményt. Add meg a receptet kézzel.",
      recipe_page_not_found: "Nem találtunk feldolgozható receptet ezen az oldalon.",
      recipe_ingredients_missing: "Nem találtunk hozzávalókat ezen az oldalon.",
      malformed_json_ld: "Az oldal recept-adatai hibásak vagy hiányosak.",
      too_many_ingredients: "Ez a recept túl sok hozzávalót tartalmaz az importáláshoz.",
      recipe_content_too_large: "A recept szövege túl hosszú az importáláshoz.",
      invalid_url: "A megadott link érvénytelen.",
      dns_failure: "A receptoldal nem érhető el.",
      fetch_failed: "A receptoldal nem érhető el.",
      blocked_url: "Ez a cím biztonsági okból nem importálható.",
      fetch_timeout: "A receptoldal nem válaszolt időben. Próbáld meg később.",
      redirect_limit: "Az oldal túl sok átirányítást használ.",
      response_too_large: "Az oldal túl nagy vagy nem támogatott.",
      unsupported_content_type: "Az oldal túl nagy vagy nem támogatott.",
      import_failed: "A recept előnézete nem készíthető el."
    },
    barcode: {
      toggleLabel: "Vonalkód / EAN keresés", inputLabel: "Vonalkód (EAN/UPC)", placeholder: "pl. 4008400404127",
      lookupButton: "Keresés", looking: "Keresés…", sourceLabel: "Forrás", sourceName: "Open Food Facts",
      confirmButton: "Hozzáadás a katalógushoz", confirming: "Hozzáadás…",
      incompleteWarning: "Ehhez a termékhez hiányos vagy nem megbízható a tápérték-adat, ezért nem adható hozzá automatikusan.",
      notFound: "Nem található termék ezzel a vonalkóddal.",
      addedSuccess: "A termék hozzáadva a katalógushoz és kiválasztva."
    },
    barcodeErrors: {
      invalid_barcode_format: "Érvénytelen vonalkód formátum. Csak számjegyeket adj meg (8, 12, 13 vagy 14 hosszan).",
      invalid_barcode_checksum: "A vonalkód ellenőrző száma nem egyezik — nézd át a beírt számjegyeket.",
      external_unavailable: "A termékadatbázis jelenleg nem érhető el. Próbáld meg később.",
      confirmation_required: "Lehetséges duplikátum miatt semmi nem került hozzáadásra.",
      invalid_external_data: "A forrásadat nem volt elérhető vagy érvényes; semmi nem került hozzáadásra.",
      network_error: "Az API nem érhető el. Ellenőrizd a kapcsolatot.",
      unauthorized: "A munkamenet lejárt. Jelentkezz be újra.",
      unknown: "Váratlan hiba történt."
    },
    barcodeScanner: {
      scanButton: "Beolvasás kamerával", requestingPermission: "Kamera indítása…", scanning: "Irányítsd a vonalkódot a keretbe.",
      cancel: "Beolvasás megszakítása", cameraDenied: "A kamera-hozzáférés megtagadva. Add meg a vonalkódot kézzel.",
      cameraUnavailable: "Nem található kamera ezen az eszközön. Add meg a vonalkódot kézzel.",
      scannerUnsupported: "A böngésződ nem támogatja a kamerás beolvasást. Add meg a vonalkódot kézzel.",
      scannerFailed: "A beolvasás nem sikerült. Add meg a vonalkódot kézzel.",
      unsupportedCode: "Ez nem egy támogatott vonalkód-formátum. Próbáld újra.",
      privacyNotice: "A kamera képét nem töltjük fel; csak a leolvasott vonalkódot használjuk.",
      detected: "Vonalkód beolvasva.", tryAgain: "Próbáld újra", videoLabel: "Élő kameraelőnézet a vonalkód-kereséshez"
    },
    nav: { today: "Ma", log: "Rögzítés", recipes: "Receptek" },
    pwa: {
      installTitle: "Telepítsd a Keto Mentort", installBody: "Add hozzá a kezdőképernyődhöz a gyorsabb eléréshez.",
      installButton: "Telepítés", installDismiss: "Most nem",
      iosInstructions: "Megosztás gomb → Kezdőképernyőhöz adás", updateAvailable: "Új verzió érhető el.",
      updateButton: "Frissítés", offlineMessage: "Nincs internetkapcsolat. Csatlakozz újra, és próbáld meg ismét."
    },
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
      cancel: "Abbrechen", confirmDelete: "Diese Mahlzeit wirklich löschen?", mealDeleted: "Mahlzeit gelöscht und Tageswerte aktualisiert.", mealUpdated: "Mahlzeit aktualisiert.",
      repeatMeal: "Erneut", confirmRepeat: "Diese Mahlzeit jetzt erneut protokollieren?", mealRepeated: "Mahlzeit erneut für heute protokolliert.",
      mealsLabel: "Mahlzeiten",
      week: {
        heading: "Wochenübersicht", previousWeek: "Vorherige Woche", nextWeek: "Nächste Woche",
        loggedDaysSuffix: "Tage protokolliert"
      }
    },
    onboarding: "Erste Einstellungen",
    dashboard: "Tagesübersicht",
    loadingProfile: "Angemeldet, Profil wird geladen…",
    serverWakingUp: "Der Keto Mentor-Server wacht auf — das kann beim ersten Öffnen ein paar Sekunden dauern.",
    goal: "Hauptziel",
    save: "Speichern",
    addMeal: "Mahlzeit hinzufügen",
    mealName: "Mahlzeit",
    foodName: "Lebensmittel",
    quantity: "Menge",
    unit: "Einheit",
    unitGroupPhysical: "Maßeinheit", unitGroupServings: "Für dieses Lebensmittel",
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
      review: "Bitte das richtige Lebensmittel auswählen.", verified: "geprüft", estimated: "geschätzt", logAll: "Alle eintragen",
      unitValues: {
        piece: "Stück", slice: "Scheibe", portion: "Portion", plate: "Teller", bowl: "Schüssel", ladle: "Kelle",
        tbsp: "Esslöffel", tsp: "Teelöffel", cup: "Tasse", handful: "Handvoll", quarter: "Viertel",
        bite: "Bissen", splash: "Schuss", half: "halb"
      },
      preparationValues: {
        scrambled: "Rührei", fried: "gebraten", boiled: "gekocht", roasted: "geröstet", steamed: "gedünstet",
        smoked: "geräuchert", raw: "roh", baked: "gebacken", breaded: "paniert", grilled: "gegrillt"
      }
    },
    mealErrors: { selectFood: "Bitte ein Lebensmittel aus der Trefferliste wählen.", network_error: "Die API ist nicht erreichbar. Netzwerk oder CORS prüfen.", validation_error: "Name und Menge der Mahlzeit prüfen.", food_not_found: "Das gewählte Lebensmittel ist nicht mehr verfügbar.", unauthorized: "Die Sitzung ist abgelaufen. Bitte neu anmelden.", server: "Die Mahlzeit konnte serverseitig nicht gespeichert werden.", unknown: "Die Mahlzeit konnte nicht gespeichert werden.", meal_not_found: "Diese Mahlzeit gibt es nicht mehr.", meal_item_not_found: "Diese Zutat gibt es in dieser Mahlzeit nicht mehr.", meal_items_empty: "Eine Mahlzeit braucht mindestens eine Zutat — lösche stattdessen die ganze Mahlzeit.", future_eaten_at: "Die Uhrzeit darf nicht in der Zukunft liegen.", meal_repeat_invalid_source: "Diese Mahlzeit ist beschädigt und kann nicht wiederholt werden." },
    recipes: {
      heading: "Rezepte", subheading: "Aus deinen eigenen Zutaten, ausschließlich mit den Nährwerten aus dem Food-Katalog.",
      newRecipe: "Neues Rezept", myRecipes: "Meine Rezepte", publicRecipes: "Community-Rezepte",
      searchMinePlaceholder: "In den eigenen Rezepten suchen", searchPublicPlaceholder: "Nach öffentlichen Rezepttiteln suchen", search: "Suchen",
      emptyLibrary: "Es gibt noch keine anzeigbaren Rezepte.", view: "Öffnen", badgePrivate: "Privat", badgePublic: "Öffentlich", byAuthor: "Von:", netCarbsShort: "g Netto-KH",
      back: "Zurück zu den Rezepten", editAction: "Bearbeiten", deleteAction: "Löschen", saveAsMine: "Als eigenes speichern",
      addToMeal: "Zur Mahlzeit hinzufügen", addedToMealSuffix: " wurde der heutigen Mahlzeit hinzugefügt.",
      deleteConfirmTitle: "Dieses Rezept löschen?", deleteConfirmBody: "Das Rezept wird aus deiner Rezeptbibliothek entfernt. Frühere Tagebucheinträge bleiben unverändert.",
      recipeDeleted: "Rezept gelöscht, die Rezeptbibliothek wurde aktualisiert.", recipeSaved: "Rezept gespeichert.",
      titleLabel: "Rezeptname", descriptionLabel: "Beschreibung (optional)", instructionsLabel: "Zubereitungsschritte",
      servingsFieldLabel: "Portionen", finishedWeightLabel: "Fertiggewicht (g)",
      visibilityLegend: "Sichtbarkeit", visibilityPrivateOption: "Privates Rezept", visibilityPublicOption: "Öffentliches Rezept",
      ingredientLabel: "Zutat", gramsFieldLabel: "Gramm", addIngredient: "Hinzufügen", removeIngredient: "Zutat entfernen",
      totalNutrition: "Gesamtes Rezept", perServing: "Pro Portion", per100g: "Pro 100 Gramm",
      noDescription: "Keine Beschreibung.", noInstructions: "Keine Zubereitungsschritte.", sourceLabel: "Quelle", aiExtractedTag: "KI-extrahiert",
      ingredientsRequired: "Rezeptname und mindestens eine Zutat sind erforderlich.", invalidIngredient: "Wähle eine Zutat und gib eine positive Grammzahl an.",
      loadFailed: "Die Rezepte konnten nicht geladen werden.",
      aiExtractedNotice: "Die Rezeptdaten wurden von der KI aus der Seite extrahiert. Bitte vor dem Speichern prüfen.",
      import: {
        heading: "Rezept aus URL importieren", url: "Öffentliche Rezept-URL", preview: "Vorschau", loading: "Laden…",
        resolved: "Aufgelöst", review: "Prüfung erforderlich", unresolved: "Nicht aufgelöst", resolve: "Zutat prüfen",
        blocked: "Zum Speichern braucht jede Zutat eine sichere Food-Zuordnung und Grammmenge.", failed: "Die Rezeptvorschau konnte nicht erstellt werden.",
        omit: "Auslassen", restore: "Wiederherstellen", servingsUnit: "Portionen"
      }
    },
    recipeErrors: {
      recipe_not_found: "Dieses Rezept gibt es nicht mehr.", food_not_found: "Eine der gewählten Zutaten ist nicht mehr im Katalog.",
      invalid_import_proof: "Die Überprüfung des importierten Rezepts ist fehlgeschlagen. Bitte erneut importieren.",
      recipe_servings_required: "Für die portionsweise Zugabe muss das Rezept eine Portionsanzahl angeben.",
      validation_error: "Bitte die Rezeptangaben prüfen.", network_error: "Die API ist nicht erreichbar. Bitte die Verbindung prüfen.",
      unauthorized: "Die Sitzung ist abgelaufen. Bitte neu anmelden.", server: "Der Server konnte die Anfrage nicht verarbeiten. Bitte später erneut versuchen.",
      unknown: "Ein unerwarteter Fehler ist aufgetreten.",
      recipe_ai_unavailable: "Die automatische Erkennung ist derzeit nicht verfügbar. Bitte das Rezept manuell eingeben.",
      recipe_ai_timeout: "Die automatische Erkennung hat zu lange gedauert. Bitte das Rezept manuell eingeben oder erneut versuchen.",
      recipe_ai_invalid_output: "Die automatische Erkennung lieferte kein brauchbares Ergebnis. Bitte das Rezept manuell eingeben.",
      recipe_page_not_found: "Auf dieser Seite wurde kein verarbeitbares Rezept gefunden.",
      recipe_ingredients_missing: "Auf dieser Seite wurden keine Zutaten gefunden.",
      malformed_json_ld: "Die Rezeptdaten dieser Seite sind fehlerhaft oder unvollständig.",
      too_many_ingredients: "Dieses Rezept enthält zu viele Zutaten für den Import.",
      recipe_content_too_large: "Der Rezepttext ist für den Import zu lang.",
      invalid_url: "Der angegebene Link ist ungültig.",
      dns_failure: "Die Rezeptseite ist nicht erreichbar.",
      fetch_failed: "Die Rezeptseite ist nicht erreichbar.",
      blocked_url: "Diese Adresse kann aus Sicherheitsgründen nicht importiert werden.",
      fetch_timeout: "Die Rezeptseite hat nicht rechtzeitig geantwortet. Bitte später erneut versuchen.",
      redirect_limit: "Die Seite verwendet zu viele Weiterleitungen.",
      response_too_large: "Die Seite ist zu groß oder wird nicht unterstützt.",
      unsupported_content_type: "Die Seite ist zu groß oder wird nicht unterstützt.",
      import_failed: "Die Rezeptvorschau konnte nicht erstellt werden."
    },
    barcode: {
      toggleLabel: "Barcode-/EAN-Suche", inputLabel: "Barcode (EAN/UPC)", placeholder: "z. B. 4008400404127",
      lookupButton: "Suchen", looking: "Suche…", sourceLabel: "Quelle", sourceName: "Open Food Facts",
      confirmButton: "Zum Katalog hinzufügen", confirming: "Wird hinzugefügt…",
      incompleteWarning: "Für dieses Produkt sind die Nährwertdaten unvollständig oder unzuverlässig, daher kann es nicht automatisch hinzugefügt werden.",
      notFound: "Kein Produkt mit diesem Barcode gefunden.",
      addedSuccess: "Produkt zum Katalog hinzugefügt und ausgewählt."
    },
    barcodeErrors: {
      invalid_barcode_format: "Ungültiges Barcode-Format. Bitte nur Ziffern eingeben (Länge 8, 12, 13 oder 14).",
      invalid_barcode_checksum: "Die Prüfziffer des Barcodes stimmt nicht — bitte die eingegebenen Ziffern prüfen.",
      external_unavailable: "Die Produktdatenbank ist derzeit nicht erreichbar. Bitte später erneut versuchen.",
      confirmation_required: "Wegen eines möglichen Duplikats wurde nichts hinzugefügt.",
      invalid_external_data: "Die Quelldaten waren nicht verfügbar oder ungültig; nichts wurde hinzugefügt.",
      network_error: "Die API ist nicht erreichbar. Bitte die Verbindung prüfen.",
      unauthorized: "Die Sitzung ist abgelaufen. Bitte neu anmelden.",
      unknown: "Ein unerwarteter Fehler ist aufgetreten."
    },
    barcodeScanner: {
      scanButton: "Mit Kamera scannen", requestingPermission: "Kamera wird gestartet…", scanning: "Richte den Barcode auf den Rahmen aus.",
      cancel: "Scannen abbrechen", cameraDenied: "Kamerazugriff verweigert. Bitte den Barcode manuell eingeben.",
      cameraUnavailable: "Auf diesem Gerät wurde keine Kamera gefunden. Bitte den Barcode manuell eingeben.",
      scannerUnsupported: "Dein Browser unterstützt das Scannen per Kamera nicht. Bitte den Barcode manuell eingeben.",
      scannerFailed: "Das Scannen ist fehlgeschlagen. Bitte den Barcode manuell eingeben.",
      unsupportedCode: "Das ist kein unterstütztes Barcode-Format. Bitte erneut versuchen.",
      privacyNotice: "Das Kamerabild wird nicht hochgeladen; es wird nur der erkannte Barcode verwendet.",
      detected: "Barcode erkannt.", tryAgain: "Erneut versuchen", videoLabel: "Live-Kameravorschau für die Barcode-Suche"
    },
    nav: { today: "Heute", log: "Erfassen", recipes: "Rezepte" },
    pwa: {
      installTitle: "Keto Mentor installieren", installBody: "Zum Startbildschirm hinzufügen für schnelleren Zugriff.",
      installButton: "Installieren", installDismiss: "Jetzt nicht",
      iosInstructions: "Teilen-Symbol → Zum Home-Bildschirm", updateAvailable: "Eine neue Version ist verfügbar.",
      updateButton: "Aktualisieren", offlineMessage: "Keine Internetverbindung. Bitte erneut verbinden und versuchen."
    },
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
      cancel: "Cancel", confirmDelete: "Delete this meal?", mealDeleted: "Meal deleted and daily totals updated.", mealUpdated: "Meal updated.",
      repeatMeal: "Repeat", confirmRepeat: "Log this meal again now?", mealRepeated: "Meal repeated for today.",
      mealsLabel: "meals",
      week: {
        heading: "Week overview", previousWeek: "Previous week", nextWeek: "Next week",
        loggedDaysSuffix: "days logged"
      }
    },
    onboarding: "Starter settings",
    dashboard: "Daily overview",
    loadingProfile: "Signed in, loading your profile…",
    serverWakingUp: "Keto Mentor's server is waking up — this can take a few seconds on first open.",
    goal: "Main goal",
    save: "Save",
    addMeal: "Add meal",
    mealName: "Meal name",
    foodName: "Food",
    quantity: "Quantity",
    unit: "Unit",
    unitGroupPhysical: "Measurement", unitGroupServings: "For this food",
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
      review: "Review and choose the correct food.", verified: "verified", estimated: "estimated", logAll: "Log all",
      unitValues: {
        piece: "piece", slice: "slice", portion: "portion", plate: "plate", bowl: "bowl", ladle: "ladle",
        tbsp: "tbsp", tsp: "tsp", cup: "cup", handful: "handful", quarter: "quarter",
        bite: "bite", splash: "splash", half: "half"
      },
      preparationValues: {
        scrambled: "scrambled", fried: "fried", boiled: "boiled", roasted: "roasted", steamed: "steamed",
        smoked: "smoked", raw: "raw", baked: "baked", breaded: "breaded", grilled: "grilled"
      }
    },
    mealErrors: { selectFood: "Choose a food from the results.", network_error: "The API is unreachable. Check the network or CORS configuration.", validation_error: "Check the meal name and quantity.", food_not_found: "The selected food is no longer available. Search again.", unauthorized: "Your session expired. Log in again.", server: "The server could not save the meal. Try again later.", unknown: "The meal could not be saved.", meal_not_found: "This meal no longer exists.", meal_item_not_found: "This item no longer exists in this meal.", meal_items_empty: "A meal needs at least one item — delete the whole meal instead.", future_eaten_at: "The time can't be in the future.", meal_repeat_invalid_source: "This meal is corrupted and can't be repeated." },
    recipes: {
      heading: "Recipes", subheading: "From your own ingredients, using only the Food catalog's nutrition.",
      newRecipe: "New recipe", myRecipes: "My recipes", publicRecipes: "Community recipes",
      searchMinePlaceholder: "Search your own recipes", searchPublicPlaceholder: "Search public recipe titles", search: "Search",
      emptyLibrary: "No recipes to show yet.", view: "View", badgePrivate: "Private", badgePublic: "Public", byAuthor: "By:", netCarbsShort: "g net carbs",
      back: "Back to recipes", editAction: "Edit", deleteAction: "Delete", saveAsMine: "Save as mine",
      addToMeal: "Add to meal", addedToMealSuffix: " added to today's meal.",
      deleteConfirmTitle: "Delete this recipe?", deleteConfirmBody: "The recipe is removed from your recipe library. Past diary entries stay unchanged.",
      recipeDeleted: "Recipe deleted and the recipe library updated.", recipeSaved: "Recipe saved.",
      titleLabel: "Recipe name", descriptionLabel: "Description (optional)", instructionsLabel: "Instructions",
      servingsFieldLabel: "Servings", finishedWeightLabel: "Finished weight (g)",
      visibilityLegend: "Visibility", visibilityPrivateOption: "Private recipe", visibilityPublicOption: "Public recipe",
      ingredientLabel: "Ingredient", gramsFieldLabel: "Grams", addIngredient: "Add", removeIngredient: "Remove ingredient",
      totalNutrition: "Whole recipe", perServing: "Per serving", per100g: "Per 100 g",
      noDescription: "No description.", noInstructions: "No instructions.", sourceLabel: "Source", aiExtractedTag: "AI-extracted",
      ingredientsRequired: "Recipe name and at least one ingredient are required.", invalidIngredient: "Choose an ingredient and enter a positive gram amount.",
      loadFailed: "The recipes could not be loaded.",
      aiExtractedNotice: "This recipe's data was extracted by AI from the page. Review it before saving.",
      import: {
        heading: "Import recipe from URL", url: "Public recipe URL", preview: "Preview", loading: "Loading…",
        resolved: "Resolved", review: "Needs review", unresolved: "Unresolved", resolve: "Review ingredient",
        blocked: "Every ingredient needs a safe Food match and gram quantity before saving.", failed: "The recipe preview could not be created.",
        omit: "Omit", restore: "Restore", servingsUnit: "servings"
      }
    },
    recipeErrors: {
      recipe_not_found: "This recipe no longer exists.", food_not_found: "One of the selected ingredients is no longer in the catalog.",
      invalid_import_proof: "The imported recipe could not be verified. Try importing it again.",
      recipe_servings_required: "Adding by serving requires the recipe to specify a number of servings.",
      validation_error: "Check the recipe details.", network_error: "The API is unreachable. Check your connection.",
      unauthorized: "Your session expired. Log in again.", server: "The server could not process the request. Try again later.",
      unknown: "An unexpected error occurred.",
      recipe_ai_unavailable: "Automatic extraction is currently unavailable. Enter the recipe manually.",
      recipe_ai_timeout: "Automatic extraction took too long. Enter the recipe manually, or try again.",
      recipe_ai_invalid_output: "Automatic extraction didn't produce a usable result. Enter the recipe manually.",
      recipe_page_not_found: "We couldn't find a processable recipe on this page.",
      recipe_ingredients_missing: "No ingredients were found on this page.",
      malformed_json_ld: "This page's recipe data is broken or incomplete.",
      too_many_ingredients: "This recipe has too many ingredients to import.",
      recipe_content_too_large: "The recipe text is too long to import.",
      invalid_url: "The link you entered isn't valid.",
      dns_failure: "The recipe page is unreachable.",
      fetch_failed: "The recipe page is unreachable.",
      blocked_url: "That address can't be imported for security reasons.",
      fetch_timeout: "The recipe page didn't respond in time. Try again later.",
      redirect_limit: "The page uses too many redirects.",
      response_too_large: "The page is too large or unsupported.",
      unsupported_content_type: "The page is too large or unsupported.",
      import_failed: "The recipe preview could not be created."
    },
    barcode: {
      toggleLabel: "Barcode / EAN lookup", inputLabel: "Barcode (EAN/UPC)", placeholder: "e.g. 4008400404127",
      lookupButton: "Look up", looking: "Looking up…", sourceLabel: "Source", sourceName: "Open Food Facts",
      confirmButton: "Add to catalog", confirming: "Adding…",
      incompleteWarning: "This product's nutrition data is incomplete or unreliable, so it can't be added automatically.",
      notFound: "No product found for this barcode.",
      addedSuccess: "Product added to the catalog and selected."
    },
    barcodeErrors: {
      invalid_barcode_format: "Invalid barcode format. Use digits only (length 8, 12, 13, or 14).",
      invalid_barcode_checksum: "The barcode's check digit doesn't match — double-check the digits you entered.",
      external_unavailable: "The product database is currently unavailable. Try again later.",
      confirmation_required: "Nothing was added because a possible duplicate needs review.",
      invalid_external_data: "The source data was unavailable or invalid; nothing was added.",
      network_error: "The API is unreachable. Check your connection.",
      unauthorized: "Your session expired. Log in again.",
      unknown: "An unexpected error occurred."
    },
    barcodeScanner: {
      scanButton: "Scan with camera", requestingPermission: "Starting camera…", scanning: "Point the barcode at the frame.",
      cancel: "Cancel scanning", cameraDenied: "Camera access was denied. Enter the barcode manually.",
      cameraUnavailable: "No camera was found on this device. Enter the barcode manually.",
      scannerUnsupported: "Your browser doesn't support camera scanning. Enter the barcode manually.",
      scannerFailed: "Scanning failed. Enter the barcode manually.",
      unsupportedCode: "That's not a supported barcode format. Try again.",
      privacyNotice: "The camera image is never uploaded; only the decoded barcode is used.",
      detected: "Barcode detected.", tryAgain: "Try again", videoLabel: "Live camera preview for barcode scanning"
    },
    nav: { today: "Today", log: "Log", recipes: "Recipes" },
    pwa: {
      installTitle: "Install Keto Mentor", installBody: "Add it to your home screen for faster access.",
      installButton: "Install", installDismiss: "Not now",
      iosInstructions: "Share button → Add to Home Screen", updateAvailable: "A new version is available.",
      updateButton: "Update", offlineMessage: "No internet connection. Reconnect and try again."
    },
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
