# Hiányzó katalógusrekordok – DE (generált)

Ezekhez az ételrészekhez nincs ellenőrzött katalógusrekord. Nem helyettesíthetők hasonlóval;
a hivatalos forrásból (BLS xlsx, `BlsAdapter`) külön migrációban kell importálni őket.

| food_key | Név | Kell ehhez | Megjegyzés |
|---|---|---|---|
| `gherkin_plain` | csemegeuborka / Gewürzgurke (Essiggurke) / pickled gherkin | rinderrouladen (3 Gewürzgurken), kartoffelsalat_nord (1 Glas Cornichons), labskaus (10 Gewürzgurken + 60 ml Gurkenwasser), heringsstipp (4 Gewürzgurken) | BLS 4.0 lists only Salzdillgurke (milchsauer) and sweet-sour Honig-/Senfgurke; a vinegar-pickled Gewürzgurke is none of these (same gap as the Austrian Essiggurkerl). Left out. |
| `dry_red_wine` | száraz vörösbor / Rotwein trocken / dry red wine | sauerbraten (200 ml of the marinade), rotkohl (1 Schuss) | BLS 4.0 P2A3000 exists, but its fat field is 'TR', which BlsAdapter rejects (see at-missing-foods). Left out. |
| `dry_white_wine` | száraz fehérbor / Weißwein trocken / dry white wine | nuernberger_sauerkraut (100 ml), hollandaise (75 ml) | BLS 4.0 P210000 exists, but BlsAdapter rejects its '<LOD'/'TR' fields. Left out. |
| `nutmeg` | szerecsendió / Muskatnuss / nutmeg | kartoffelkloesse, koenigsberger_klopse, senfeier, huehnerfrikassee, gruenkohl_pinkel, maultaschen, schupfnudeln_sauerkraut, steckruebeneintopf, gaisburger_marsch, hochzeitssuppe (a pinch each) | No Muskat record in BLS 4.0 or the catalog; a pinch, left out. |
| `marjoram_dried` | majoránna / Majoran / dried marjoram | maultaschen (1 EL) | No Majoran record in BLS 4.0 or the catalog; left out. |
| `green_sauce_herbs` | borágó, turbolya, csabaíre / Borretsch, Kerbel, Pimpinelle / borage, chervil, salad burnet | gruene_sosse (20 g each) | No BLS 4.0 record for these three of the seven Grüne-Soße herbs; left out (parsley, chives, cress and sorrel are linked). |
| `lovage_savory_thyme` | lestyán, borsikafű, kakukkfű / Liebstöckel, Bohnenkraut, Thymian / lovage, summer savory, thyme | linseneintopf (20 g Liebstöckel), bohneneintopf (1 Bund Bohnenkraut), pichelsteiner (0.5 TL Thymian) | No BLS 4.0 records for these herbs; left out. |
| `curry_powder` | curry fűszerpor / Currypulver / curry powder | matjes_hausfrauen (a pinch) | BLS 4.0 has curry only in composite foods; left out (as in at-missing-foods). |
| `blackcurrant_liqueur` | feketeribizli-likőr / Johannisbeerlikör / blackcurrant liqueur | rote_gruetze (4 cl) | No liqueur record of this kind in BLS 4.0 or the catalog; left out. |
| `cinnamon` | fahéj / Zimt / cinnamon | arme_ritter (1 TL) | No ground-cinnamon record in BLS 4.0 or the catalog; left out (as in at-missing-foods). |
| `gherkin_plain` | csemegeuborka / Gewürzgurke / pickled gherkin | strammer_max (4 Gewürzgurken) | No vinegar-pickled gherkin record (see de_traditionell). |
| `herb_butter` | fűszervaj / Kräuterbutter / herb butter | nudelauflauf (1 TL) | No Kräuterbutter record in BLS 4.0 or the catalog; left out (not replaced by plain butter). |
