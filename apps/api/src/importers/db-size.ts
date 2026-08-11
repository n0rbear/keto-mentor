import { prisma } from "../db.js";
const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
  SELECT current_database() AS database,
    pg_database_size(current_database()) AS database_bytes,
    pg_total_relation_size('"Food"') AS food_total_bytes,
    pg_relation_size('"Food"') AS food_table_bytes,
    pg_indexes_size('"Food"') AS food_index_bytes,
    pg_total_relation_size('"FoodNutrient"') AS food_nutrient_total_bytes,
    pg_relation_size('"FoodNutrient"') AS food_nutrient_table_bytes,
    pg_indexes_size('"FoodNutrient"') AS food_nutrient_index_bytes
`;
console.log(JSON.stringify(rows[0], (_key, value) => typeof value === "bigint" ? value.toString() : value, 2));
await prisma.$disconnect();
