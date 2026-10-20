"""Cold dinners from the fridge: the owner's list of 150 simple cold dinner
ideas (2026-10-20), as one dinner portion each, eaten without bread.

Every dish is assembled, nothing is cooked here (eggs are already boiled,
roasts are leftovers, so their cooked catalog record is used). The finished
weight is the sum of the ingredients. Amounts are one dinner for one person
and are estimates; the sources give the kind of dish and the usual amounts.
Salt, pepper, dill and curry powder are left out: a few grams of spice, and
the catalog has no reviewed record for dill or curry powder.

Left out of the owner's list (see MISSING and the module notes):
- no reviewed catalog record for the main ingredient: csirkemellsonka
  (chicken ham), szárazkolbász, füstölt sajt (3 dishes), brokkolicsíra;
- already a reference dish: majonézes tojássaláta (de_eiersalat), tojásos
  avokádókrém (hu_avokados_tojassalata), Caprese and paradicsomsaláta
  mozzarellával (hu_caprese), görög saláta (hu_gorog_salata, twice), tonhalas
  tojássaláta (hu_tonhalsalata_tojassal), tonhalas töltött avokádó
  (hu_tonhalas_avokado), uborkasaláta tejföllel (hu_uborkasalata);
- twice in the list: sajtos tojáskrém, klasszikus körözött paprikával,
  rukkolasaláta parmezánnal, cézársaláta hideg csirkével.
"""
from common import ing, src

R = "2026-10-20"
IDEA = "ötlet: a tulajdonos 150 hideg vacsora listája (2026-10-20)"

SOURCES = {
    "meat": [src("https://www.wandernundmehr.at/faq/was-darf-auf-einer-wurstplatte-nicht-fehlen", R, "Wurst- und Käseplatte: 60-70 g Wurst und Käse pro Person als Jause, mehr als Hauptmahlzeit"),
             src("https://www.kifli.hu/en-HU/sef/11989-sonkas-kremsajtos-tortillatekercsek-bebispenottal", R, "sonkás-krémsajtos tekercs, 15 perc, hidegen")],
    "egg": [src("https://www.rewe.de/rezepte/eiersalat-radieschen-kresse/", R, "hart gekochte Eier mit Mayonnaise, Joghurt, Senf, Schnittlauch, Radieschen"),
            src("https://www.berliner-kurier.de/rezepte/rezept-fuer-eiersalat-perfekt-fuers-abendbrot-li.2226101", R, "Eiersalat fürs Abendbrot: Eier, Mayonnaise, Senf, Schnittlauch; 2 Portionen")],
    "cheese": [src("https://www.neff-home.com/de/neff-entdecken/the-ingredient/tipps-tricks/charcuterie-board", R, "Käse, Wurst, Oliven, Gemüse auf einem Brett"),
               src("https://www.surlatable.com/print/recipe/caprese-salad/REC-320526", R, "tomatoes, fresh mozzarella, olive oil, basil")],
    "quark": [src("https://www.kifli.hu/en-HU/sef/12422-budapesti-turokrem-kremes-reggeli-finomsag", R, "túrókrém: 250 g túró, vaj, hagyma, pirospaprika, újhagyma"),
              src("https://www.gelbeseiten.de/ratgeber/gl/low-carb-abendessen-8-leckere-ideen", R, "Low-Carb-Abendessen: Gemüsesticks mit Quark-Kräuter-Dip")],
    "fish": [src("https://www.penzcentrum.hu/otthon/20210909/a-tojasos-tonhalkrem-keszitese-percek-alatt-ilyen-jo-szendvicsfeltetet-meg-nem-ettel-1117543", R, "tojásos tonhalkrém: tonhalkonzerv, főtt tojás, hagyma, tejföl, mustár"),
             src("https://www.ah.nl/allerhande/recepten/tonijnsalade", R, "tonijnsalade: tonijn uit blik, snel klaar")],
    "veg": [src("https://www.beko.com/hu-hu/Blog/konyhai-inspiraciok/gyors-nyari-vacsoraotletek", R, "gyors, könnyű nyári vacsoraötletek"),
            src("https://www.wandernundmehr.at/faq/was-kann-man-abends-anstelle-von-brot-essen", R, "abends statt Brot: Gemüse, Salat, Quark, Eier")],
    "mixed": [src("https://www.wandernundmehr.at/faq/was-kann-man-abends-anstelle-von-brot-essen", R, "abends statt Brot: Gemüse, Salat, Quark, Eier"),
              src("https://www.wandernundmehr.at/faq/was-darf-auf-einer-wurstplatte-nicht-fehlen", R, "Wurst-, Käse- und Gemüseplatte")],
}

FAT = {"mayonnaise", "olive_oil", "butter"}
SEASONING = {"mustard", "lemon_juice", "garlic", "paprika_ground", "chives", "basil_fresh", "parsley_leaf", "caraway_seed", "horseradish", "capers", "vinegar", "hot_pepper_fresh"}
MEAT = {"ham_cooked", "turkey_ham", "salami", "mortadella", "parma_ham", "cured_ham_lean", "felvagott", "chicken_breast_cooked", "roast_beef", "pork_roast"}
FISH = {"tuna_canned", "sardines_oil", "smoked_mackerel", "smoked_trout", "smoked_salmon"}

