# Regionális étel- és adagadatbázis – feladatleírás (HU, AT, DE)

A tulajdonos kérése, 2026-09-27. Első kör: Magyarország, Ausztria, Németország.
Ez a dokumentum a megvalósító ágens (Codex) feladatleírása. A későbbi körök (további
EU-országok, USA) ugyanezeket a szabályokat követik.

## Cél

Egy magyarországi, ausztriai vagy németországi felhasználó magyarul, osztrák németül,
standard németül vagy angolul írja/mondja, mit evett. Például:

- „egy tányér gulyás”, „egy sajtos-tejfölös lángos”, „két szelet pizza”;
- „2 Semmelknödel”, „3 Scheiben Leberkäse”, „ein Häferl Milch”, „Eierspeis aus 3 Eiern”;
- „Currywurst mit Pommes”, „ein Döner”, „Big Mac”, „6 Chicken Nuggets”.

A rendszernek AI-hívás nélkül tudnia kell:

1. **Mi ez:** név és szinonimák minden érintett nyelven, regionális alakokkal és
   márkanevekkel.
2. **Mennyi a tápértéke:** ellenőrzött katalógusrekordokból számolva. Gyorsétteremi
   terméknél a lánc hivatalos tápérték-táblázatából.
3. **Hány gramm egy szokásos egység:** szelet, darab, adag, tányér, bögre/Häferl,
   evőkanál, zsemle, menüméret (kicsi/közepes/nagy).

## Architektúra (kötelező)

- **Nem jön létre új adatbázis vagy séma.** Minden a meglévő `ketomentor` sémába kerül,
  a meglévő táblákba:
  - `Recipe` + `RecipeIngredient`: referenciaételek. A `system:keto-mentor` nyilvános
    receptjeiként kerülnek be, mint a mostani 15 magyar változat.
  - `FoodServing`: egységsúlyok.
  - `FoodAlias`: nevek, szinonimák.
  - `Food`: csak hivatalos forrásból importált új katalógusrekordokhoz.
- Új tábla vagy oszlop csak akkor, ha a meglévők tényleg nem elegendők. Ilyenkor előbb
  rövid javaslat a PR-leírásban, implementáció nélkül.
- **Az igazságforrás a repóban lévő, emberileg olvasható forrásfájl.**
  - Mintája a `data/reference-dishes/build.py`: vagy országonként egy fájl
    (`hu.py`, `at.py`, `de.py`), vagy a meglévő bővítése.
  - Minden kézzel beírt szám csak itt lehet, minden más számolt érték.
  - Ebből generált TS-adat és idempotens seed tölti fel az adatbázist
    (`apps/api/src/reference-dishes/seed.ts`).
- Minden rekord kap országcímkét (`HU`, `AT`, `DE`, vagy többet) és nyelvi címkéket
  (`hu`, `de`, `de-AT`, `en`).

## Terjedelem országonként – négy kategória

Mind a három ország mind a négy kategóriát megkapja. Az alábbi listák kiindulópontok:
egészítsd ki őket a források alapján, a ténylegesen leggyakrabban evett ételek felé.

### 1. Hagyományos ételek

- **HU** (a meglévő 10 mellé): halászlé-változatok, töltött paprika, csirkepaprikás,
  pörköltek, főzelékek (tök-, borsó-, krumpli-, spenót-, lencse-), rakott káposzta,
  hortobágyi palacsinta, túrós csusza, somlói galuska, Gundel palacsinta, bableves,
  Jókai bableves, gyümölcsleves, meggyleves.
- **AT**: Wiener Schnitzel (borjú/sertés), Tafelspitz, Rindsgulasch, Schweinsbraten,
  Backhendl, Zwiebelrostbraten, Semmelknödel, Kaiserschmarrn, Käsespätzle, Kasnocken,
  Kärntner Kasnudeln, Krautfleckerl, Frittatensuppe, Leberknödelsuppe, Grießnockerlsuppe,
  Marillenknödel, Apfel- és Topfenstrudel, Palatschinken, Germknödel.
- **DE**: Schweinebraten, Rouladen, Sauerbraten, Eisbein/Schweinshaxe, Königsberger
  Klopse, Maultaschen, Spätzle, Kartoffelsalat (északi és déli változat), Bratkartoffeln,
  Leberkäse, Weißwurst, Labskaus, Grünkohl mit Pinkel, Erbsensuppe, Linseneintopf,
  Kartoffelsuppe, Schwarzwälder Kirschtorte.

### 2. Gyakori, mindennapi ételek (otthon, menza, reggeli, vacsora)

- Reggelik és szendvicsek: zsíros kenyér, Butterbrot, Wurstbrot, Käsebrot.
- Tojásételek: rántotta/Eierspeis/Rührei.
- Virsli/Frankfurter/Wiener mustárral.
- Müzli, joghurtos tálak.
- Menzaételek: rizs csirkemellel, bolognai tészta, rántott hús krumplival.
- Saláták: görög, Caesar, Krautsalat, uborkasaláta.
- Gyakori péksütemények: kifli, pogácsa, Kornspitz, Brezel, croissant, Buchtel,
  Berliner/Krapfen, túrós táska.

