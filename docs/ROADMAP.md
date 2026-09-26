# Keto Mentor – ütemterv (navigációs lista)

Utolsó frissítés: 2026-09-26 (A csomag elkezdve). Minden lépés után ezt a fájlt frissítem, így mindig látszik, mi van kész és mi nincs.

Jelölések:
- ✅ kész
- 🔄 folyamatban
- ⬜ még nem kezdtük
- ⏸️ jóváhagyásra vár
- ❌ elvetve

Egy lépés akkor ✅, ha élesben van és ellenőriztem. Ha csak a kódban kész, azt külön írom.

## 0. Előkészítés

| # | Lépés | Állapot | Megjegyzés |
|---|---|---|---|
| 0.1 | A lassúság, a párosítási hibák, a krumplipehely és a tányéros becslés vizsgálata | ✅ | Logok, kód, éles katalógus (csak olvasva) |
| 0.2 | 10 ételes referencia-adatbázis, 0.2-es szerkezet | ✅ (csak adat) | `data/reference-dishes/`; még nincs bekötve az appba |
| 0.3 | Ez az ütemterv | ✅ | |

## A. Katalógus- és adathibák

Ezek minden ételre hatnak, nem csak a 10 referenciaételre.

| # | Hiba | Mit csinálunk vele | Állapot |
|---|---|---|---|
| A1 | **Nettó szénhidrát: a rost kétszer vonódik le a német (BLS) rekordoknál.** A BLS szénhidrátértéke már rost nélküli, az app mégis kivonja belőle a rostot. 555 BLS-rekord, ebből 295-ben van rost, és 56 rekord nettó szénhidrátja most hibásan 0 (pl. sárgarépa 3,6 g a helyes 6,5 g helyett). | Javaslat: a meglévő BLS-rekordokat egy migrációval egységes „teljes szénhidrát” alakra hozzuk (szénhidrát + rost), és az importer is így tölt be. Így az egész app marad a `carbs − fiber` szabálynál, és nem kell mindenhol forrást vizsgálni. Ugyanezt ellenőrizni kell az Open Food Facts rekordoknál is (EU-s adatoknál szintén rost nélküli az érték). | 🔄 Kód + migráció kész, PR-ben, élesítésre vár. Az importer és az OFF adapter teljes szénhidrátot tárol; a `20260926120000_carbs_total_basis` migráció a meglévő 555 BLS- és 3 OFF-rekordot váltja át. Helyi Postgresen kétszer lefuttatva ellenőrizve. |
| A1b | A **korábban elmentett étkezések** a hibás értékkel lettek elmentve (a tápérték mentéskor rögzül). | Döntés kell: (a) újraszámoljuk a régi tételeket, vagy (b) csak az újakra hat a javítás. Ehhez meg kell számolnom az érintett tételeket, ami felhasználói adat olvasása, ezért engedély kell hozzá. | 🔄 Megszámolva: az összes 31 tételből 3 közvetlen BLS/OFF-tétel (élőben számolódik, a migráció kijavítja) és 1 rögzített recepttétel (krumplis tészta, kb. +6,9 g nettó CH). Ezt a migráció pontosan korrigálja. PR-ben. |
| A2 | **Hibás magyar nevek:** a kömény rekordja „Körömfűmag”. A „fehérrépa” tarlórépára mutat, pedig a konyhanyelvben petrezselyemgyökér. A „tejföl” egy 10%-os rekordra mutat, a magyar alap viszont a 20%-os. | Migráció: kömény → „kömény”; a tarlórépa magyar neve „tarlórépa”, a „fehérrépa” pedig a petrezselyemgyökér szinonimája lesz (A3 után). A tejföl alapértelmezése 20% legyen (a 12% / 10% külön választható). Mind a 140 magyar nevet átnéztem, más durva hibát nem találtam. | 🔄 Migráció kész (`20260926130000_hungarian_catalog_names`) + manifest (a „tejföl 10%” minősített név), PR-ben. |
| A3 | **Hiányzó alapanyagok:** petrezselyemgyökér, zsemlemorzsa, igazi magyar füstölt kolbász (most egy általános „Pork sausage”), a babérlevél magyar neve. | A meglévő importerrel, hivatalos forrásból (BLS / USDA) felvesszük őket, magyar névvel. | ⏸️ Engedélyezve, de technikailag még blokkolt: a környezet hálózati beállításában kell felvenni a blsdb.de, fdc.nal.usda.gov és api.nal.usda.gov domaineket. |
| A4 | ~~A fokhagymánál fel van cserélve a szénhidrát és a rost.~~ | **Visszavonva:** nem hiba. Az energiaérték kijön belőle, mert a BLS a fokhagyma fruktánjait rostként számolja. | ❌ |
| A5 | **Gyakori magyar szavak nem találják a meglévő rekordot:** a „virsli” nem találja a „Wiener Würstchen”-t, a „babérlevél” helyett bab és alma jött. | Az alapanyag-kulcsok (`food_keys`) magyar/német/angol nevei a katalógusba kerülnek, ellenőrzött szinonimaként. | 🔄 Ugyanabban a migrációban, PR-ben. |

