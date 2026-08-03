-- Additive migration: preserves all existing application data.
CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idleExpiresAt" TIMESTAMP(3) NOT NULL,
  "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "tokenVersion" INTEGER NOT NULL DEFAULT 1,
  "userAgent" TEXT,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PopupAcknowledgement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "popupKey" TEXT NOT NULL,
  "popupVersion" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMP(3),
  "snoozedUntil" TIMESTAMP(3),
  "lastShownAt" TIMESTAMP(3),
  "lastAction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PopupAcknowledgement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RateLimit" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PopupAcknowledgement_userId_popupKey_popupVersion_key" ON "PopupAcknowledgement"("userId", "popupKey", "popupVersion");
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");
CREATE UNIQUE INDEX "RateLimit_bucket_key" ON "RateLimit"("bucket");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PopupAcknowledgement" ADD CONSTRAINT "PopupAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
