-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "userAgent" TEXT,
    "url" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceMetric_type_idx" ON "PerformanceMetric"("type");

-- CreateIndex
CREATE INDEX "PerformanceMetric_url_idx" ON "PerformanceMetric"("url");

-- CreateIndex
CREATE INDEX "PerformanceMetric_timestamp_idx" ON "PerformanceMetric"("timestamp");

-- CreateIndex
CREATE INDEX "PerformanceMetric_sessionId_idx" ON "PerformanceMetric"("sessionId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_type_timestamp_idx" ON "PerformanceMetric"("type", "timestamp");