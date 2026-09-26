# Keto Mentor – ütemterv (navigációs lista)

Utolsó frissítés: 2026-09-26 (A, B, C1, D, E élesben; G – egyetlen keresőmező – jóváhagyásra vár).

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
| A1 | **Nettó szénhidrát: a rost kétszer vonódik le a német (BLS) rekordoknál.** A BLS szénhidrátértéke már rost nélküli, az app mégis kivonja belőle a rostot. 555 BLS-rekord, ebből 295-ben van rost, és 56 rekord nettó szénhidrátja most hibásan 0 (pl. sárgarépa 3,6 g a helyes 6,5 g helyett). | Javaslat: a meglévő BLS-rekordokat egy migrációval egységes „teljes szénhidrát” alakra hozzuk (szénhidrát + rost), és az importer is így tölt be. Így az egész app marad a `carbs − fiber` szabálynál, és nem kell mindenhol forrást vizsgálni. Ugyanezt ellenőrizni kell az Open Food Facts rekordoknál is (EU-s adatoknál szintén rost nélküli az érték). | ✅ Élesben (#65, 2026-09-26 05:54 UTC). Ellenőrizve: 0 átváltatlan BLS/OFF rekord maradt, a sárgarépa 9,371 g teljes / 6,471 g nettó szénhidrát. |
| A1b | A **korábban elmentett étkezések** a hibás értékkel lettek elmentve (a tápérték mentéskor rögzül). | Döntés kell: (a) újraszámoljuk a régi tételeket, vagy (b) csak az újakra hat a javítás. Ehhez meg kell számolnom az érintett tételeket, ami felhasználói adat olvasása, ezért engedély kell hozzá. | ✅ Élesben (#65). A krumplis tészta tétel 96,52 → 102,86 g nettó szénhidrát. A többi érintett tétel élőben számolódik, így az is javult. |
| A2 | **Hibás magyar nevek:** a kömény rekordja „Körömfűmag”. A „fehérrépa” tarlórépára mutat, pedig a konyhanyelvben petrezselyemgyökér. A „tejföl” egy 10%-os rekordra mutat, a magyar alap viszont a 20%-os. | Migráció: kömény → „kömény”; a tarlórépa magyar neve „tarlórépa”, a „fehérrépa” pedig a petrezselyemgyökér szinonimája lesz (A3 után). A tejföl alapértelmezése 20% legyen (a 12% / 10% külön választható). Mind a 140 magyar nevet átnéztem, más durva hibát nem találtam. | ✅ Élesben (#65): kömény, nyers tarlórépa, tejföl (10%) / tejföl (20%). |
| A3 | **Hiányzó alapanyagok:** petrezselyemgyökér, zsemlemorzsa, igazi magyar füstölt kolbász (most egy általános „Pork sausage”), a babérlevél magyar neve. | A meglévő importerrel, hivatalos forrásból (BLS / USDA) felvesszük őket, magyar névvel. | ✅ Élesben (#68, 07:08 UTC; 15/15 referenciaétel betöltve): a hivatalos BLS 4.0-ból a projekt saját importerével kiolvasva, migrációval (`20260926170000`): petrezselyemgyökér (G670100), zsemlemorzsa (B821000), debreceni kolbász (W185000, a füstölt kolbász helyett). A „fehérrépa” a petrezselyemgyökér szinonimája lett. Élesítés után a gulyásleves, a marhahúsleves és a 3 rántott hús változat is betöltődik (összesen 15 referenciaétel). |
| A4 | ~~A fokhagymánál fel van cserélve a szénhidrát és a rost.~~ | **Visszavonva:** nem hiba. Az energiaérték kijön belőle, mert a BLS a fokhagyma fruktánjait rostként számolja. | ❌ |
| A5 | **Gyakori magyar szavak nem találják a meglévő rekordot:** a „virsli” nem találja a „Wiener Würstchen”-t, a „babérlevél” helyett bab és alma jött. | Az alapanyag-kulcsok (`food_keys`) magyar/német/angol nevei a katalógusba kerülnek, ellenőrzött szinonimaként. | ✅ Élesben (#65): virsli és a többi név. |

## B. Referenciaételek bekötése

| # | Lépés | Állapot |
|---|---|---|
| B1 | Adatszerkezet az appban. Javaslat: a meglévő recept-rendszert használjuk, egy „rendszer” tulajdonos alatt, nyilvános, ellenőrzött receptként. Így a tápérték-számítás és a „saját változat” ingyen jön. | ✅ Élesben (#66, 06:05 UTC): rendszerfiók (`system:keto-mentor`) nyilvános receptjei, változatonként pontosan 1 szokásos adag. |
| B2 | Betöltő, ami a `hu-pilot.json`-t az A-lépések után beolvassa | ✅ Élesben (#66, 06:05 UTC): a generátor TS-adatot ír, a seed minden indításkor betölti (csak új adatverziónál ír). Hiányzó katalógusrekord esetén a változat kimarad (most: gulyásleves, marhahúsleves és a 3 rántott hús változat, amíg A3 nincs kész; élesben 10 változat töltődött be: halászlé, töltött káposzta, paprikás csirke nokedlivel, 4 sertéspörkölt, lecsó virslivel, rakott krumpli, székelykáposzta). |
| B3 | Keresési sorrend: saját receptek → referenciaételek → webes keresés. Ami egyikben sincs benne, ugyanúgy megy, mint most. | ✅ Élesben (#66, 06:05 UTC): saját receptek → referenciaételek → web. |
| B4 | Köret kezelése: ha nincs megmondva, rákérdez („rántott hús” → burgonya vagy rizs?) | ✅ Élesben (#66, 06:05 UTC): nyitott köretnél választási lista (pl. rántott hús → magában / petrezselymes burgonyával / párolt rizzsel). |

## C. Saját receptek

| # | Lépés | Állapot |
|---|---|---|
| C1 | Megtalálja a mentett receptet ahhoz is, amit mondasz („paprikás krumpli”), nem csak a pontos címhez („A legfinomabb paprikás krumpli”) | ✅ Élesben (#66, 06:05 UTC): a cím lényegi szavai alapján is talál (A legfinomabb paprikás krumpli = paprikás krumpli). Közben kiderült: a talált saját receptet a felület eddig hozzá sem engedte adni, és választani sem lehetett – ez is javítva. |
| C2 | Kézi javítás után ne jöjjön létre minden alkalommal új példány; a javított változatot használja újra | ⬜ |
| C3 | Az elfogadás („Hozzáadás”) ne futtassa újra a teljes feldolgozást (most kb. +8 s) | ⬜ |
| C4 | Megosztás a közösségi receptek között. A háttér már tudja; kell hozzá felület, és a közösségi recept csak javaslatként jelenhet meg. | ⬜ |

## D. Saját tányérok (fotó nélkül)

| # | Lépés | Állapot |
|---|---|---|
| D1 | A fotós / érmés / kártyás becslés eltávolítása | ✅ Élesben (#67, 06:20 UTC): a fotós / érmés / kártyás becslés teljesen kikerült (felület, API, AI-hívás, beállítás). |
| D2 | Saját tányérok: név, típus (mély: ml; lapos: átmérő cm), a meglévő tányérlista átalakítása | ✅ Élesben (#67, 06:20 UTC): mély tányér ml-ben (vízzel kimérve), lapos tányér átmérővel (cm). Felvétel, szerkesztés, törlés, felhasználónként legfeljebb 10. A régi, fotóval mentett tányér lapos tányérként megmarad; ha pontatlan, törölhető és újra felvehető. |
| D3 | „Egy tányér …” → a mentett tányérok felajánlása, töltöttség (félig / normál / tele, illetve kevés / normál / púpozott), gramm a sűrűségből | ✅ Élesben (#67, 06:20 UTC): „Tányér alapján” gomb a mennyiség mellett. A mentett tányérok azonnal megjelennek, és a töltöttség szerint (félig / normál / tele, illetve kevés / normál / púpozott) grammot számol. Referenciaételnél az étel saját sűrűségével és lapos-tányér paramétereivel számol, egyébként általános becsléssel, amit ki is ír. |

## E. Összetevő-párosítás

| # | Lépés | Állapot |
|---|---|---|
| E1 | A betű alapú visszaellenőrzés helyett az alapanyag-kulcsokra és jelentésre épülő döntés. Most ez dobja el a jó virsli-találatokat. | ✅ Élesben (#69, 07:26 UTC): ha a lefordított név nem tartalmazza a felhasználó szavát, már nem dobja el automatikusan, hanem az AI-ellenőrző dönt a felhasználó eredeti szavával (virsli ↔ frankfurti: marad; tejföl ↔ sajt: kiesik). Ha nincs AI-ellenőrző, marad a régi, szigorú szabály. |
| E2 | Fő összetevőknél (a tömeg nagy része) bizonytalan párosításkor kérdezzen; fűszernél elfogadhatja | ✅ Vizsgálat, kód nélkül: az automatikus párosítás már most is szigorú (helyben csak pontos név / ellenőrzött szinonima, külső rekordnál AI „ugyanaz” ítélet + névlefedés + hiteles forrás). A valós hibák a rossz nevekből (A2/A5) és a túl szigorú elvetésből (E1) jöttek. |
| E3b | Webes tápérték-bizonyíték (EU-s címkék): a szénhidrát ott is lehet rost nélküli, ezt külön kell kezelni. | ✅ Élesben (#69, 07:26 UTC): a webes címke szénhidrátjáról az energiaérték dönti el, hogy rosttal együtt vagy nélküle értendő (bizonytalan esetben a címke EU-s eredete). Teljes szénhidrátként tárolja, jelölővel. |
| E3 | Az AI-becslés korlátja (3 db / 15 perc) felülvizsgálata. A 2. futásban ez hagyta a virslit kézi javításra. | ✅ Élesben (#69, 07:26 UTC): AI-becslés és webes tápérték-keresés felhasználónként óránként 30 / naponta 100, receptenként legfeljebb 8. Ugyanarra az összetevőre 24 órán át újrahasznosítja az eredményt: nem hív újra AI-t, és a keretből sem fogy. |
| E4 | A kézi keresőmező (ételkereső) jelentés szerint is találjon: ha nincs pontos találat, az AI által szabványosított névvel és a szinonimákkal keressen újra (pl. „virsli” → frankfurti / Wiener Würstchen). | 🔄 PR-ben, a G1 részeként. |

## G. Egyetlen keresőmező (a tulajdonos célja, 2026-09-26)

| # | Lépés | Állapot |
|---|---|---|
| G1 | Közös keresési végpont: vonalkód (8–14 számjegy), alapanyag, saját recept, referenciaétel egy listában; jelentés szerinti keresés (E4) | 🔄 PR-ben: `GET /search` – vonalkód (8–14 számjegy) felismerése; saját recept (a cím lényegi szavaival), referenciaétel (részleges névvel), alapanyag egy listában. Gépelésnél nincs AI; `meaning=1` = jelentés szerinti újrakeresés (E4), felhasználónként 15 percenként legfeljebb 30. |
| G2 | Egyetlen „Mit ettél?” mező: gépelés közben javaslatok, Enter/hang = teljes értelmezés, kamera ikon a vonalkódhoz; a külön ételkereső és vonalkód blokk kivezetése | 🔄 PR-ben: egyetlen „Mit ettél?” mező, gépelés közbeni javaslatlistával (saját recept / ételadatbázis / alapanyag, jelentés szerinti találat jelölve), Enter = teljes értelmezés, vonalkód esetén vonalkódos keresés, kamera és hang gomb. A külön ételkereső lista és vonalkód blokk kikerült. |
| G3 | Egységes mennyiség és hozzáadás (gramm / adag / tányér), automatikus, utólag szerkeszthető étkezésnév | 🔄 PR-ben: a mennyiség és a hozzáadás csak kiválasztás után jelenik meg; receptnél adag / gramm / tányér; az étkezés neve automatikus (a kiválasztott étel neve), a mező opcionális. |

## F. Később

| # | Lépés | Állapot |
|---|---|---|
| F1 | Bővítés: az európai országok és az USA gyakori ételei | ⬜ |
| F2 | Mérés: az ételek hány százalékát fedik le a referenciaételek | ⬜ |
