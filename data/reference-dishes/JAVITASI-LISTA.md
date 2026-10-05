# Javítási lista – regionális referenciaadatbázis

Kézzel vezetett lista azokról a tételekről, amelyek egy országos fázisból kimaradtak,
vagy utólagos javítást igényelnek. A generált hiánylisták (`<ország>-missing-foods.md`)
a pontos food_key-szintű adatot adják; ez a lista a teendőket és a döntéseket gyűjti.

Felvéve: 2026-10-05, a 2. fázis (HU, #76) merge-e után. Egy tétel akkor kerül le a
listáról, ha a javítás merge-elve van; a PR számát a tétel mellé írjuk.

Jelölés: 🔴 étel hiányzik · 🟠 étel elkészült, de egy összetevő kimaradt belőle ·
🟡 ismert korlát a kódban · ⚪ dokumentáció.

## 1. Kimaradt magyar ételek (HU, még az `INVENTORY`-ban)

A 2. fázis minimumai ezek nélkül is teljesültek (62 hagyományos, 60 mindennapi,
25 street food), ezért nem blokkolták a merge-et, de a teljes készlethez kellenek.

| # | Étel | Kategória | Miért maradt ki | Javasolt javítás |
|---|---|---|---|---|
| HU-1 🔴 | **körömpörkölt** | hagyományos | Az étel fő alapanyagára, a sertéskörömre (Schweinefuß / Spitzbein) nincs rekord: a BLS 4.0-ban nincs (Fuß, Pfote, Spitzbein, Schwarte keresésre sem), és az éles katalógusban sincs. Mivel ez az étel lényege, hasonlóval (pl. csülök) nem helyettesíthető. | USDA FDC „Pork, fresh, variety meats and by-products, feet, raw” importja egy átnézett migrációban (lásd 2. szakasz), utána az étel a többi pörkölt mintájára felépíthető. Az ehető rész aránya (csont, porc) becslés lesz, ezt jelölni kell. |
| HU-2 🔴 | **juhászos tokány** | hagyományos | Az alapanyagok nem hiányoznak; a 2. fázisban nem találtunk hozzá legalább két idézhető, datált nyilvános receptet, amit a feladatleírás ételenként megkövetel (a commit csak ennyit rögzít, a keresés részletei nincsenek dokumentálva). | Újra forrást keresni: klasszikus szakácskönyv és a szokásos oldalak (mindmegette, nosalty, Sóbors stb.). Ha két összevethető recept van, az étel a többi tokány mintájára felépíthető. Ha nincs, döntés kell: kikerül a listáról, vagy a tokány aliasa lesz. |
| HU-3 🔴 | **tepertős pogácsa** | mindennapi | A tepertőre (Grieben / Grammeln) nincs rekord: a BLS 4.0-ban nincs (Griebe, Grammel, Speck keresésre), és az éles katalógusban sincs. A tészta kb. negyede darált tepertő, ez adja az étel lényegét, ezért szalonnával nem helyettesíthető. | USDA FDC „Pork skins / cracklings” importja (2. szakasz), vagy egy magyar termék címkéje átnézett rekordként. Ugyanez a rekord kell a tepertőkrémhez és a `grammelschmalzbrot` aliashoz is (a zsíros kenyérnél most kérdésesként jelölve). Az osztrák „Grammeln” (pl. Grammelknödel) is ezt használja majd. |

## 2. Hiányzó alapanyagok, amelyek nélkül egy kész étel kissé alulszámolt

Ezek az összetevők kimaradtak a receptből (nem lettek helyettesítve), mert sem a BLS 4.0,
sem az éles katalógus nem tartalmazza őket. Mennyiségük kicsi, a hatás többnyire néhány
kcal adagonként. A javasolt út mindegyiknél ugyanaz: **egyetlen átnézett USDA-import
migráció**, a `bls-imports.json` / `bls-migration-sql.ts` mintájára, csak beszúrással.

| # | Alapanyag | Érintett ételek | Javasolt rekord |
|---|---|---|---|
| HU-4 🟠 | száraz vörösbor | lasagne, marhapörkölt, vadpörkölt | USDA „Alcoholic beverage, wine, table, red” |
| HU-5 🟠 | száraz fehérbor | bakonyi sertésszelet, vadas marha, tokány | USDA „Alcoholic beverage, wine, table, white” |
| HU-6 🟠 | 20%-os főzőtejszín | gombapaprikás (és két tárkonyos raguleves / meggyleves alternatív recept) | USDA „Cream, fluid, light (coffee cream or table cream)” (~19% zsír) |
| HU-7 🟠 | savanyú uborka (csemegeuborka) | budapesti hot dog, szelet pizza, franciasaláta | USDA „Pickles, cucumber, dill or kosher dill” (324653, már szerepel az éles listán – ellenőrizni) |
| HU-8 🟠 | narancslé | vadas marha | USDA „Orange juice, raw” |
| HU-9 🟠 | majoránna (szárított) | májas hurka (25 g / 4 adag), véres hurka | USDA „Spices, marjoram, dried” |
| HU-10 🟠 | tárkony (szárított) | palócleves | USDA „Spices, tarragon, dried” |
| HU-11 🟠 | kapor (friss) | kapros túrós lepény | USDA „Dill weed, fresh” |
| HU-12 🟠 | fahéj (őrölt) | túrógombóc, szilvás gombóc (tálaláskor, opcionális) | USDA „Spices, cinnamon, ground” |
| HU-13 🟠 | pizzakrém | szelet pizza | Nincs jó általános rekord; márkás termék (OFF) vagy kimarad. Döntés kell. |
| HU-14 🟠 | daráltpaprika-krém (Piros Arany) | rizses hús | Márkás termék címkéje átnézett rekordként (OFF), mert általános rekord nincs. |

Az import után a hiányzó összetevő visszakerül a receptbe, a generátor újrafut, és a
`reference-dishes-check.md` mutatja a változást.

## 3. Ismert korlátok a kódban

| # | Korlát | Hatás | Javasolt javítás |
|---|---|---|---|
| K-1 🟡 | Egy referenciaétel **forkja** nem viszi magával a `cookingFatLossGrams` értéket. | A felhasználó saját példánya a sült/grillezett húsoknál (13 rész, pl. sült kolbász, oldalas, gyros) a lecsöpögött zsírt is megevettnek számolja: pl. sült kolbász 356 helyett ~409 kcal/100 g. | A fork másolja a provenance zsírveszteség-adatát, és arányosan skálázza, ha a felhasználó a hús mennyiségét módosítja. |
| K-2 🟡 | A webes **recepteditor élő összesítője** nem vonja le a zsírveszteséget. | Szerkesztés közben más szám látszik, mint a mentett receptnél. | Az editor ugyanazt a `calculateRecipeNutrition` logikát használja (a shared csomagból), mint az API. |
| K-3 🟡 | **Becsült értékek:** csontos hús ehető aránya, tojásos bunda (10%), párolgás, víz ott, ahol a forrás nem ad mennyiséget. | Mindegyik jelölve van az összetevő- vagy főzési megjegyzésben. | Nincs azonnali teendő; ha hatósági vagy BLS-adat kerül elő, cserélni. |

## 4. Dokumentáció

| # | Tétel | Javítás |
|---|---|---|
| D-1 ⚪ | A `README.md` „Ismert hiányok és nyitott kérdések” része elavult: a kömény/fehérrépa nevét és a BLS nettó szénhidrát kettős levonását a #65 már javította (`docs/ROADMAP.md` A1, A2). | A szakaszt frissíteni, és erre a listára hivatkozni. |

## 5. Átnézve, nincs teendő

A `reference-dishes-check.md` 11 ételnél jelez 15% feletti kcal-eltérést a BLS összetett
ételhez képest (carbonara, pizza margherita, uborkasaláta, tejbegríz, palacsinta,
lekváros palacsinta, birkapörkölt, sárgaborsó-, krumpli-, meggy- és sütőtökkrémleves).
Mindegyik átnézett receptkülönbség (RECEPTKÜLÖNBSÉG, írásos indoklással), nem hiba.