# (id, hu, de, en, sources, [(food_key, grams), ...])
TABLE = [
    # ---------------------------------------------------------------- felvágottas és húsos
    ("sonkas_sajtos_salatatekercs", "Sonkás-sajtos szendvics kenyér nélkül, salátalevélbe tekerve", "Schinken-Käse-Salatwrap ohne Brot", "Ham and cheese lettuce wrap (no bread)", "meat",
     [("ham_cooked", 80), ("gouda", 50), ("lettuce", 40), ("tomato", 50), ("mustard", 5)]),
    ("sonkas_sajtos_paprikatekercs", "Sonkával és sajttal töltött paprikatekercs", "Paprikaröllchen mit Schinken und Käse", "Bell pepper rolls with ham and cheese", "meat",
     [("bell_pepper_red", 150), ("ham_cooked", 80), ("trappista", 50)]),
    ("kremsajtos_sonkatekercs", "Krémsajtos sonkatekercs", "Schinkenröllchen mit Frischkäse", "Ham rolls with cream cheese", "meat",
     [("ham_cooked", 100), ("cream_cheese_double", 60), ("cucumber", 80), ("chives", 3)]),
    ("sonkas_uborkatekercs", "Sonkával töltött uborkatekercs", "Gurkenröllchen mit Schinken", "Cucumber rolls with ham", "meat",
     [("cucumber", 200), ("ham_cooked", 80), ("cream_cheese_double", 40)]),
    ("szalami_sajttal_mustarral", "Szalámi sajttal és mustárral", "Salami mit Käse und Senf", "Salami with cheese and mustard", "meat",
     [("salami", 60), ("gouda", 60), ("mustard", 10), ("cucumber", 100)]),
    ("pulykasonka_sajtkockakkal", "Pulykasonka sajtkockákkal és friss zöldségekkel", "Putenschinken mit Käsewürfeln und Gemüse", "Turkey ham with cheese cubes and vegetables", "meat",
     [("turkey_ham", 100), ("emmentaler", 50), ("bell_pepper_red", 80), ("cucumber", 80), ("tomato", 60)]),
    ("sonkatekercs_tojaskremmel", "Sonkatekercs tojáskrémmel töltve", "Schinkenröllchen mit Eiercreme", "Ham rolls filled with egg spread", "meat",
     [("ham_cooked", 80), ("egg", 100), ("mayonnaise", 15), ("mustard", 5), ("chives", 3)]),
    ("szalamitekercs_kremsajttal", "Szalámitekercs natúr krémsajttal", "Salamiröllchen mit Frischkäse", "Salami rolls with cream cheese", "meat",
     [("salami", 60), ("cream_cheese_double", 60), ("cucumber", 100)]),
    ("csirkemell_majonezes_uborkaval", "Hideg sült csirkemell majonézes uborkával", "Kalte Hähnchenbrust mit Gurken-Mayonnaise-Salat", "Cold chicken breast with creamy cucumber salad", "meat",
     [("chicken_breast_cooked", 150), ("cucumber", 150), ("mayonnaise", 20), ("sour_cream", 20)]),
    ("csirkemell_avokadokremmel", "Hideg sült csirkemell avokádókrémmel", "Kalte Hähnchenbrust mit Avocadocreme", "Cold chicken breast with avocado cream", "meat",
     [("chicken_breast_cooked", 150), ("avocado", 100), ("lemon_juice", 5), ("garlic", 2), ("tomato", 60)]),
    ("pulykasonkas_salatatekercs", "Pulykasonkás salátatekercs", "Salatwrap mit Putenschinken", "Turkey ham lettuce wrap", "meat",
     [("turkey_ham", 100), ("iceberg", 50), ("cream_cheese_double", 30), ("cucumber", 60), ("bell_pepper_red", 40)]),
    ("serrano_mozzarellaval", "Serrano sonka mozzarellával", "Serranoschinken mit Mozzarella", "Serrano ham with mozzarella", "meat",
     [("cured_ham_lean", 60), ("mozzarella", 125), ("tomato", 100), ("arugula", 20), ("olive_oil", 5)]),
    ("parmai_sonka_parmezannal", "Pármai sonka parmezánnal és rukkolával", "Parmaschinken mit Parmesan und Rucola", "Parma ham with parmesan and rocket", "meat",
     [("parma_ham", 60), ("parmesan", 30), ("arugula", 40), ("tomato", 60), ("olive_oil", 10)]),
    ("mortadella_sajttal_olivaval", "Mortadella sajttal és olívabogyóval", "Mortadella mit Käse und Oliven", "Mortadella with cheese and olives", "meat",
     [("mortadella", 80), ("gouda", 50), ("olives_black", 30), ("cucumber", 80)]),
    ("marhasult_mustarral_salataval", "Hideg marhasült mustárral és friss salátával", "Kaltes Roastbeef mit Senf und Salat", "Cold roast beef with mustard and salad", "meat",
     [("roast_beef", 150), ("mustard", 10), ("lettuce", 60), ("tomato", 60), ("cucumber", 60), ("olive_oil", 10)]),
    ("sertessult_tormas_kremsajttal", "Hideg sertéssült tormás krémsajttal", "Kalter Schweinebraten mit Meerrettich-Frischkäse", "Cold roast pork with horseradish cream cheese", "meat",
     [("pork_roast", 130), ("cream_cheese_double", 40), ("horseradish", 10), ("cucumber", 80), ("radish", 50)]),
    ("sonkas_avokados_salata", "Sonkás-avokádós saláta", "Schinken-Avocado-Salat", "Ham and avocado salad", "meat",
     [("ham_cooked", 100), ("avocado", 100), ("lettuce", 50), ("tomato", 60), ("olive_oil", 5), ("lemon_juice", 5)]),
    ("cezarsalata_hideg_csirkevel", "Csirkés cézársaláta hideg hússal", "Caesar Salad mit kaltem Hähnchen", "Caesar salad with cold chicken", "meat",
     [("chicken_breast_cooked", 150), ("romaine", 80), ("parmesan", 20), ("mayonnaise", 15), ("sour_cream", 15), ("lemon_juice", 5), ("mustard", 3)]),
    ("currys_csirkesalata", "Currys csirkesaláta majonézzel", "Curry-Hähnchensalat mit Mayonnaise", "Curried chicken salad with mayonnaise", "meat",
     [("chicken_breast_cooked", 150), ("mayonnaise", 20), ("yogurt_greek_10", 30), ("celery_stalk", 50), ("spring_onion", 10)]),
    ("sonkas_tojassalata", "Sonkás tojássaláta", "Eiersalat mit Schinken", "Egg salad with ham", "meat",
     [("ham_cooked", 60), ("egg", 100), ("mayonnaise", 20), ("mustard", 5), ("cucumber", 60), ("chives", 3)]),
    ("felvagottas_kaposztasalata", "Felvágottas káposztasaláta", "Krautsalat mit Aufschnitt", "Coleslaw with cold cuts", "meat",
     [("felvagott", 80), ("white_cabbage", 150), ("mayonnaise", 15), ("sour_cream", 20), ("vinegar", 5)]),
    ("sajtos_szalamis_salatatekercs", "Sajtos-szalámis salátatekercs", "Salatwrap mit Salami und Käse", "Salami and cheese lettuce wrap", "meat",
     [("salami", 50), ("trappista", 40), ("iceberg", 50), ("cucumber", 60), ("bell_pepper_red", 40)]),
    ("hideg_husszeletek_turokremmel", "Hideg hússzeletek fűszeres túrókrémmel", "Kalter Braten mit Kräuterquark", "Cold roast slices with spiced quark spread", "meat",
     [("pork_roast", 100), ("quark_20", 100), ("sour_cream", 20), ("paprika_ground", 2), ("chives", 3), ("onion", 10), ("bell_pepper_red", 60)]),
    # ---------------------------------------------------------------- tojásos
    ("klasszikus_tojaskrem", "Klasszikus tojáskrém zöldséggel", "Klassische Eiercreme mit Gemüse", "Classic egg spread with vegetables", "egg",
     [("egg", 150), ("butter", 15), ("sour_cream", 20), ("mustard", 5), ("cucumber", 100), ("bell_pepper_red", 60)]),
    ("mustaros_tojaskrem", "Mustáros tojáskrém", "Eiercreme mit Senf", "Egg spread with mustard", "egg",
     [("egg", 150), ("mustard", 15), ("mayonnaise", 15), ("sour_cream", 15), ("cucumber", 100)]),
    ("tojaskrem_paprikaba_toltve", "Tojáskrém friss paprikába töltve", "Paprika gefüllt mit Eiercreme", "Bell pepper filled with egg spread", "egg",
     [("bell_pepper_red", 150), ("egg", 100), ("mayonnaise", 15), ("sour_cream", 15), ("mustard", 5)]),
    ("tojassal_toltott_avokado", "Tojással töltött avokádó", "Avocado mit Eifüllung", "Avocado filled with egg", "egg",
     [("avocado", 140), ("egg", 100), ("mayonnaise", 10), ("lemon_juice", 5), ("chives", 2)]),
    ("sonkas_tojaskrem", "Sonkás tojáskrém", "Eiercreme mit Schinken", "Egg spread with ham", "egg",
     [("egg", 100), ("ham_cooked", 60), ("butter", 10), ("sour_cream", 15), ("mustard", 5), ("cucumber", 100)]),
    ("sajtos_tojaskrem", "Sajtos tojáskrém", "Eiercreme mit Käse", "Egg and cheese spread", "egg",
     [("egg", 100), ("trappista", 40), ("mayonnaise", 15), ("sour_cream", 15), ("bell_pepper_red", 80)]),
    ("fokhagymas_tojaskrem", "Fokhagymás tojáskrém", "Eiercreme mit Knoblauch", "Garlic egg spread", "egg",
     [("egg", 150), ("sour_cream", 30), ("mayonnaise", 10), ("garlic", 4), ("cucumber", 100)]),
    ("metelohagymas_tojaskrem", "Metélőhagymás tojáskrém", "Eiercreme mit Schnittlauch", "Egg spread with chives", "egg",
     [("egg", 150), ("cream_cheese_double", 30), ("sour_cream", 15), ("chives", 8), ("radish", 60)]),
    ("tojaskremes_uborkahajok", "Tojáskrémes uborkahajók", "Gurkenschiffchen mit Eiercreme", "Cucumber boats with egg spread", "egg",
     [("cucumber", 250), ("egg", 100), ("mayonnaise", 15), ("mustard", 5), ("paprika_ground", 1)]),
    ("kaszinotojas_egyszeruen", "Kaszinótojás egyszerűen", "Gefüllte Eier mit Mayonnaise (einfach)", "Simple stuffed eggs with mayonnaise", "egg",
     [("egg", 150), ("mayonnaise", 25), ("mustard", 5), ("butter", 5), ("lettuce", 30)]),
    ("fott_tojas_majonezzel_mustarral", "Főtt tojás majonézzel és mustárral", "Gekochte Eier mit Mayonnaise und Senf", "Boiled eggs with mayonnaise and mustard", "egg",
     [("egg", 150), ("mayonnaise", 25), ("mustard", 10), ("lettuce", 40), ("tomato", 60)]),
    ("tojas_avokadoval_paradicsommal", "Főtt tojás avokádóval és paradicsommal", "Gekochte Eier mit Avocado und Tomate", "Boiled eggs with avocado and tomato", "egg",
     [("egg", 100), ("avocado", 100), ("tomato", 100), ("olive_oil", 5)]),
    ("tojasos_tonhalkrem", "Tojásos tonhalkrém", "Thunfisch-Eier-Creme", "Tuna and egg spread", "egg",
     [("tuna_canned", 120), ("egg", 100), ("butter", 10), ("sour_cream", 20), ("mustard", 5), ("onion", 10)]),
    ("tojasos_fetasalata", "Tojásos fetasaláta", "Feta-Salat mit Ei", "Feta salad with egg", "egg",
     [("egg", 100), ("feta", 60), ("cucumber", 100), ("tomato", 80), ("olive_oil", 10)]),
    ("tojasos_mozzarellasalata", "Tojásos mozzarellasaláta", "Mozzarellasalat mit Ei", "Mozzarella salad with egg", "egg",
     [("egg", 100), ("mozzarella", 125), ("tomato", 80), ("lettuce", 40), ("olive_oil", 5)]),
    ("tojasos_csirkesalata", "Tojásos csirkesaláta", "Hähnchensalat mit Ei", "Chicken salad with egg", "egg",
     [("chicken_breast_cooked", 100), ("egg", 100), ("mayonnaise", 15), ("sour_cream", 15), ("cucumber", 60), ("lettuce", 40)]),
    ("tojassal_toltott_sonkatekercs", "Tojással töltött sonkatekercs", "Schinkenröllchen mit Ei", "Ham rolls with boiled egg", "egg",
     [("ham_cooked", 100), ("egg", 100), ("cream_cheese_double", 20), ("chives", 3)]),
    ("tojas_fuszeres_turokremmel", "Főtt tojás fűszeres túrókrémmel", "Gekochte Eier mit Kräuterquark", "Boiled eggs with spiced quark", "egg",
     [("egg", 100), ("quark_20", 100), ("sour_cream", 20), ("paprika_ground", 2), ("onion", 10), ("bell_pepper_red", 60)]),
    ("tojasos_olivabogyo_salata", "Tojásos olívabogyó-saláta", "Eiersalat mit Oliven", "Egg and olive salad", "egg",
     [("egg", 100), ("olives_black", 40), ("tomato", 80), ("cucumber", 80), ("lettuce", 40), ("olive_oil", 10)]),
    ("tojaskrem_salatalevelbe", "Tojáskrém salátalevélbe töltve", "Eiercreme im Salatblatt", "Egg spread in lettuce cups", "egg",
     [("egg", 100), ("mayonnaise", 15), ("sour_cream", 15), ("mustard", 5), ("iceberg", 60)]),
    ("tojasos_sajtsalata", "Tojásos sajtsaláta", "Käsesalat mit Ei", "Cheese salad with egg", "egg",
     [("egg", 100), ("emmentaler", 60), ("mayonnaise", 15), ("sour_cream", 15), ("pickled_gherkin", 40), ("spring_onion", 10)]),
    ("tojas_sonkaval_kremsajttal", "Főtt tojás sonkával és krémsajttal", "Gekochte Eier mit Schinken und Frischkäse", "Boiled eggs with ham and cream cheese", "egg",
     [("egg", 100), ("ham_cooked", 80), ("cream_cheese_double", 40), ("cucumber", 80)]),
    ("tojasos_zoldsegsalata_tejfolos", "Tojásos zöldségsaláta tejfölös öntettel", "Gemüsesalat mit Ei und Sauerrahm-Dressing", "Vegetable salad with egg and sour cream dressing", "egg",
     [("egg", 100), ("lettuce", 60), ("cucumber", 80), ("tomato", 60), ("radish", 40), ("sour_cream", 40)]),
    # ---------------------------------------------------------------- sajtos és krémsajtos
    ("feta_uborkaval_olivaval", "Feta uborkával és olívabogyóval", "Feta mit Gurke und Oliven", "Feta with cucumber and olives", "cheese",
     [("feta", 100), ("cucumber", 150), ("olives_black", 30), ("olive_oil", 10)]),
    ("gouda_zoldseges_salata", "Gouda sajtos-zöldséges saláta", "Gouda-Gemüsesalat", "Gouda and vegetable salad", "cheese",
     [("gouda", 80), ("lettuce", 60), ("tomato", 80), ("cucumber", 80), ("bell_pepper_red", 50), ("olive_oil", 10)]),
    ("camembert_dioval_uborkaval", "Camembert dióval és uborkával", "Camembert mit Walnüssen und Gurke", "Camembert with walnuts and cucumber", "cheese",
     [("camembert", 125), ("walnut", 20), ("cucumber", 150)]),
    ("brie_rukkolaval_paradicsommal", "Brie sajttál rukkolával és paradicsommal", "Brie-Teller mit Rucola und Tomate", "Brie plate with rocket and tomato", "cheese",
     [("brie", 100), ("arugula", 40), ("tomato", 100), ("olive_oil", 10)]),
    ("kecskesajtos_salata", "Kecskesajtos saláta", "Salat mit Ziegenfrischkäse", "Goat cheese salad", "cheese",
     [("goat_cheese_fresh", 100), ("lambs_lettuce", 50), ("tomato", 80), ("walnut", 15), ("olive_oil", 10)]),
    ("parmezanos_rukkolasalata", "Parmezános rukkolasaláta", "Rucolasalat mit Parmesan", "Rocket salad with parmesan", "cheese",
     [("arugula", 60), ("parmesan", 40), ("tomato", 100), ("olive_oil", 15)]),
    ("sajtos_sonkas_salatatekercs", "Sajtos-sonkás salátatekercs", "Salatröllchen mit Käse und Schinken", "Cheese and ham lettuce rolls", "cheese",
     [("emmentaler", 60), ("ham_cooked", 60), ("iceberg", 60), ("cucumber", 60), ("sour_cream", 20)]),
    ("kremsajttal_toltott_paprika", "Krémsajttal töltött kaliforniai paprika", "Paprika gefüllt mit Frischkäse", "Bell pepper filled with cream cheese", "cheese",
     [("bell_pepper_red", 150), ("cream_cheese_double", 80), ("chives", 3)]),
    ("kremsajtos_uborkahajok", "Krémsajtos uborkahajók", "Gurkenschiffchen mit Frischkäse", "Cucumber boats with cream cheese", "cheese",
     [("cucumber", 250), ("cream_cheese_double", 80), ("chives", 3), ("radish", 30)]),
    ("fuszeres_kremsajt_zoldseghasabokkal", "Fűszeres krémsajt zöldséghasábokkal", "Kräuter-Frischkäse mit Gemüsesticks", "Herbed cream cheese with vegetable sticks", "cheese",
     [("cream_cheese_double", 80), ("chives", 3), ("paprika_ground", 1), ("cucumber", 100), ("bell_pepper_red", 80), ("celery_stalk", 60)]),
    ("feta_avokadokrem", "Feta-avokádókrém", "Feta-Avocado-Creme", "Feta and avocado spread", "cheese",
     [("feta", 60), ("avocado", 120), ("lemon_juice", 5), ("garlic", 2), ("cucumber", 100)]),
    ("mozzarella_olivaolajjal_bazsalikommal", "Mozzarella olívaolajjal és bazsalikommal", "Mozzarella mit Olivenöl und Basilikum", "Mozzarella with olive oil and basil", "cheese",
     [("mozzarella", 150), ("olive_oil", 10), ("basil_fresh", 3), ("tomato", 60)]),
    ("keksajt_dioval_zellerszarral", "Kéksajt dióval és zellerszárral", "Blauschimmelkäse mit Walnüssen und Staudensellerie", "Blue cheese with walnuts and celery", "cheese",
     [("blue_cheese", 70), ("walnut", 20), ("celery_stalk", 120)]),
    ("sajtkockak_olivaval_szalamival", "Sajtkockák olívabogyóval és szalámival", "Käsewürfel mit Oliven und Salami", "Cheese cubes with olives and salami", "cheese",
     [("gouda", 60), ("olives_black", 40), ("salami", 50), ("cucumber", 80)]),
    ("korozott_friss_paprikaval", "Körözött friss paprikával", "Liptauer mit frischer Paprika", "Hungarian körözött (paprika quark spread) with fresh pepper", "cheese",
     [("quark_20", 150), ("butter", 20), ("onion", 15), ("paprika_ground", 3), ("caraway_seed", 1), ("bell_pepper_red", 120)]),
    ("turokremes_sajtos_salata", "Túrókrémes sajtos saláta", "Käsesalat mit Quarkdressing", "Cheese salad with quark dressing", "cheese",
     [("quark_20", 100), ("trappista", 40), ("lettuce", 60), ("tomato", 60), ("cucumber", 60), ("sour_cream", 20)]),
    ("kremsajtos_retekfalatok", "Krémsajtos retekfalatok", "Radieschen mit Frischkäse", "Radish bites with cream cheese", "cheese",
     [("radish", 150), ("cream_cheese_double", 70), ("chives", 3), ("cucumber", 80)]),
    ("sajtos_avokadosalata", "Sajtos avokádósaláta", "Avocadosalat mit Käse", "Avocado salad with cheese", "cheese",
     [("avocado", 120), ("emmentaler", 50), ("tomato", 80), ("lettuce", 40), ("lemon_juice", 5), ("olive_oil", 5)]),
    ("mozzarellas_sonkas_salata", "Mozzarellás-sonkás saláta", "Salat mit Mozzarella und Schinken", "Mozzarella and ham salad", "cheese",
     [("mozzarella", 125), ("ham_cooked", 80), ("lettuce", 60), ("tomato", 80), ("olive_oil", 5)]),
    ("ketsajtos_zoldfuszeres_salata", "Kétféle sajtból készült zöldfűszeres sajtsaláta", "Kräuter-Käsesalat aus zwei Käsesorten", "Herbed salad with two cheeses", "cheese",
     [("gouda", 50), ("feta", 50), ("cucumber", 80), ("tomato", 60), ("bell_pepper_red", 50), ("parsley_leaf", 5), ("chives", 3), ("olive_oil", 10)]),
    # ---------------------------------------------------------------- túrókrémes és mártogatós
    ("fokhagymas_turokrem_uborkaval", "Fokhagymás túrókrém uborkával", "Knoblauchquark mit Gurke", "Garlic quark spread with cucumber", "quark",
     [("quark_20", 150), ("sour_cream", 30), ("garlic", 4), ("cucumber", 150)]),
    ("metelohagymas_turokrem_retekkel", "Metélőhagymás túrókrém retekkel", "Schnittlauchquark mit Radieschen", "Chive quark with radishes", "quark",
     [("quark_20", 150), ("sour_cream", 30), ("chives", 8), ("radish", 100)]),
    ("kapros_turokrem_kigyouborkaval", "Kapros túrókrém kígyóuborkával", "Dillquark mit Salatgurke", "Dill quark with cucumber", "quark",
     [("quark_20", 150), ("sour_cream", 30), ("cucumber", 150)]),
    ("csipos_korozott_paprikaval", "Csípős körözött kaliforniai paprikával", "Scharfer Liptauer mit Paprika", "Spicy körözött with bell pepper", "quark",
     [("quark_20", 150), ("butter", 15), ("onion", 15), ("paprika_ground", 3), ("hot_pepper_fresh", 5), ("bell_pepper_red", 120)]),
    ("fetas_turokrem_olivaval", "Fetás túrókrém olívabogyóval", "Feta-Quark mit Oliven", "Feta quark spread with olives", "quark",
     [("quark_20", 100), ("feta", 50), ("olives_black", 30), ("sour_cream", 15), ("cucumber", 100)]),
    ("mustaros_turokrem_sonkaval", "Mustáros túrókrém sonkával", "Senfquark mit Schinken", "Mustard quark with ham", "quark",
     [("quark_20", 100), ("mustard", 10), ("sour_cream", 15), ("ham_cooked", 80), ("cucumber", 80)]),
    ("tojasos_turokrem", "Tojásos túrókrém", "Quark mit Ei", "Quark spread with egg", "quark",
     [("quark_20", 100), ("egg", 100), ("sour_cream", 15), ("chives", 3), ("bell_pepper_red", 80)]),
    ("zoldfuszeres_turokrem_salatalevellel", "Zöldfűszeres túrókrém salátalevéllel", "Kräuterquark mit Salatblättern", "Herb quark with lettuce leaves", "quark",
     [("quark_20", 150), ("sour_cream", 30), ("parsley_leaf", 5), ("chives", 5), ("lettuce", 80), ("cucumber", 60)]),
    ("paprikaba_toltott_korozott", "Paprikába töltött körözött", "Paprika gefüllt mit Liptauer", "Bell pepper filled with körözött", "quark",
     [("bell_pepper_red", 150), ("quark_20", 120), ("butter", 15), ("onion", 10), ("paprika_ground", 2), ("caraway_seed", 1)]),
    ("uborkaba_toltott_turokrem", "Uborkába töltött túrókrém", "Gurke gefüllt mit Quark", "Cucumber filled with quark", "quark",
     [("cucumber", 250), ("quark_20", 120), ("sour_cream", 20), ("chives", 4), ("garlic", 2)]),
    ("turokremes_sonkatekercs", "Túrókrémes sonkatekercs", "Schinkenröllchen mit Quark", "Ham rolls with quark", "quark",
     [("ham_cooked", 100), ("quark_20", 80), ("sour_cream", 15), ("chives", 3), ("cucumber", 80)]),
    ("dios_turokrem_zellerszarral", "Diós túrókrém zellerszárral", "Walnussquark mit Staudensellerie", "Walnut quark with celery", "quark",
     [("quark_20", 120), ("walnut", 20), ("sour_cream", 20), ("celery_stalk", 120)]),
    ("olivas_kremsajt_uborkaval", "Olívás krémsajt uborkával", "Oliven-Frischkäse mit Gurke", "Olive cream cheese with cucumber", "quark",
     [("cream_cheese_double", 70), ("olives_black", 30), ("cucumber", 200)]),
    ("fokhagymas_tejfolos_martogatos", "Fokhagymás tejfölös mártogatós zöldségekkel", "Knoblauch-Sauerrahm-Dip mit Gemüse", "Garlic sour cream dip with vegetables", "quark",
     [("sour_cream", 100), ("garlic", 4), ("cucumber", 100), ("bell_pepper_red", 80), ("celery_stalk", 60)]),
    ("tzatziki_zoldseghasabokkal", "Tzatziki zöldséghasábokkal", "Tzatziki mit Gemüsesticks", "Tzatziki with vegetable sticks", "quark",
     [("yogurt_greek_10", 150), ("cucumber", 160), ("garlic", 4), ("olive_oil", 5), ("bell_pepper_red", 60)]),
    ("guacamole_paprikaval_uborkaval", "Guacamole friss paprikával és uborkával", "Guacamole mit Paprika und Gurke", "Guacamole with bell pepper and cucumber", "quark",
     [("avocado", 140), ("tomato", 50), ("onion", 15), ("lemon_juice", 10), ("garlic", 2), ("bell_pepper_red", 100), ("cucumber", 100)]),
    ("avokadokrem_fott_tojassal", "Avokádókrém főtt tojással", "Avocadocreme mit gekochtem Ei", "Avocado spread with boiled egg", "quark",
     [("avocado", 140), ("lemon_juice", 5), ("garlic", 2), ("egg", 100), ("tomato", 60)]),
    ("fuszeres_kremsajt_sonkaszeletekkel", "Fűszeres krémsajt sonkaszeletekkel", "Kräuter-Frischkäse mit Schinken", "Herbed cream cheese with ham slices", "quark",
     [("cream_cheese_double", 70), ("garlic", 2), ("chives", 3), ("paprika_ground", 1), ("ham_cooked", 100), ("cucumber", 60)]),
    ("korozott_sajtkockakkal_retekkel", "Körözött sajtkockákkal és retekkel", "Liptauer mit Käsewürfeln und Radieschen", "Körözött with cheese cubes and radishes", "quark",
     [("quark_20", 100), ("butter", 10), ("onion", 10), ("paprika_ground", 2), ("gouda", 50), ("radish", 80)]),
    # ---------------------------------------------------------------- tonhalas és halas
    ("tonhalkrem_majonezzel", "Tonhalkrém majonézzel", "Thunfischcreme mit Mayonnaise", "Tuna spread with mayonnaise", "fish",
     [("tuna_canned", 120), ("mayonnaise", 20), ("mustard", 5), ("onion", 10), ("cucumber", 100), ("bell_pepper_red", 60)]),
    ("tonhalkrem_fott_tojassal", "Tonhalkrém főtt tojással", "Thunfischcreme mit gekochtem Ei", "Tuna spread with boiled egg", "fish",
     [("tuna_canned", 120), ("sour_cream", 20), ("mayonnaise", 10), ("egg", 100), ("cucumber", 80)]),
    ("tonhalas_avokadosalata", "Tonhalas avokádósaláta", "Thunfisch-Avocado-Salat", "Tuna and avocado salad", "fish",
     [("tuna_canned", 120), ("avocado", 100), ("tomato", 60), ("onion", 10), ("lemon_juice", 5), ("olive_oil", 5), ("lettuce", 30)]),
    ("tonhalas_uborkasalata", "Tonhalas uborkasaláta", "Gurkensalat mit Thunfisch", "Cucumber salad with tuna", "fish",
     [("tuna_canned", 120), ("cucumber", 200), ("sour_cream", 30), ("onion", 10), ("olive_oil", 5)]),
    ("tonhalas_fetasalata", "Tonhalas fetasaláta", "Thunfischsalat mit Feta", "Tuna and feta salad", "fish",
     [("tuna_canned", 100), ("feta", 50), ("tomato", 80), ("cucumber", 80), ("olives_black", 20), ("olive_oil", 10)]),
    ("tonhalas_salatalevel_tekercs", "Tonhalas salátalevél-tekercs", "Salatwrap mit Thunfisch", "Tuna lettuce wrap", "fish",
     [("tuna_canned", 120), ("mayonnaise", 15), ("iceberg", 60), ("cucumber", 60), ("tomato", 50)]),
    ("tonhalas_kremsajt_uborkaval", "Tonhalas krémsajt uborkával", "Thunfisch-Frischkäse mit Gurke", "Tuna cream cheese with cucumber", "fish",
     [("tuna_canned", 100), ("cream_cheese_double", 50), ("cucumber", 150), ("chives", 3)]),
    ("tonhalas_olivabogyo_salata", "Tonhalas olívabogyó-saláta", "Thunfischsalat mit Oliven", "Tuna and olive salad", "fish",
     [("tuna_canned", 120), ("olives_black", 40), ("tomato", 80), ("lettuce", 50), ("onion", 10), ("olive_oil", 10), ("capers", 5)]),
    ("szardinia_paradicsommal", "Szardínia friss paradicsommal", "Sardinen mit frischen Tomaten", "Sardines with fresh tomatoes", "fish",
     [("sardines_oil", 100), ("tomato", 150), ("onion", 15), ("olive_oil", 5), ("parsley_leaf", 3)]),
    ("szardinias_tojassalata", "Szardíniás tojássaláta", "Eiersalat mit Sardinen", "Egg salad with sardines", "fish",
     [("sardines_oil", 80), ("egg", 100), ("mayonnaise", 10), ("lettuce", 50), ("cucumber", 60)]),
    ("fustolt_makrela_uborkaval_retekkel", "Füstölt makréla uborkával és retekkel", "Räuchermakrele mit Gurke und Radieschen", "Smoked mackerel with cucumber and radishes", "fish",
     [("smoked_mackerel", 100), ("cucumber", 150), ("radish", 80), ("sour_cream", 20)]),
    ("fustolt_pisztrang_tormas_kremsajttal", "Füstölt pisztráng tormás krémsajttal", "Räucherforelle mit Meerrettich-Frischkäse", "Smoked trout with horseradish cream cheese", "fish",
     [("smoked_trout", 120), ("cream_cheese_double", 40), ("horseradish", 10), ("cucumber", 100), ("lettuce", 40)]),
    ("fustolt_lazac_kremsajttal", "Füstölt lazac krémsajttal és kaporral", "Räucherlachs mit Frischkäse und Dill", "Smoked salmon with cream cheese and dill", "fish",
     [("smoked_salmon", 100), ("cream_cheese_double", 50), ("cucumber", 100), ("lemon_juice", 5), ("capers", 5)]),
    ("lazacos_tojassalata", "Lazacos tojássaláta", "Eiersalat mit Räucherlachs", "Egg salad with smoked salmon", "fish",
     [("smoked_salmon", 80), ("egg", 100), ("sour_cream", 20), ("mayonnaise", 10), ("cucumber", 60), ("chives", 3)]),
    ("fustolt_lazacos_avokadosalata", "Füstölt lazacos avokádósaláta", "Avocadosalat mit Räucherlachs", "Avocado salad with smoked salmon", "fish",
     [("smoked_salmon", 80), ("avocado", 100), ("arugula", 30), ("cucumber", 60), ("lemon_juice", 5), ("olive_oil", 5)]),
    ("halkremes_uborkahajok", "Halkrémes uborkahajók", "Gurkenschiffchen mit Fischcreme", "Cucumber boats with fish spread", "fish",
     [("cucumber", 250), ("smoked_trout", 80), ("cream_cheese_double", 40), ("horseradish", 5), ("lemon_juice", 3)]),
    ("makrelakrem_salatalevelben", "Makrélakrém salátalevélben", "Makrelencreme im Salatblatt", "Smoked mackerel spread in lettuce cups", "fish",
     [("smoked_mackerel", 100), ("cream_cheese_double", 30), ("sour_cream", 20), ("lemon_juice", 5), ("onion", 10), ("iceberg", 60)]),
    ("tonhalas_mozzarellasalata", "Tonhalas mozzarellasaláta", "Thunfisch-Mozzarella-Salat", "Tuna and mozzarella salad", "fish",
     [("tuna_canned", 100), ("mozzarella", 125), ("tomato", 80), ("lettuce", 40), ("olive_oil", 5), ("basil_fresh", 2)]),
    # ---------------------------------------------------------------- zöldséges és salátás
    ("paradicsomos_uborkas_fetasalata", "Paradicsomos-uborkás fetasaláta", "Tomaten-Gurken-Salat mit Feta", "Tomato, cucumber and feta salad", "veg",
     [("tomato", 150), ("cucumber", 150), ("feta", 80), ("onion", 15), ("olive_oil", 10)]),
    ("avokados_paradicsomsalata", "Avokádós paradicsomsaláta", "Tomatensalat mit Avocado", "Tomato and avocado salad", "veg",
     [("avocado", 140), ("tomato", 150), ("onion", 15), ("lemon_juice", 5), ("olive_oil", 5)]),
    ("jegsalata_sajttal_tojassal", "Jégsaláta sajttal és tojással", "Eisbergsalat mit Käse und Ei", "Iceberg salad with cheese and egg", "veg",
     [("iceberg", 120), ("gouda", 50), ("egg", 100), ("sour_cream", 30), ("cucumber", 60)]),
    ("zellerszar_kremsajttal", "Zellerszár krémsajttal töltve", "Staudensellerie gefüllt mit Frischkäse", "Celery sticks filled with cream cheese", "veg",
     [("celery_stalk", 200), ("cream_cheese_double", 80), ("walnut", 10)]),
    ("avokadokremes_zoldsegtal", "Avokádókrémes zöldségtál", "Gemüseplatte mit Avocadocreme", "Vegetable platter with avocado dip", "veg",
     [("avocado", 140), ("lemon_juice", 5), ("garlic", 2), ("yogurt_greek_10", 30), ("cucumber", 100), ("bell_pepper_red", 100), ("radish", 60), ("celery_stalk", 50)]),
    ("feta_olivaval_paradicsommal", "Feta olívabogyóval és paradicsommal", "Feta mit Oliven und Tomaten", "Feta with olives and tomatoes", "veg",
     [("feta", 100), ("olives_black", 40), ("tomato", 150), ("olive_oil", 10)]),
    ("kaposztasalata_majonezzel", "Káposztasaláta majonézzel", "Krautsalat mit Mayonnaise", "Creamy coleslaw with mayonnaise", "veg",
     [("white_cabbage", 200), ("mayonnaise", 25), ("sour_cream", 30), ("vinegar", 5)]),
    ("tojasos_ceklasalata", "Tojásos céklasaláta előfőzött céklából", "Rote-Bete-Salat mit Ei", "Beetroot salad with egg (precooked beetroot)", "veg",
     [("beetroot_cooked", 100), ("egg", 100), ("sour_cream", 30), ("horseradish", 5), ("onion", 10)]),
    ("retek_uborka_salata_turokremmel", "Retek-uborka saláta túrókrémmel", "Radieschen-Gurken-Salat mit Quark", "Radish and cucumber salad with quark", "veg",
     [("radish", 100), ("cucumber", 150), ("quark_20", 120), ("sour_cream", 20), ("chives", 3)]),
    ("vegyes_leveles_salata_tojassal", "Vegyes leveles saláta tojással és olívaolajjal", "Gemischter Blattsalat mit Ei und Olivenöl", "Mixed leaf salad with egg and olive oil", "veg",
     [("lettuce", 60), ("arugula", 30), ("lambs_lettuce", 30), ("egg", 100), ("tomato", 60), ("olive_oil", 15), ("lemon_juice", 5)]),
    ("uborkas_avokadosalata", "Uborkás-avokádósaláta", "Gurken-Avocado-Salat", "Cucumber and avocado salad", "veg",
     [("cucumber", 150), ("avocado", 120), ("sour_cream", 20), ("lemon_juice", 5), ("spring_onion", 10)]),
    ("paradicsomos_tonhalsalata", "Paradicsomos tonhalsaláta", "Tomaten-Thunfisch-Salat", "Tomato and tuna salad", "veg",
     [("tuna_canned", 120), ("tomato", 200), ("onion", 15), ("olive_oil", 10), ("parsley_leaf", 3)]),
    ("zoldseghasabok_fokhagymas_kremsajttal", "Zöldséghasábok fokhagymás krémsajttal", "Gemüsesticks mit Knoblauch-Frischkäse", "Vegetable sticks with garlic cream cheese", "veg",
     [("cream_cheese_double", 70), ("garlic", 3), ("cucumber", 100), ("bell_pepper_red", 100), ("celery_stalk", 60), ("radish", 50)]),
    ("olivas_mediterran_salata", "Olívás mediterrán saláta", "Mediterraner Olivensalat", "Mediterranean olive salad", "veg",
     [("olives_black", 50), ("tomato", 120), ("cucumber", 100), ("feta", 50), ("bell_pepper_red", 60), ("onion", 10), ("olive_oil", 10), ("capers", 5)]),
    # ---------------------------------------------------------------- gyors, változatos hidegvacsorák
    ("sonkas_tojasos_avokadotal", "Sonkás-tojásos avokádótál", "Avocado-Teller mit Schinken und Ei", "Avocado plate with ham and egg", "mixed",
     [("ham_cooked", 80), ("egg", 100), ("avocado", 100), ("tomato", 60)]),
    ("szalamis_fetas_salata", "Szalámis-fetás saláta", "Salat mit Salami und Feta", "Salami and feta salad", "mixed",
     [("salami", 50), ("feta", 60), ("lettuce", 60), ("tomato", 80), ("cucumber", 60), ("olive_oil", 5)]),
    ("pulykasonka_korozottel_paprikaval", "Pulykasonka körözöttel és paprikával", "Putenschinken mit Liptauer und Paprika", "Turkey ham with körözött and bell pepper", "mixed",
     [("turkey_ham", 100), ("quark_20", 80), ("butter", 10), ("onion", 10), ("paprika_ground", 2), ("bell_pepper_red", 150)]),
    ("mozzarellas_tojaskrem_salataval", "Mozzarellás tojáskrém salátával", "Eiercreme mit Mozzarella und Salat", "Egg and mozzarella spread with salad", "mixed",
     [("egg", 100), ("mozzarella", 60), ("mayonnaise", 10), ("sour_cream", 15), ("lettuce", 80), ("tomato", 60)]),
    ("tonhalkremes_paprikafelek", "Tonhalkrémes paprikafelek", "Paprikahälften mit Thunfischcreme", "Bell pepper halves with tuna spread", "mixed",
     [("bell_pepper_red", 200), ("tuna_canned", 100), ("cream_cheese_double", 30), ("mayonnaise", 10), ("onion", 10)]),
    ("sonkaval_toltott_sajtos_tekercs", "Sonkával töltött sajtos tekercsek", "Käseröllchen mit Schinkenfüllung", "Cheese rolls filled with ham", "mixed",
     [("gouda", 80), ("ham_cooked", 60), ("cream_cheese_double", 20), ("cucumber", 80)]),
    ("csirkes_avokados_tojassalata", "Csirkés-avokádós tojássaláta", "Eiersalat mit Hähnchen und Avocado", "Egg salad with chicken and avocado", "mixed",
     [("chicken_breast_cooked", 100), ("avocado", 80), ("egg", 100), ("yogurt_greek_10", 20), ("lemon_juice", 5), ("lettuce", 30)]),
    ("serrano_fetaval_uborkaval", "Serrano sonka fetával és uborkával", "Serranoschinken mit Feta und Gurke", "Serrano ham with feta and cucumber", "mixed",
     [("cured_ham_lean", 60), ("feta", 80), ("cucumber", 150), ("olive_oil", 5)]),
    ("kremsajtos_salatatekercs_sonkaval_tojassal", "Krémsajtos salátatekercs sonkával és tojással", "Salatwrap mit Frischkäse, Schinken und Ei", "Lettuce wrap with cream cheese, ham and egg", "mixed",
     [("iceberg", 60), ("cream_cheese_double", 40), ("ham_cooked", 60), ("egg", 100), ("cucumber", 50)]),
    ("tojasos_fetas_avokadokrem", "Tojásos-fetás avokádókrém", "Avocadocreme mit Ei und Feta", "Avocado spread with egg and feta", "mixed",
     [("avocado", 120), ("feta", 50), ("egg", 100), ("lemon_juice", 5), ("cucumber", 80)]),
    ("hideg_sult_hus_mustaros_uborkasalataval", "Hideg sült hús mustáros uborkasalátával", "Kalter Braten mit Senf-Gurkensalat", "Cold roast with mustard cucumber salad", "mixed",
     [("pork_roast", 120), ("cucumber", 150), ("mustard", 10), ("sour_cream", 30), ("onion", 10)]),
    ("szalamis_tojaskrem_zoldseghasabokkal", "Szalámis tojáskrém zöldséghasábokkal", "Eiercreme mit Salami und Gemüsesticks", "Egg and salami spread with vegetable sticks", "mixed",
     [("egg", 100), ("salami", 40), ("mayonnaise", 10), ("sour_cream", 15), ("cucumber", 100), ("bell_pepper_red", 80)]),
    ("mediterran_tonhalas_avokadosalata", "Mediterrán tonhalas-avokádósaláta", "Mediterraner Thunfisch-Avocado-Salat", "Mediterranean tuna and avocado salad", "mixed",
     [("tuna_canned", 100), ("avocado", 100), ("tomato", 80), ("olives_black", 20), ("onion", 10), ("olive_oil", 5), ("lemon_juice", 5), ("capers", 5)]),
    ("vegyes_hidegvacsora", "Vegyes hidegvacsora felvágottal, sajttal, tojással és friss zöldségekkel", "Gemischter kalter Teller mit Aufschnitt, Käse, Ei und Gemüse", "Mixed cold plate with cold cuts, cheese, egg and vegetables", "mixed",
     [("felvagott", 50), ("gouda", 40), ("egg", 50), ("cucumber", 80), ("tomato", 60), ("bell_pepper_red", 50), ("radish", 40)]),
]

