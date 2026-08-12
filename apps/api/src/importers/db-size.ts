import { prisma } from "../db.js";
const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
  SELECT current_database() AS database,
    current_schema() AS active_schema,
    pg_database_size(current_database()) AS database_bytes,
    (SELECT COALESCE(SUM(pg_total_relation_size(c.oid)), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r', 'm')) AS public_schema_bytes,
    (SELECT COALESCE(SUM(pg_total_relation_size(c.oid)), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'ketomentor' AND c.relkind IN ('r', 'm')) AS ketomentor_schema_bytes,
    (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r') AS public_table_count,
    (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'i') AS public_index_count,
    (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'S') AS public_sequence_count,
    pg_total_relation_size('"ketomentor"."Food"') AS food_total_bytes,
    pg_relation_size('"ketomentor"."Food"') AS food_table_bytes,
    pg_indexes_size('"ketomentor"."Food"') AS food_index_bytes,
    pg_total_relation_size('"ketomentor"."FoodNutrient"') AS food_nutrient_total_bytes,
    pg_relation_size('"ketomentor"."FoodNutrient"') AS food_nutrient_table_bytes,
    pg_indexes_size('"ketomentor"."FoodNutrient"') AS food_nutrient_index_bytes
`;
const [foodCount, foodNutrientCount, nutrientCount, userCount, mealCount, mealItemCount] = await Promise.all([
  prisma.food.count(), prisma.foodNutrient.count(), prisma.nutrient.count(), prisma.user.count(), prisma.meal.count(), prisma.mealItem.count()
]);
console.log(JSON.stringify({ ...rows[0], foodCount, foodNutrientCount, nutrientCount, userCount, mealCount, mealItemCount }, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2));
await prisma.$disconnect();
