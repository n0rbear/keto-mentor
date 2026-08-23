import { PrismaClient } from "@prisma/client";

const EXPECTED_SCHEMA = "ketomentor";

function databaseSchemaFromUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres/postgresql protocol");
  }
  return parsed.searchParams.get("schema");
}

function fail(message) {
  console.error(`REFUSING TO RUN: ${message}`);
  process.exit(2);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) fail("DATABASE_URL is not set.");
if (databaseSchemaFromUrl(databaseUrl) !== EXPECTED_SCHEMA) {
  fail(`DATABASE_URL must select the '${EXPECTED_SCHEMA}' schema.`);
}
if (process.env.CONFIRM_DELETE_ALL_KETOMENTOR_USERS !== "YES") {
  fail("Set CONFIRM_DELETE_ALL_KETOMENTOR_USERS=YES to confirm the destructive deletion.");
}

const prisma = new PrismaClient();

async function countAll(p) {
  const [user, session, profile, entitlement, meal, mealItem, recipe, recipeIngredient, food] = await Promise.all([
    p.user.count(), p.session.count(), p.profile.count(), p.entitlement.count(),
    p.meal.count(), p.mealItem.count(), p.recipe.count(), p.recipeIngredient.count(), p.food.count()
  ]);
  return { user, session, profile, entitlement, meal, mealItem, recipe, recipeIngredient, food };
}

async function main() {
  await prisma.$connect();
  const before = await countAll(prisma);
  console.log("BEFORE:", JSON.stringify(before));
  if (before.user === 0) {
    console.log("No users to delete. Nothing to do.");
    await prisma.$disconnect();
    return;
  }
  // Single transaction: delete only User rows; CASCADE removes dependent rows.
  await prisma.$transaction(async (tx) => { await tx.user.deleteMany({}); });
  const after = await countAll(prisma);
  console.log("AFTER: ", JSON.stringify(after));
  const ok =
    after.user === 0 && after.session === 0 && after.profile === 0 && after.entitlement === 0 &&
    after.meal === 0 && after.mealItem === 0 && after.recipe === 0 && after.recipeIngredient === 0 &&
    after.food === before.food;
  console.log(`Food preserved: ${after.food === before.food} (count=${after.food})`);
  if (!ok) {
    console.error("POST-CONDITION CHECK FAILED. Investigate before considering this complete.");
    await prisma.$disconnect();
    process.exit(3);
  }
  console.log("All ketomentor users and dependent data removed. Food catalog intact.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("SCRIPT ERROR:", error instanceof Error ? error.message : error);
  process.exit(1);
});