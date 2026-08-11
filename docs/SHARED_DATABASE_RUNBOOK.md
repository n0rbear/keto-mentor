# Shared Render PostgreSQL cutover

Keto Mentor and Driver Assistant share one PostgreSQL database instance, but they must never share a PostgreSQL schema.

- Driver Assistant / LogiHERO objects remain in `public`.
- Keto Mentor objects, enums, indexes, constraints, and `_prisma_migrations` live in `ketomentor`.
- The production `DATABASE_URL` must include `schema=ketomentor`. The API, migration deploy, seed, and catalog import fail closed if it does not.
- If the URL already has query parameters, add the schema with `&schema=ketomentor`; otherwise use `?schema=ketomentor`.

## One-time cutover from the legacy schema

The existing Keto Mentor production objects are in the legacy `keto_mentor` schema on the same database instance. The safe cutover is an atomic schema rename, not table-by-table copying:

```sql
BEGIN;
LOCK TABLE keto_mentor."User", keto_mentor."Food", keto_mentor."Meal" IN ACCESS EXCLUSIVE MODE;
ALTER SCHEMA keto_mentor RENAME TO ketomentor;
COMMIT;
```

Before the transaction:

1. Take and checksum a schema-only-scoped `pg_dump` containing both structure and data.
2. Verify `keto_mentor` exists and `ketomentor` does not.
3. Record row counts, foreign-key validation state, schema sizes, and the list of `public` objects.
4. Keep the Render service URL unchanged until the backup and audit pass.

Immediately after the transaction, change only the Keto Mentor API `DATABASE_URL` to the same database with `schema=ketomentor`, deploy, and verify migrations, seed, startup, health, authentication, and meal persistence. A rollback renames the schema back and restores the prior URL; the dump is the final recovery source.

Do not run Prisma with a URL that omits `schema=ketomentor`, and never use `prisma migrate reset` in production.
