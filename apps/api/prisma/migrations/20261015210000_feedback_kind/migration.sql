-- "Ötletem van" (owner request 2026-10-15): ideas share the bug-report
-- table; existing rows are bug reports.
ALTER TABLE "ketomentor"."Feedback" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'bug';