NOTES = {
    "kapros_turokrem_kigyouborkaval": "A kapor (pár gramm) nincs a számításban: nincs ellenőrzött katalógusrekord.",
    "fustolt_lazac_kremsajttal": "A kapor (pár gramm) nincs a számításban: nincs ellenőrzött katalógusrekord.",
    "currys_csirkesalata": "A currypor (1-2 g) nincs a számításban: nincs ellenőrzött katalógusrekord.",
}


def _role(key):
    return "fat" if key in FAT else "seasoning" if key in SEASONING else "core"


def _lower_first(text):
    return text[0].lower() + text[1:]


PARTS = {}
DISHES = []
for pid, hu, de, en, group, items in TABLE:
    grams = round(sum(g for _, g in items), 1)
    PARTS[f"hv_{pid}"] = dict(
        names={"hu": hu, "de": de, "en": en},
        matrix="dry", bulk_density_g_ml=0.6, servings_source=1, standard_serving_g=grams,
        ingredients=[ing(key, g, _role(key)) for key, g in items],
        cooking=dict(method="assembled cold, no cooking", mass_change_g=0, note="eggs already boiled, roasts are leftovers; salt and pepper left out"),
        flat_plate=dict(coverage=0.5, height_cm=3.0),
        sources=SOURCES[group])
    keys = {key for key, _ in items}
    tags = ["cold", "low-carb-friendly"]
    if keys & FISH:
        tags.insert(0, "fish")
    elif not keys & MEAT:
        tags.insert(0, "vegetarian")
    if "egg" in keys:
        tags.insert(0, "eggs")
    DISHES.append(dict(
        id=f"hu_hv_{pid}", countries=["HU", "AT", "DE"], category="everyday", part_refs=[(f"hv_{pid}", grams)], served_in="flat_plate", tags=tags,
        names={"hu": _lower_first(hu), "de": de, "en": en},
        aliases={"hu": [hu.lower()], "de": [de.lower()], "de-AT": [de.lower()], "en": [en.lower()]},
        review=f"Egy vacsoraadag kenyér nélkül, {IDEA}; a mennyiségek becslések. " + NOTES.get(pid, "")))

