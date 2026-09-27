# Hiányzó katalógusrekordok – HU (generált)

Ezekhez az ételrészekhez nincs ellenőrzött katalógusrekord. Nem helyettesíthetők hasonlóval;
a hivatalos forrásból (BLS xlsx, `BlsAdapter`) külön migrációban kell importálni őket.

| food_key | Név | Kell ehhez | Megjegyzés |
|---|---|---|---|
| `tarragon_dried` | tárkony (szárított) / Estragon getrocknet / dried tarragon | hu_palocleves (1 ek per 5 adag, seasoning) | BLS 4.0 has no Estragon record and the production catalog has none; left out of the batch (about 2 g). Candidate: USDA FDC 'Spices, tarragon, dried' via a reviewed import. |
| `dry_red_wine` | száraz vörösbor / Rotwein trocken / dry red wine | hu_lasagne (1,25 dl per 4 adag) | cat.py 'Rotwein' finds only Rotwein süß / lieblich and punches; no dry red wine record. Left out (most alcohol evaporates while simmering). Candidate: BLS 4.0 Rotwein (if present under another name) or USDA 'Alcoholic beverage, wine, table, red'. |
| `pickled_cucumber` | ecetes uborka (savanyú uborka) / Gewürzgurke / Essiggurke / pickled gherkin | hu_franciasalata (10 dkg per 4 adag) | cat.py 'Gewürzgurke|Essiggurke|Gurke.*gesäuert' finds only Honiggurke and Senfgurke gesäuert (sweeter, different foods). Left out. Candidate: USDA 'Pickles, cucumber, dill or kosher dill' (usda_fdc 324653 is already listed in the production catalog). |
| `pork_cracklings` | tepertő (darált) / Grieben / Grammeln / pork cracklings | hu_tepertos_pogacsa (25 dkg darált tepertő per 50 dkg liszt, ~1/4 of the dough) | BLS 4.0 has no Grieben/Grammeln record (searched Griebe|Grammel|Speck) and the production catalog has none. It is the defining ingredient, so tepertős pogácsa was NOT built (stays in the inventory). Candidate: USDA FDC 'Pork skins/cracklings' via a reviewed import, or a Hungarian label. |
| `pork_trotter` | sertésköröm / Schweinefuß / Spitzbein / pork trotter | hu_koromporkolt (core, ~1-2 kg per 4-6 adag) | BLS 4.0 has no Schweinefuß/Spitzbein/Pfötchen record (searched Fuß, Pfote, Spitzbein, Schwarte); körömpörkölt NOT built. Candidate: USDA FDC 'Pork, fresh, variety meats and by-products, feet, raw' via a reviewed import. |
| `dry_red_wine` | száraz vörösbor / Rotwein trocken / dry red wine | hu_marhaporkolt (3 dl per 12 adag), hu_vadporkolt (3 dl per 8 adag) | BLS has only Rotwein süß/lieblich (P2A1000/P2A2000); no dry red wine. Left out; most alcohol evaporates, small kcal underestimate. Candidate: USDA 'Alcoholic beverage, wine, table, red'. |
| `dry_white_wine` | száraz fehérbor / Weißwein trocken / dry white wine | hu_bakonyi_sertesszelet (0,5 dl per 4 adag), hu_vadas_marha (1,5 dl per 4 adag), hu_tokany (1 dl per 5 adag) | BLS has only Weißwein süß/lieblich/Beerenauslese; no dry white wine. Left out. Candidate: USDA 'Alcoholic beverage, wine, table, white'. |
| `orange_juice` | narancslé (frissen facsart) / Orangensaft / orange juice | hu_vadas_marha (1 narancs leve, ~80 g, per 4 adag) | BLS 4.0 export has only Orangennektar (F603700), not juice; left out. Candidate: USDA 'Orange juice, raw'. |
| `paprika_paste` | daráltpaprika-krém (Piros Arany) / Paprikapaste (ungarisch) / Hungarian paprika paste | hu_rizses_hus (2 ek per 4 adag) | No BLS record for salted ground paprika paste; left out (~30 g). Candidate: a reviewed product record (Piros Arany label). |
| `cooking_cream_20` | főzőtejszín (20%) / Kochsahne 20 % / cooking cream 20% | hu_gombapaprikas (1 dl per 4 adag) | BLS has Kaffeesahne 10 % and Schlagsahne 30/36 %, no 20 % cooking cream; left out. Candidate: USDA 'Cream, fluid, light (coffee cream or table cream)' (~19 % fat). |
| `dill_fresh` | kapor (friss) / Dill, frisch / dill, fresh | hu_kapros_turos_lepeny (2 csomag, ~20 g) | BLS search 'dill' finds only composite dishes (Lachs-Dillcreme, Hering in Dillcreme); no raw Dill record and none in production. Left out. Candidate: USDA FDC 'Dill weed, fresh'. |
| `cinnamon_ground` | fahéj (őrölt) / Zimt gemahlen / ground cinnamon | hu_turogomboc / hu_szilvas_gomboc (serving pinch, optional) | BLS has no plain Zimt record (only Zimtschnecken, Zimtsterne etc.). Only a pinch for serving; left out. Candidate: USDA FDC 'Spices, cinnamon, ground'. |
| `cooking_cream_20` | főzőtejszín (20%) / Kochsahne 20 % / cooking cream 20% | hu_tarkonyos_raguleves (alternative recipes: 1,5-2 dl), hu_meggyleves (alternative recipe: 2,5 dl) | BLS has Kaffeesahne 10 % and Schlagsahne 30/36 % only; no 20 % cooking cream. Built dishes use recipes with tejföl / habtejszín instead. Candidate: USDA 'Cream, fluid, light (coffee cream or table cream)' (~19 % fat) via a reviewed import. |
| `inventory-only` | körömpörkölt | traditional | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | juhászos tokány | traditional | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | tepertős pogácsa | everyday | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | fokhagymás lángos | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | sajtos-tejfölös lángos | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | töltött lángos | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | kürtőskalács | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | sült kolbász kenyérrel | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | hurka mustárral | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | véres hurka | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | májas hurka | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | budapesti hot dog | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | hot dog | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | gyros pita | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | gyros tál | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | döner | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | döner tál | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | falafel wrap | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | hamburger | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | sajtos hamburger | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | pulled pork szendvics | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | szelet pizza | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | tócsni | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | lapcsánka | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | hekk | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | lángos | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | hasábburgonya | street_food | inventory identity; recipe/ingredient mapping still required |
| `inventory-only` | gofri | street_food | inventory identity; recipe/ingredient mapping still required |
