# Bounded OFF consensus: proposed, not enabled

The recipe-first checkpoint enables bounded OFF name search and individual
product confirmation. It does **not** label any product or average as a
consensus. This document covers the explicitly permitted design alternative.
There is no new FoodSource enum value, database migration, or automatic
consensus persistence in this checkpoint.

## Admission and identity

Only generic ingredient identities are eligible, after local authoritative
records (including BLS) and structured single-record resolution fail.
Branded queries remain direct product searches. Prepared dishes never enter
this tier: discover their recipes and resolve ingredients instead.

Reuse the bounded OFF search (maximum ten hits, one page, eight-second timeout,
one-megabyte response limit, shared ten-searches/minute process budget).
Do not call an AI provider for each product. Country and language metadata are
preferences, not evidence that two products are the same food.

Require a reviewed, deterministic category mapping and a complete identity key:
food type, edible part, preparation/preservation, fat class, flavor/additives,
and brand where explicitly requested. Unknown key fields cause rejection, not
wildcard matching. Neither token overlap nor an identical broad category is
sufficient. Deduplicate by barcode and require all admitted keys to agree with
the requested key; conflicting plausible keys require clarification instead of
choosing the largest cluster.

Examples that must never combine: parsley leaves/root/dried parsley/sauce;
raw pork belly/cooked bacon/smoked bacon/rendered fat; plain/light/flavored sour
cream; materially different fat percentages. A bare ambiguous `szalonna` query
must first be clarified. Five noisy search hits do not establish convergence.

## Nutrition and robust statistics

Require five to ten distinct usable products, all with explicit per-100-gram
energy, protein, fat, carbohydrate and fiber values, compatible carbohydrate
definitions, plausible mass/energy consistency, and the same identity key.
Missing fiber is not zero. No per-serving or per-100-ml conversion without
verified density. Require at least three distinct brands for generic consensus
to avoid counting the same formulation as independent evidence.

For each nutrient calculate the median and median absolute deviation (MAD).
Reject a whole product if any nutrient deviates by more than
`max(3 * 1.4826 * MAD, tolerance)`, with tolerance 20 kcal for energy and 2 g
for each macro. Recompute once only. Require at least five products after
filtering and at least 70% retention. Reject if the retained range exceeds
`max(30% of median, 20 kcal / 2 g respectively)` for any nutrient.
These thresholds are conservative design defaults pending fixture validation,
not a calibrated nutritional confidence model. Aggregate by nutrient median,
never mean; revalidate the aggregate's mass and energy consistency.

## Confirmation and provenance

Return a review-only proposal, separate from ExternalFoodCandidate (a consensus
has no single barcode). Sign its exact identities, accepted product IDs,
retrieval times, algorithm version, values and user ID with a short expiry.
An authenticated confirmation endpoint must verify this proof and persist
exactly those values as an explicitly accepted private estimate. Never reuse
the direct OFF confirmation endpoint with an invented product ID.

Provenance must include `sourceType: open_food_facts_consensus`, OFF source URLs,
productCount, distinctBrandCount, observed countries/languages, rejected counts
and reasons, identity key, `aggregation: median`, MAD/ranges, algorithm version,
retrievedAt, userAccepted and confidence. Unknown market data stays unknown.
Use medium confidence at most; low confidence is not eligible for persistence.
The UI must display the sample count and aggregate label, not authoritative
single-product data. Only explicitly accepted ingredient values enter the
deterministic recipe sum.

## Required tests before activation

Homogeneous 7-product fixtures; 4-product rejection; duplicates reducing sample
below five; missing nutrients; injected names; heterogeneous parsley/bacon/sour
cream; numeric outlier removal retaining five; excessive spread rejection;
mixed volume/mass and carbohydrate bases; exact signed-value acceptance;
tampering, expiry and cross-user rejection; no writes before acceptance;
no extra AI calls; rate-budget exhaustion and upstream errors distinguished
from an empty search. No activation until all these pass.
