-- DB-backet rate limit til magic-link-afsendelse (fail-closed).
CREATE TABLE "SendThrottle" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SendThrottle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SendThrottle_scope_key_key" ON "SendThrottle"("scope", "key");
