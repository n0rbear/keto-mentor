# Hiányzó katalógusrekordok – AT (generált)

Ezekhez az ételrészekhez nincs ellenőrzött katalógusrekord. Nem helyettesíthetők hasonlóval;
a hivatalos forrásból (BLS xlsx, `BlsAdapter`) külön migrációban kell importálni őket.

| food_key | Név | Kell ehhez | Megjegyzés |
|---|---|---|---|
| `dry_red_wine` | Rotwein trocken / száraz vörösbor / dry red wine | zwiebelrostbraten (200 ml / 4 Portionen), gulaschsuppe (125 ml / 2), rotkraut (125 ml) | BLS 4.0 P2A3000 'Rotwein trocken' exists, but its fat field is 'TR' (trace), which BlsAdapter rejects as a missing required macro, so it cannot be imported unchanged. Left out (most alcohol evaporates). Candidate: a reviewed import that reads 'TR' as 0. |
| `dry_white_wine` | Weißwein trocken / száraz fehérbor / dry white wine | rahmschnitzel (Schuss), faschierter_braten (Schuss), kuerbiscremesuppe (67 ml), linzer_torte (2 EL) | BLS 4.0 P210000 'Weißwein trocken' exists, but its fat/protein fields are '<LOD'/'TR', which BlsAdapter rejects. Left out. Same candidate as dry_red_wine. |
| `nutmeg` | Muskatnuss / szerecsendió / nutmeg | semmelknoedel, faschierter_braten, faschierte_laibchen, kaesespaetzle, leberknoedel, griessnockerl, schwammerlsuppe, kuerbiscremesuppe, krautwickel, eiernockerl, erdaepfelpueree, erdaepfelpuffer (a pinch each) | No Muskat record in BLS 4.0 or the catalog; a pinch, left out. |
| `marjoram_dried` | Majoran gerebelt / majoránna / dried marjoram | rindsgulasch, geroestete_leber, tiroler_groestl, faschierte_laibchen, rahmschnitzel, reisfleisch, salonbeuschel, wiener_erdaepfelsuppe, schwammerlsuppe, klachelsuppe, kaspressknoedelsuppe, erdaepfelgulasch, grillhendl (a pinch each) | No Majoran record in BLS 4.0 or the catalog (hu-missing-foods lists it too); a pinch, left out. |
| `gherkin_plain` | Essiggurkerl / csemegeuborka / pickled gherkin | linsen_mit_speck (50 g Gurkerl-Kapern-Sardellen), fiaker_garnitur (1 Essiggurkerl per portion), sauce_tartare (1 EL Cornichons), rindfleischsalat (2 Gurkerl, 6 EL Gurkenwasser) | BLS 4.0 lists only Salzdillgurke (milchsauer, G890702) and sweet-sour Honig-/Senfgurke; an Austrian Essiggurkerl (vinegar-pickled) is none of these. Left out, as in hu-missing-foods. |
| `cinnamon` | Zimt / fahéj / cinnamon | apfelstrudel, linzer_torte, powidltascherl, nussschnecke, milchreis, kebap_fleisch (a pinch each) | No ground-cinnamon record in BLS 4.0 or the catalog (only composite foods 'mit Zimt'); left out, as in hu-missing-foods. |
| `coffee_liqueur` | Kaffeelikör / kávélikőr / coffee liqueur | esterhazytorte (2 EL) | No coffee-liqueur record in BLS 4.0 or the catalog; left out. |
| `dill` | Dille / kapor / dill | at_gurkensalat_rahm (1 Zweig) | No dill record in BLS 4.0 or the catalog (hu-missing-foods lists it too); left out. |
| `curry_powder` | Currypulver / curry fűszerpor / curry powder | bosna (a pinch), currywurst (2 TL) | BLS 4.0 has curry only in composite foods (Curryketchup, Currysauce), no plain curry powder; left out. |
| `inventory-only` | Grammelknödel | traditional | Grammeln (pork cracklings) have no BLS 4.0 record (as tepertős pogácsa in HU) - not substituted |
| `inventory-only` | Steirischer Käferbohnensalat | everyday | Käferbohnen (Phaseolus coccineus) have no BLS 4.0 record; Gartenbohne (P. vulgaris) is a different food - not substituted |
| `inventory-only` | Burenwurst | street_food | coarse Austrian Brühwurst with Speck; BLS 4.0 has no matching record (Knackwurst/Lyoner grob are different products) - not substituted |
