import { resolve } from "node:path";
import { prisma } from "../db.js";
import { PublicFoodCsvAdapter } from "./csv-adapter.js";
import { importFoods } from "./import-foods.js";

const [, , sourceName, fileArg] = process.argv;
if (!sourceName || !fileArg || !["usda", "bls"].includes(sourceName)) {
  throw new Error("Usage: npm run catalog:import -w apps/api -- <usda|bls> <csv-file>");
}
const metadata = sourceName === "usda"
  ? ["USDA FoodData Central", "https://fdc.nal.usda.gov/"]
  : ["Bundeslebensmittelschlüssel (BLS)", "https://www.blsdb.de/"];

try {
  const result = await importFoods(prisma, new PublicFoodCsvAdapter("open_database", metadata[0], metadata[1]), resolve(fileArg));
  console.log(JSON.stringify(result));
} finally {
  await prisma.$disconnect();
}