## B. Referenciaételek bekötése

| # | Lépés | Állapot |
|---|---|---|
| B1 | Adatszerkezet az appban. Javaslat: a meglévő recept-rendszert használjuk, egy „rendszer” tulajdonos alatt, nyilvános, ellenőrzött receptként. Így a tápérték-számítás és a „saját változat” ingyen jön. | ⬜ |
| B2 | Betöltő, ami a `hu-pilot.json`-t az A-lépések után beolvassa | ⬜ |
| B3 | Keresési sorrend: saját receptek → referenciaételek → webes keresés. Ami egyikben sincs benne, ugyanúgy megy, mint most. | ⬜ |
| B4 | Köret kezelése: ha nincs megmondva, rákérdez („rántott hús” → burgonya vagy rizs?) | ⬜ |

## C. Saját receptek

| # | Lépés | Állapot |
|---|---|---|
| C1 | Megtalálja a mentett receptet ahhoz is, amit mondasz („paprikás krumpli”), nem csak a pontos címhez („A legfinomabb paprikás krumpli”) | ⬜ |
| C2 | Kézi javítás után ne jöjjön létre minden alkalommal új példány; a javított változatot használja újra | ⬜ |
| C3 | Az elfogadás („Hozzáadás”) ne futtassa újra a teljes feldolgozást (most kb. +8 s) | ⬜ |
| C4 | Megosztás a közösségi receptek között. A háttér már tudja; kell hozzá felület, és a közösségi recept csak javaslatként jelenhet meg. | ⬜ |

## D. Saját tányérok (fotó nélkül)

| # | Lépés | Állapot |
|---|---|---|
| D1 | A fotós / érmés / kártyás becslés eltávolítása | ⬜ |
| D2 | Saját tányérok: név, típus (mély: ml; lapos: átmérő cm), a meglévő tányérlista átalakítása | ⬜ |
| D3 | „Egy tányér …” → a mentett tányérok felajánlása, töltöttség (félig / normál / tele, illetve kevés / normál / púpozott), gramm a sűrűségből | ⬜ |

## E. Összetevő-párosítás

| # | Lépés | Állapot |
|---|---|---|
| E1 | A betű alapú visszaellenőrzés helyett az alapanyag-kulcsokra és jelentésre épülő döntés. Most ez dobja el a jó virsli-találatokat. | ⬜ |
| E2 | Fő összetevőknél (a tömeg nagy része) bizonytalan párosításkor kérdezzen; fűszernél elfogadhatja | ⬜ |
| E3b | Webes tápérték-bizonyíték (EU-s címkék): a szénhidrát ott is lehet rost nélküli, ezt külön kell kezelni. | ⬜ |
| E3 | Az AI-becslés korlátja (3 db / 15 perc) felülvizsgálata. A 2. futásban ez hagyta a virslit kézi javításra. | ⬜ |

## F. Később

| # | Lépés | Állapot |
|---|---|---|
| F1 | Bővítés: az európai országok és az USA gyakori ételei | ⬜ |
| F2 | Mérés: az ételek hány százalékát fedik le a referenciaételek | ⬜ |
