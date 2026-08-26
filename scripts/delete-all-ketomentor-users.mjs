import { PrismaClient } from "@prisma/client";

const EXPECTED_SCHEMA = "ketomentor";

function databaseSchemaFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
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
  const [schemaRow] = await prisma.$queryRaw`SELECT current_schema() AS schema`;
  if (schemaRow?.schema !== EXPECTED_SCHEMA) {
    throw new Error(`connected database session must use the '${EXPECTED_SCHEMA}' schema`);
  }

  const cascades = await prisma.$queryRaw`
    SELECT child.relname AS child_table, parent.relname AS parent_table
    FROM pg_constraint constraint_row
    JOIN pg_class child ON child.oid = constraint_row.conrelid
    JOIN pg_class parent ON parent.oid = constraint_row.confrelid
    JOIN pg_namespace namespace_row ON namespace_row.oid = child.relnamespace
    WHERE constraint_row.contype = 'f'
      AND constraint_row.confdeltype = 'c'
      AND namespace_row.nspname = ${EXPECTED_SCHEMA}
  `;
  const cascadeKeys = new Set(cascades.map((row) => `${row.child_table}->${row.parent_table}`));
  const requiredCascades = [
    "Session->User", "Profile->User", "Entitlement->User", "Meal->User", "Recipe->User",
    "MealItem->Meal", "RecipeIngredient->Recipe"
  ];
  const missingCascades = requiredCascades.filter((key) => !cascadeKeys.has(key));
  if (missingCascades.length) {
    throw new Error(`required CASCADE constraints are missing: ${missingCascades.join(", ")}`);
  }

  const before = await countAll(prisma);
  console.log("BEFORE:", JSON.stringify(before));
  if (before.user === 0) {
    console.log("No users to delete. Nothing to do.");
    return;
  }
  // Delete only User rows. Validate all postconditions inside the transaction,
  // so any unexpected survivor or Food change rolls the deletion back.
  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({});
    const afterInTransaction = await countAll(tx);
    const ok =
      afterInTransaction.user === 0 && afterInTransaction.session === 0 &&
      afterInTransaction.profile === 0 && afterInTransaction.entitlement === 0 &&
      afterInTransaction.meal === 0 && afterInTransaction.mealItem === 0 &&
      afterInTransaction.recipe === 0 && afterInTransaction.recipeIngredient === 0 &&
      afterInTransaction.food === before.food;
    if (!ok) throw new Error("post-condition check failed; transaction rolled back");
  });
  const after = await countAll(prisma);
  console.log("AFTER: ", JSON.stringify(after));
  const ok =
    after.user === 0 && after.session === 0 && after.profile === 0 && after.entitlement === 0 &&
    after.meal === 0 && after.mealItem === 0 && after.recipe === 0 && after.recipeIngredient === 0 &&
    after.food === before.food;
  console.log(`Food preserved: ${after.food === before.food} (count=${after.food})`);
  if (!ok) {
    throw new Error("post-commit verification failed");
  }
  console.log("All ketomentor users and dependent data removed. Food catalog intact.");
}

main()
  .catch((error) => {
    console.error("SCRIPT ERROR:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
