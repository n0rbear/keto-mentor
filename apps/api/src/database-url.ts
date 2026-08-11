export const KETO_MENTOR_DATABASE_SCHEMA = "ketomentor";

export function databaseSchemaFromUrl(databaseUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol");
  }

  return url.searchParams.get("schema");
}

export function assertProductionDatabaseSchema(databaseUrl: string, nodeEnv: string | undefined): void {
  if (nodeEnv !== "production") return;

  const schema = databaseSchemaFromUrl(databaseUrl);
  if (schema !== KETO_MENTOR_DATABASE_SCHEMA) {
    throw new Error(
      `Production DATABASE_URL must select the ${KETO_MENTOR_DATABASE_SCHEMA} PostgreSQL schema`
    );
  }
}
