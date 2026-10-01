# Referenciaételek – regionális katalógus (HU, AT, DE)

Állapot: **1. fázis: formátum és generátor**, kategóriánként egy-két mintával. A teljes
országos készletek a 2–4. fázisban (HU, AT, DE), a láncok az 5., az egységsúlyok és
aliasok a 6. fázisban jönnek. Feladatleírás: `docs/REGIONAL_DATABASE_BRIEF.md`.

## Formátumdöntés

A kézzel írt igazságforrás **országonként egy Python-modul**, hogy egy átnéző egyszerre
egy országot olvasson, és semmi ne legyen kétszer leírva:

| Fájl | Mi ez |
|---|---|
| `foods.py` | Alapanyag-kulcsok (`food_key` → egy ellenőrzött katalógusrekord), minden országnak közös. |
| `hu.py`, `at.py`, `de.py` | Az ország ételei (`PARTS`, `DISHES`), egységsúlyai (`SERVINGS`, `UNIT_CLASSES`), aliasai (`FOOD_ALIASES`), lánctermékei (`CHAIN_PRODUCTS`) és hiánylistája (`MISSING_FOODS`). |
| `shared.py` | Több országban ugyanígy evett ételek (pl. rántotta / Eierspeis / Rührei). |
| `common.py` | Segédfüggvények, az engedett országok, kategóriák és nyelvi címkék, tányérmodell. |
| `build.py` | Generátor: csak ellenőriz és számol, kézi szám nincs benne. |

Generált kimenetek (kézzel nem szerkeszthetők):

| Fájl | Mi ez |
|---|---|
| `reference-dishes.json` | A teljes generált adatbázis, átnézéshez. |
| `reference-dishes-ingredients.csv` | Részek összetevői táblázatban. |
| `reference-dishes-check.md` | Hozam, sűrűség, tányér → gramm, makró-keresztellenőrzés referenciával, egységsúlyok, lánctermék-adagsúly ellenőrzése. |
| `hu-missing-foods.md`, `at-missing-foods.md`, `de-missing-foods.md` | Katalógusrekord nélküli alapanyagok országonként. |
| `apps/api/src/reference-dishes/reference-data.ts` | Az app ezt tölti be (seed). |
| `apps/api/src/meal-input/generic-unit-weights.data.ts` | Ételosztály-szintű egységsúlyok. |

Újragenerálás: `python3 data/reference-dishes/build.py`. A generátor leáll, ha egy
rekordból hiányzik a kötelező adat.

### Kötelező adatok rekordonként

- **Étel:** `countries` (egy vagy több: `HU`/`AT`/`DE`), `category` (`traditional`,
  `everyday`, `street_food`), aliasok nyelvi címkénként (`hu`, `de`, `de-AT`, `en`),
  `served_in` (`deep_plate`, `flat_plate`, `handheld`), legalább két forrás.
  Opcionális `reference_check`: nyilvános referencia (pl. BLS összetett étel) a
  makró-keresztellenőrzéshez; 15% feletti kcal-eltérést a check-fájl jelöl.
- **Forrás:** mindig `src(url, retrieved)`, letöltési dátummal. A 10 pilot étel forrásai
  a pilot napjának (2026-09-26) dátumát kapták.
- **Egységsúly (`SERVINGS` → `FoodServing`):** katalógusrekordhoz kötve, országonként
  külön kulccsal (pl. `piece_at`), `is_estimated`, `confidence`, forrás. Más importőr
  azonos kulcsú sorát a seed nem írja felül.
- **Ételosztály-súly (`UNIT_CLASSES`):** a `generic-unit-weights.ts` kézi táblája után
  kerül, így meglévő találatot nem változtat; `whole_word` kizárja pl. a
  „Semmelbrösel” találatot.
- **Alias (`FOOD_ALIASES` → `FoodAlias`):** nyelvi címkével (`locale`), csak beszúrás.
- **Lánctermék (`CHAIN_PRODUCTS` → `Food`, `source: chain_official`):** a lánc adott
  országra vonatkozó hivatalos táblázata, URL-lel és dátummal, országonként külön
  rekord (`sourceId`: `lanc-orszag:termek`). Az EU-címke „available” szénhidrátja
  + rost kerül tárolásra (`carbohydrateBasis: total_from_available_plus_fiber`). Ha a
  táblázat nem adja meg az adagsúlyt, a generátor adag-kcal / 100 g-kcal alapján
  számolja, és becsültnek jelöli; a check-fájl kJ-ból és makrókból is ellenőrzi.
- **Hiányzó alapanyag:** nem helyettesíthető hasonlóval, a `MISSING_FOODS`-ba kerül,
  és a BLS xlsx-ből a `BlsAdapter`-rel, külön migrációban importálandó.

### Az 1. fázis mintái

