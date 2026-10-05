# Hiányzó katalógusrekordok – AT (generált)

Ezekhez az ételrészekhez nincs ellenőrzött katalógusrekord. Nem helyettesíthetők hasonlóval;
a hivatalos forrásból (BLS xlsx, `BlsAdapter`) külön migrációban kell importálni őket.

| food_key | Név | Kell ehhez | Megjegyzés |
|---|---|---|---|
| `dry_red_wine` | Rotwein trocken / száraz vörösbor / dry red wine | at_zwiebelrostbraten (200 ml per 4 Portionen) | BLS 4.0 P2A3000 'Rotwein trocken' exists, but its fat field is 'TR' (trace), which BlsAdapter rejects as a missing required macro, so it cannot be imported unchanged. Left out (most alcohol evaporates). Candidate: a reviewed import that reads 'TR' as 0. |
| `dry_white_wine` | Weißwein trocken / száraz fehérbor / dry white wine | at_rahmschnitzel (Schuss), at_faschierter_braten (Schuss) | BLS 4.0 P210000 'Weißwein trocken' exists, but its fat/protein fields are '<LOD'/'TR', which BlsAdapter rejects. Left out. Same candidate as dry_red_wine. |
| `nutmeg` | Muskatnuss / szerecsendió / nutmeg | at_faschierter_braten, at_faschierte_laibchen, at_semmelknoedel (a pinch) | No Muskat record in BLS 4.0 or the catalog; a pinch, left out. |
| `marjoram_dried` | Majoran gerebelt / majoránna / dried marjoram | at_rindsgulasch, at_geroestete_leber, at_tiroler_groestl (a pinch each) | No Majoran record in BLS 4.0 or the catalog (hu-missing-foods lists it too); a pinch, left out. |
| `gherkin_plain` | Essiggurkerl / csemegeuborka / pickled gherkin | at_linsen_mit_speck_knoedel (50 g Gurkerl-Kapern-Sardellen) | BLS 4.0 lists only Salzdillgurke (milchsauer, G890702) and sweet-sour Honig-/Senfgurke; an Austrian Essiggurkerl (vinegar-pickled) is none of these. Left out, as in hu-missing-foods. |
| `cinnamon` | Zimt / fahéj / cinnamon | at_apfelstrudel, at_linzer_torte, at_powidltascherl (a pinch each) | No ground-cinnamon record in BLS 4.0 or the catalog (only composite foods 'mit Zimt'); left out, as in hu-missing-foods. |
| `dill` | Dille / kapor / dill | at_gurkensalat_rahm (1 Zweig) | No dill record in BLS 4.0 or the catalog (hu-missing-foods lists it too); left out. |
