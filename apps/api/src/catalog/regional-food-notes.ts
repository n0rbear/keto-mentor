// Regional food identities that general models routinely confuse (owner
// reports, 2026-09-25). Appended to every identity-deciding prompt: search
// intent, recipe ingredient normalization and the semantic candidate gates.
export const REGIONAL_FOOD_IDENTITY_NOTES = `Regional identity notes (Hungarian/Central European foods; apply them exactly):
- "paprikakrém", "csípős paprikakrém", "erős paprikakrém", "Erős Pista", "Piros Arany", "Édes Anna", "Csemege paprikakrém" = a salted paste of ground/minced red chili paprika, used as a condiment (hot or sweet). Search key: "hot pepper paste" (or "sweet paprika paste" when sweet/csemege). It is NOT a roasted bell pepper spread ("sült paprikakrém", "ajvar", "pritaminpaprika-krém", "roasted red pepper spread"), NOT paprika powder and NOT a cream sauce; any of those is a DIFFERENT food.
- "tejföl" = sour cream. Cream cheese, cheese, yogurt and whipping cream are DIFFERENT foods.
- "túró" = quark / curd cheese; "szemcsés túró" = cottage cheese. Hard or cream cheeses are DIFFERENT foods.`;
