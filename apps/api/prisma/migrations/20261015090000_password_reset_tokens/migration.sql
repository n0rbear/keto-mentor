-- One-time password reset links (tester release, 2026-10-15). Insert-only
-- schema change: a new table, nothing existing is altered. Explicitly
-- qualified to the Keto Mentor schema.
CREATE TABLE "ketomentor"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "ketomentor"."PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "ketomentor"."PasswordResetToken"("userId");

ALTER TABLE "ketomentor"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
