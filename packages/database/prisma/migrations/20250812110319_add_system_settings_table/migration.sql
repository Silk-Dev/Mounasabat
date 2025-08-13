-- DropIndex
DROP INDEX "idx_favorites_user_created";

-- DropIndex
DROP INDEX "idx_notifications_user_unread";

-- DropIndex
DROP INDEX "idx_providers_coverage_areas";

-- DropIndex
DROP INDEX "idx_reviews_provider_rating";

-- DropIndex
DROP INDEX "idx_reviews_service_rating";

-- DropIndex
DROP INDEX "idx_services_category_active";

-- DropIndex
DROP INDEX "idx_services_location_category";

-- DropIndex
DROP INDEX "idx_services_provider_active";

-- CreateTable
CREATE TABLE "SystemSettings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "SystemSettings_isPublic_idx" ON "SystemSettings"("isPublic");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SearchAnalytics_userId_idx" ON "SearchAnalytics"("userId");