### 3. Street food

- **HU**: lángos (natúr, fokhagymás, sajtos-tejfölös), kürtőskalács, hurka-kolbász
  mustárral, budapesti hot dog, gyros tál/pita, pogácsa.
- **AT**: Käsekrainer, Bosna, Burenwurst, Leberkäsesemmel, Kebab/Dürüm, osztrák
  Langos, Maroni.
- **DE**:
  - Currywurst (bőrrel/bőr nélkül, sült krumplival);
  - Döner Kebab/Dürüm/Döner-Teller;
  - Bratwurst im Brötchen, Thüringer Rostbratwurst;
  - Fischbrötchen (Matjes, Bismarck, Backfisch);
  - Frikadellenbrötchen, Brezel mit Butter;
  - Reibekuchen/Kartoffelpuffer almaszósszal, Flammkuchen.

Mindhárom országban közös: szelet pizza, falafel wrap, hot dog, palacsinta/crêpe.

### 4. Gyorsétteremláncok

- Mindhárom országban jelen lévő láncok: McDonald's, Burger King, KFC, Subway,
  Domino's/pizzaláncok, Starbucks italok.
- Országos láncok, például:
  - HU: Pizza Forte, helyi gyros-láncok;
  - AT: Nordsee, Wienerwald, Leberkas-Pepi;
  - DE: Nordsee, Kamps, Ditsch, Kochlöffel, Vapiano.
- A **fő menütételek** kellenek:
  - burgerek, wrapek;
  - nuggets/csíkok darabszám szerint;
  - sült krumpli S/M/L;
  - fő köretek, szószok;
  - fő italok és a leggyakoribb desszertek.
- **Tápérték-forrás:** a lánc adott országra vonatkozó hivatalos tápérték-táblázata
  (PDF vagy weboldal), URL-lel és letöltési dátummal. Az országos változatok eltérhetnek,
  ezért külön tárold őket.