MISSING = [
    dict(food_key="chicken_ham", names={"hu": "csirkemellsonka", "de": "Hähnchenbrust-Aufschnitt", "en": "chicken breast ham"}, needed_for=["Csirkemellsonka tojással és paradicsommal"],
         note="BLS 4.0 has no chicken breast cold cut (only Putenbrust geräuchert); not substituted."),
    dict(food_key="hungarian_dry_sausage", names={"hu": "szárazkolbász", "de": "ungarische Paprikawurst (luftgetrocknet)", "en": "Hungarian dry sausage"}, needed_for=["Szárazkolbász sajttal és csemegeuborkával"],
         note="No reviewed record for a dry paprika sausage (Landjäger and Zervelat are different products); not substituted."),
    dict(food_key="smoked_cheese", names={"hu": "füstölt sajt", "de": "Räucherkäse", "en": "smoked cheese"}, needed_for=["Füstölt sajtos tojássaláta", "Füstölt sajtos-sonkás tekercs", "Főtt tojás füstölt sajttal és retekkel"],
         note="Neither BLS 4.0 nor the production catalog has a smoked cheese record; not substituted."),
    dict(food_key="broccoli_sprouts", names={"hu": "brokkolicsíra", "de": "Brokkolisprossen", "en": "broccoli sprouts"}, needed_for=["Brokkolicsírás sajtsaláta"],
         note="BLS 4.0 lists alfalfa, lentil, mung and soy sprouts only; not substituted."),
]
