# Keto Mentor

Keto Mentor is a NorbApp-style MVP for beginner-friendly keto tracking. It provides username/password auth, guided onboarding, daily macro goals, meal logging, nutrition totals, and an API designed for future Android/iOS clients.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma
- Auth: username/password, Argon2id password hashing, JWT access token, HTTP-only refresh cookie foundation
- Shared contracts: `packages/shared` with Zod schemas

## Brand Direction

The UI follows `E:\_munkák\norbapp_arculatterv.html` as the primary NorbApp reference:

- Background `#F5FAFB`
- Ink `#162B38`, muted text `#60727E`
- White cards with `#D6E6E8` borders
- Main accents `#04AEB0`, `#00D8FF`
- Secondary gold accent `#D4AF37`
- Inter/system sans typography, compact rounded components and soft shadows

## Local Development

1. Copy `.env.example` to `.env`.
2. Set a local PostgreSQL `DATABASE_URL`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Run Prisma:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate -w apps/api
   ```

5. Start both apps:

   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:5173`, API on `http://localhost:4100`.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: long random secret for access tokens
- `JWT_REFRESH_SECRET`: long random secret for refresh sessions
- `CORS_ORIGIN`: allowed frontend origins, comma-separated
- `PORT`: API port
- `VITE_API_URL`: frontend API URL

Never commit real `.env` files or secrets.

## Data Model

Core tables:

- `User`: username auth now, optional email fields for later shared NorbApp auth
- `Session`: multi-device refresh session foundation
- `Profile`: onboarding, goals, preferences, avoided foods, allergies
- `Entitlement`: Free/Premium-ready feature flags without payments
- `Food`: central food catalog with source and provenance
- `Nutrient` and `FoodNutrient`: extensible vitamins, minerals, electrolytes and trace nutrients
- `Meal` and `MealItem`: logged meals and quantities

Tracked MVP macros: kcal, fat, protein, carbs, fiber and net carbs.

## Food Catalog

The MVP ships with an idempotent Prisma seed for a small starter keto catalog: fried egg, avocado, roasted chicken breast, butter, cheddar and spinach. This is a development starter set, not the final catalog. Foods include Hungarian, German and English names/synonyms, source/provenance metadata, and serving-to-gram defaults. Search runs in PostgreSQL against an accent-normalized `searchText` column and is protected by a trigram GIN index, so the browser never downloads the whole catalog.

Seed values are average per-100 g edible-portion values from USDA FoodData Central / USDA Standard Reference-derived public nutrition mirrors. They are useful for tracking estimates, not exact lab values for a specific product or preparation. Packaged product import is intentionally left as a future Open Food Facts/barcode adapter and is not required at runtime.

### Catalog imports

`apps/api/src/importers` contains a source-adapter boundary and an idempotent importer. Foods are upserted by `(source, sourceId)`; micronutrients are upserted through the existing `Nutrient` and `FoodNutrient` tables. The CSV adapter is ready for downloaded, license-compliant USDA FoodData Central and BLS extracts after their source-specific columns are mapped to the included fixture format. It deliberately does not fetch remote datasets at application runtime.

```bash
npm run catalog:import -w apps/api -- usda apps/api/fixtures/catalog-sample.csv
```

Micronutrient columns use `nutrient_<key>_<unit>_<group>`, for example `nutrient_sodium_mg_electrolyte`. The schema supports sodium, potassium, calcium, magnesium, phosphorus, iron, zinc, copper, manganese, selenium, vitamins A, B1/B2/B3/B5/B6/B7/B9/B12, C, D, E and K, plus additional keys without a schema change. Do not import BLS data without confirming its current licensing terms.

## API

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `PUT /me/onboarding`
- `GET /foods?q=<at-least-2-characters>` (maximum 20 results)
- `GET /meals/today`
- `POST /meals`

## Deployment

`render.yaml` describes separate Render services:

- API web service
- Static frontend

Production deploy requires setting strong JWT secrets and a PostgreSQL `DATABASE_URL`. When sharing an existing Render Postgres database with another app, use a dedicated schema, for example append `?schema=keto_mentor` to the internal connection string. Prisma migrations will then create and use only that schema.

The API exposes `GET /health` and the Render web service should use `/health` as its health-check path. On Render free web services, idle services may spin down and the first request after inactivity can be a cold start. This app intentionally does not include artificial keep-alive pinging; the supported always-on path is a Render paid web service plan.

## Important Folders

- `apps/api`: Express API and Prisma schema
- `apps/web`: React Vite app
- `packages/shared`: shared Zod contracts and types

## Health Disclaimer

Keto Mentor is informational food tracking software. It does not diagnose, treat, or guarantee health outcomes.