- A márkanevek (Big Mac, Whopper, Zinger, Chicken McNuggets…) aliasok.
- A felületen semleges megnevezés kell. „Big Mac (McDonald's)” rendben van, de a lánc
  logója és arculata nem használható.
- Ezek **egyedi termékek, nem receptek**:
  - `Food` rekordként kerülnek be, `source: "chain_official"` forrással;
  - a lánc 100 g-ra vetített értékeivel, vagy adagra vetített értékkel és az adag
    súlyával;
  - egy darab vagy menüméret `FoodServing`-ként.

## Regionális szókincs (kötelező aliasok, mindkét irányban)

| Osztrák | Német | Magyar | Angol |
|---|---|---|---|
| Paradeiser | Tomate | paradicsom | tomato |
| Erdäpfel | Kartoffeln | burgonya/krumpli | potato |
| Karfiol | Blumenkohl | karfiol | cauliflower |
| Kren | Meerrettich | torma | horseradish |
| Topfen | Quark | túró | quark |
| Schlagobers | Sahne | tejszín | cream |
| Rahm | saure Sahne/Schmand | tejföl | sour cream |
| Faschiertes | Hackfleisch | darált hús | minced meat |
| Semmel | Brötchen/Schrippe/Weck | zsemle | bread roll |
| Häferl | Tasse/Becher | bögre | mug |
| Eierspeis | Rührei | rántotta | scrambled eggs |
| Marille | Aprikose | sárgabarack | apricot |
| Fisolen | grüne Bohnen | zöldbab | green beans |
| Kukuruz | Mais | kukorica | corn |
| Staubzucker | Puderzucker | porcukor | icing sugar |
| Kohlsprossen | Rosenkohl | kelbimbó | Brussels sprouts |
| Vogerlsalat | Feldsalat | galambbegysaláta | lamb's lettuce |
| Frankfurter | Wiener Würstchen | virsli | frankfurter |
| Palatschinke | Pfannkuchen/Crêpe | palacsinta | pancake/crêpe |
| Krapfen | Berliner/Pfannkuchen | fánk | doughnut |

Ide tartoznak a német tájnyelvi alakok is (Schrippe, Weck, Semmel; Berlinben a
Pfannkuchen = Berliner) és a magyar köznyelvi alakok (krumpli, virsli, pari).

Minden nyelvre kell egy teszteset arra, hogy a meglévő `unifiedSearch` és
`phraseMentionsDish` mondatban és toldalékkal is megtalálja ezeket.

## Egységsúlyok (FoodServing)

- **Szelet:** felvágottak (Extrawurst, Leberkäse, párizsi, sonka, szalámi), sajtok,
  kenyerek, sütemények, pizzaszelet.
- **Darab:** tojás, péksütemények (zsemle/Semmel/Brötchen, kifli, Kornspitz, Brezel),
  kolbászok, gombócok (Knödel), palacsinta, gyümölcs- és zöldségfélék (ahol számít,
  S/M/L), gyorséttermi termékek.
- **Kanál:** evőkanál/teáskanál olaj, vaj, tejföl, cukor, liszt.
- **Bögre, pohár:** bögre/Häferl/pohár tej, joghurt, üdítő, fröccs/Spritzer, sör
  (0,3/0,5 l).
- **Menüméretek:** sült krumpli és italok S/M/L-ben, láncok és országok szerint.
- **Adag/tányér:** a referenciaételekhez, mély és lapos tányéros kalibrációval, a
  README „Tányér → gramm” része szerint.

Szabályok:

- Ahol lehet, konkrét katalógusrekordhoz kösd (`FoodServing`).
- Ahol az érték egy egész ételosztályra érvényes, a `generic-unit-weights.ts` táblát
  bővítsd, adatvezérelten: a forrásfájlból generálva.
- Az országonként eltérő értékeket külön kezeld (pl. egy szelet kenyér HU vs DE), és
  ne írd felül a meglévőket.
- Minden értékhez kell:
  - forrás: hatósági adagtáblázat, BLS-portion, gyártói kiszerelés, vagy legalább két
    kiskereskedelmi termék átlaga (pl. Spar, Billa, Hofer/Aldi, Lidl, Rewe, Edeka, Tesco);
  - `isEstimated` és `confidence`;
  - az ország a provenance-ben.

## Receptek a referenciaételekhez

- A meglévő háromrétegű modellt kövesd (`food_keys` → `parts` → `dishes`).
  Részenként legyen meg:
  - nyers, ehető tömeg;
  - főzési tömegváltozás;
  - kész tömeg és sűrűség.
- A köret külön választható rész. A köret nélküli változat is legyen meg.
- Ételenként legalább két elismert nyilvános forrást vess össze:
  - HU: mindmegette, nosalty, klasszikus szakácskönyv;
  - AT: gutekueche.at, ichkoche.at, Plachutta;
  - DE: chefkoch, lecker, DGE.
- Tipikus arányokat használj, ne szélsőségeseket. Minden forráshoz legyen URL és
  letöltési dátum.
- Adagméret: az adott ország szokásos adagja (otthon, menza, étterem).

## Tápérték-szabályok (nem alku tárgya)

- **Tápértéket soha ne találj ki, és ne írj be kézzel.** Minden összetevő egy meglévő,
  ellenőrzött katalógusrekordra mutasson.
  - Sorrend: BLS (DE/AT), USDA.
  - OFF csak márkás termékre, `chain_official` csak lánctermékre.
- Ha nincs megfelelő rekord, ne helyettesítsd hasonlóval.
  - Kerüljön az ország hiánylistájára (`data/reference-dishes/<ország>-missing-foods.md`).
  - Ha kell, importáld a hivatalos BLS xlsx-ből a repo meglévő `BlsAdapter`-ével, külön
    migrációban, a `20260926170000_bls_parsley_root_breadcrumbs_debrecziner` mintájára.
- **Szénhidrát-konvenció:** a `carbsPer100g` ÖSSZES szénhidrát, a nettó = összes − rost.
  - A BLS és az EU-címkék (a HU/AT/DE lánctáblázatokat is beleértve) „available”
    szénhidrátot adnak meg. Ezt +rosttal kell tárolni, a provenance-ben
    `carbohydrateBasis: "total_from_available_plus_fiber"` jelöléssel.
  - Ha nincs megadva rost, 0-nak számít, és `fiberBasis: "not_declared_assumed_zero"`
    kerül a provenance-be.
  - Kövesd a meglévő kódot (`nutrition-evidence.ts`, `structured-source-adapters.ts`).
- Minden ételhez `derived_check` jár: a számolt makrókat vesd össze egy nyilvános
  referenciatartománnyal, az eltéréseket írd a check-fájlba.

## Minőség és munkamenet

- **Fázisok**, mindegyik külön PR:
  1. formátumdöntés + 5 étel/ország pilotként (kategóriánként legalább egy);
  2. HU;
  3. AT;
  4. DE;
  5. gyorsétteremláncok (mindhárom ország);
  6. egységsúlyok és aliasok.
- **Minden PR tartalmazza:**
  - a forrásfájlt és a generált fájlokat;
  - a check-riportot ételenként: hozam, sűrűség, tányér → gramm, makró-keresztellenőrzés;
  - a teszteket:
    - a seed idempotens;
    - minden alias feloldódik;
    - minden összetevő létező katalógusrekordra mutat;
    - nincs forrás nélküli szám;
  - zöld `apps/api` és `apps/web` teszteket és `tsc`-t.
- **Általános megoldás, ne egyedi kivétel.** Ha egy ételtípus vagy egység rendszerszinten
  hiányzik, a típust oldd meg („minden Knödel-féle darabsúlya”), ne egyetlen ételt.
- **Éles adatbázisba ne írj, és ne merge-elj.**
  - Minden PR-t a tulajdonos hagy jóvá.
  - Az éles adatbázist csak olvasásra használd, a katalógusrekordok ellenőrzéséhez.
- **Titok, token, chat-azonosító nem kerülhet a repóba.**
