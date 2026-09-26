# Referenciaételek – pilot (10 magyar étel)

Állapot: **javaslat, még nincs bekötve az alkalmazásba.** A tulajdonos jóváhagyása után kerül a kódba.

Fájlok:

| Fájl | Mi ez |
|---|---|
| `build.py` | Az egyetlen forrás. Minden kézzel beírt szám itt van; a többit ez számolja. |
| `hu-pilot.json` | A generált adatbázis (ezt töltené be az app). |
| `hu-pilot-ingredients.csv` | Ugyanez táblázatban, átnézéshez. |
| `hu-pilot-check.md` | Ellenőrző táblázat: hozam, sűrűség, tányér → gramm, tápérték-keresztellenőrzés. |

Újragenerálás: `python3 data/reference-dishes/build.py`

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

- **Hiányzik a katalógusból** (import kell):
  - petrezselyemgyökér (gulyásleves, marhahúsleves) – a paszternák NEM ugyanaz;
  - zsemlemorzsa (rántott hús).

  Addig ezeknél a részeknél a tápérték hiányos.
- **Hibás katalógusadat:** a kömény magyar neve „Körömfűmag”, a „fehérrépa” tarlórépára mutat. (A fokhagyma BLS-értéke nem hibás: a fruktánok ott rostként szerepelnek.) A teljes lista: `docs/ROADMAP.md`, A szakasz.
- **Általános hiba a kódban (nem ebben az adatbázisban):**
  - A BLS-rekordok `carbs` mezője már rost nélküli érték.
  - Az app mégis mindenhol `carbs − fiber`-t számol, így a BLS-ételeknél a rost kétszer vonódik le. A nettó szénhidrát emiatt túl alacsony lesz, főleg zöldségeknél.
  - Példa: sárgarépa 3,6 g a helyes 6,5 g helyett.
- **Pontosítandó rekord:** a `smoked_sausage` (füstölt kolbász) most egy általános „Pork sausage”. Egy magyar füstölt kolbász rekord jobb lenne.
- **Később külön étel legyen:**
  - bajai halászlé;
  - virsli nélküli lecsó;
  - marhahúsleves tésztával, illetve „csak a leve”.
