# Next Steps

- Add refresh-token rotation endpoint and per-session logout UI.
- Add password reset and optional email verification.
- Review and merge the source-specific USDA/BLS pilot importer PR; only then run the documented production dry-run and pilot after separate approval.
- Add barcode lookup and Open Food Facts integration.
- Add premium feature gates for coach chat, meal plans and shopping lists.
- Add mobile app clients against the same API.
- Add deeper automated E2E tests with a disposable PostgreSQL instance.
- Add nutrition micronutrient views for electrolytes, vitamins and minerals.
- Implement the reviewed Recipe / RecipeIngredient model and deterministic Food-based nutrition calculation described in `docs/recipe-architecture.md`.
- Add a public attribution/licence page for BLS and other catalog sources before broad catalog promotion.
- Integrate under a future NorbApp subdomain or route after DNS/production approval.
