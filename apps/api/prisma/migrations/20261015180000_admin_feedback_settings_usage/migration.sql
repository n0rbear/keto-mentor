-- Admin screen (owner request 2026-10-15): bug-report tickets, runtime
-- settings, anonymous daily usage counters and e-mail confirmation links.
-- Create-only, explicitly qualified to the Keto Mentor schema; the only data
-- written are the owner's own earlier tickets copied from the Render log.

CREATE TABLE "ketomentor"."EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "ketomentor"."EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "ketomentor"."EmailVerificationToken"("userId");
ALTER TABLE "ketomentor"."EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ketomentor"."Feedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "message" TEXT NOT NULL,
  "view" TEXT,
  "lang" TEXT,
  "build" TEXT,
  "lastInput" TEXT,
  "operationId" TEXT,
  "clientTime" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Feedback_status_createdAt_idx" ON "ketomentor"."Feedback"("status", "createdAt");
ALTER TABLE "ketomentor"."Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ketomentor"."AppSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "ketomentor"."UsageDaily" (
  "day" DATE NOT NULL,
  "kind" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "totalMs" BIGINT NOT NULL DEFAULT 0,
  "promptTokens" BIGINT NOT NULL DEFAULT 0,
  "completionTokens" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "UsageDaily_pkey" PRIMARY KEY ("day", "kind")
);

-- Earlier tickets (Render log, user_feedback lines 2026-10-13..15). The user
-- link is kept only where that account still exists; the E2E test ticket
-- (f64691, deleted test account) is left out. Status reflects the fixes
-- shipped in #87, #89 and #93; dc9bcf is still open.
INSERT INTO "ketomentor"."Feedback" ("id", "userId", "message", "view", "lang", "build", "lastInput", "operationId", "clientTime", "status", "adminNote", "createdAt", "updatedAt")
SELECT t.id, (SELECT u."id" FROM "ketomentor"."User" u WHERE u."id" = t.user_id), t.message, 'dashboard', 'hu', t.build, t.last_input, t.operation_id, t.client_time, t.status, t.note, t.created_at::timestamp, CURRENT_TIMESTAMP
FROM (VALUES
  ('6c6ae5', 'cmtpwzqu90000sv0ctotbow38', 'a rendszernek fogalma sincs arról, hogy például hány gramm egy virsli.', 'main@8bbd197 production', '4 db frankfurti virsli', 'f6d8dd8c-4c22-4f5d-b4c5-0e0f0397d173', '2026-10-13T16:50:00.064Z', 'done', 'Javítva: #87 (virsli darabsúly 59,5 g, frankfurti virsli alias).', '2026-10-13 16:50:01.921'),
  ('a8c9ed', 'cmtpwzqu90000sv0ctotbow38', 'recept beírásánál se a szóköz se az enter nem működik', 'main@8bbd197 production', '2 db bratwurst', 'cab65258-d9d0-4bdc-9cdc-47b16cf53887', '2026-10-14T09:09:31.586Z', 'done', 'Javítva: #87 (elkészítési lépések mezője).', '2026-10-14 09:09:32.208'),
  ('4efb32', 'cmtpwzqu90000sv0ctotbow38', 'recept beírásánál például a kechup-ot nem találja', 'main@8bbd197 production', '2 db bratwurst', 'cab65258-d9d0-4bdc-9cdc-47b16cf53887', '2026-10-14T09:11:05.761Z', 'done', 'Javítva: #87 (kecsap/kechup aliasok).', '2026-10-14 09:11:06.439'),
  ('dc9bcf', 'cmtpwzqu90000sv0ctotbow38', 'úgy tűnik, hogy sem a főtt tojás nem tudja mit jelent 1 db, a baconnel hogy mennyi egy szelet', 'main@dcc2b55 production', 'Egy darab főtt tojás, három szelet bacon, két szelet gouda sajt.', '39e479d3-54d2-469d-b6d7-8c0564ba2e06', '2026-10-15T08:09:00.370Z', 'open', NULL, '2026-10-15 08:09:01.017'),
  ('c289ec', 'cmtpwzqu90000sv0ctotbow38', '1 pár virsli... az adatbázisból kikeresi pillanatok alatt, ha rányomok az értelmezésre, akkor már sokkal több félét ajánl fel, utána már megkérdezi a gramot is, holott tudja, hogy hány gramm egy darab az adatbázisból.', 'main@df32547 production', '1 pár virsli', '146a8cab-4b28-443d-b420-8f620ef60088', '2026-10-15T17:44:24.044Z', 'done', 'Javítva: #93 (pár = 2 db).', '2026-10-15 17:44:25.885')
) AS t(id, user_id, message, build, last_input, operation_id, client_time, status, note, created_at)
ON CONFLICT ("id") DO NOTHING;
