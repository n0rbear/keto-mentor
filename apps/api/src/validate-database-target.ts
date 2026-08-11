import { assertProductionDatabaseSchema } from "./database-url.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

assertProductionDatabaseSchema(databaseUrl, process.env.NODE_ENV);
console.log("Database target validation passed for the dedicated Keto Mentor schema.");