| Kategória | Minta |
|---|---|
| Hagyományos | 10 magyar pilot étel; Schweinsbraten (AT, DE); Bratkartoffeln (DE) |
| Mindennapi | rántotta / Eierspeis / Rührei (HU, AT, DE) |
| Street food | Leberkässemmel / Leberkäsbrötchen (AT, DE) |
| Lánc | Big Mac, McDonald's Österreich |
| Egységsúly | 1 Semmel = 62,5 g (AT, két kiskereskedelmi termék átlaga) |
| Alias | Paradeiser, Erdäpfel, Frankfurter, Semmel/Schrippe/Weck |

## A három réteg

1. **Alapanyag-kulcsok (`food_keys`)** – pl. `frankfurter` = virsli. Mindegyikhez tartozik:
   - magyar, német és angol név;
   - **egy ellenőrzött éles katalógusrekord** (`bls:W211200` = Wiener Würstchen);
   - sűrűség.

   Ez a réteg javítja majd az összetevő-párosítást is. Ha egy receptben „virsli” szerepel, a rendszer nem fordítgat és nem keres, hanem ezt a rekordot használja.
2. **Részek (`parts`)** – egy megfőzött egység. Például a gulyásleves, a nokedli vagy a párolt rizs mind külön rész. Minden résznél megvan:
   - a teljes adag **nyers** összetevőinek grammja (ehető rész, csont nélkül);
   - a főzési tömegváltozás (elpárolgó víz, sütési veszteség, vagy a nokedli/rizs vízfelvétele);
   - ebből a **kész tömeg** és a **sűrűség**.
3. **Ételek (`dishes`)** – amit a felhasználó mond. Egy étel egy vagy több részből áll. A köret külön választható rész, ezért a „rántott hús rizzsel” és a „rántott hús krumplival” is működik. Ha a felhasználó nem mondja meg a köretet, a rendszer rákérdez, és nem találgat.

## Szabályok

- `kész tömeg = nyers összesen + főzési tömegváltozás`
- **Tápérték:** a kapcsolt katalógusrekordok összege osztva a kész tömeggel. A JSON `derived_check` blokkja csak ellenőrzésre való, nem igazságforrás.
- **Nettó szénhidrát:**
  - USDA-rekordnál: szénhidrát − rost;
  - BLS-rekordnál: a tárolt érték, mert az már rost nélküli.
- **Sűrűség:**
  - levesnél és raguféléknél az összetevőkből számolva;
  - laza, száraz résznél (nokedli, rizs, rántott hús, főtt burgonya) a kész étel halmazsűrűsége, a levegőrésekkel együtt.

## Tányér → gramm (fotó és mérlegelés nélkül)

- **Mély tányér:** `kapacitás (ml) × töltöttség × sűrűség`. Töltöttség: félig 0,5, normál 0,75, tele 0,9.
- **Lapos tányér:** `π × (0,8 × átmérő / 2)² × lefedettség × magasság × töltöttség × sűrűség`.
  - Töltöttség: kevés 0,7, normál 1,0, púpozott 1,35.
  - A lefedettség és a magasság ételenként meg van adva úgy, hogy egy 26 cm-es lapos tányér normál adagja a szokásos adagot adja.
  - Példák (26 cm, normál): sertéspörkölt ≈ 318 g, rakott krumpli ≈ 400 g, paprikás csirke nokedlivel ≈ 501 g.

## Ismert hiányok és nyitott kérdések

- **Korábban hiányzott a katalógusból, most pótolva** (migráció `20260926170000`, hivatalos BLS 4.0):
  - petrezselyemgyökér (G670100 Wurzelpetersilie roh) – a paszternák NEM ugyanaz;
  - zsemlemorzsa (B821000 Paniermehl);
  - füstölt kolbász → debreceni (W185000 Debrecziner roh), az általános „Pork sausage” helyett.
- **Hibás katalógusadat:** a kömény magyar neve „Körömfűmag”, a „fehérrépa” tarlórépára mutat. (A fokhagyma BLS-értéke nem hibás: a fruktánok ott rostként szerepelnek.) A teljes lista: `docs/ROADMAP.md`, A szakasz.
- **Általános hiba a kódban (nem ebben az adatbázisban):**
  - A BLS-rekordok `carbs` mezője már rost nélküli érték.
  - Az app mégis mindenhol `carbs − fiber`-t számol, így a BLS-ételeknél a rost kétszer vonódik le. A nettó szénhidrát emiatt túl alacsony lesz, főleg zöldségeknél.
  - Példa: sárgarépa 3,6 g a helyes 6,5 g helyett.
- **Később külön étel legyen:**
  - bajai halászlé;
  - virsli nélküli lecsó;
  - marhahúsleves tésztával, illetve „csak a leve”.
