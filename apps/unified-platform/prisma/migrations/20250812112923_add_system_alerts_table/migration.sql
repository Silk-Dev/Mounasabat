-- CreateTable
CREATE TABLE "system_alerts" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "environment" VARCHAR(50) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_alerts_type_severity_idx" ON "system_alerts"("type", "severity");

-- CreateIndex
CREATE INDEX "system_alerts_environment_createdAt_idx" ON "system_alerts"("environment", "createdAt");

-- CreateIndex
CREATE INDEX "system_alerts_resolved_createdAt_idx" ON "system_alerts"("resolved", "createdAt");
