-- CreateIndex
-- Search optimization indexes for services
CREATE INDEX IF NOT EXISTS "idx_services_search_text" ON "Service" USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS "idx_services_category_active" ON "Service" ("category", "isActive");
CREATE INDEX IF NOT EXISTS "idx_services_price_range" ON "Service" ("basePrice") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_services_provider_active" ON "Service" ("providerId", "isActive");

-- Provider optimization indexes
CREATE INDEX IF NOT EXISTS "idx_providers_location_verified" ON "Provider" USING GIN ("location") WHERE "isVerified" = true;
CREATE INDEX IF NOT EXISTS "idx_providers_rating_reviews" ON "Provider" ("rating" DESC, "reviewCount" DESC) WHERE "isVerified" = true;
CREATE INDEX IF NOT EXISTS "idx_providers_coverage_areas" ON "Provider" USING GIN ("coverageAreas");

-- Review optimization indexes
CREATE INDEX IF NOT EXISTS "idx_reviews_provider_rating" ON "Review" ("providerId", "rating" DESC);
CREATE INDEX IF NOT EXISTS "idx_reviews_service_rating" ON "Review" ("serviceId", "rating" DESC);

-- Booking optimization indexes for availability checks
CREATE INDEX IF NOT EXISTS "idx_bookings_service_time" ON "Booking" ("serviceId", "startTime", "endTime") WHERE "status" IN ('CONFIRMED', 'PAID');
CREATE INDEX IF NOT EXISTS "idx_bookings_provider_time" ON "Booking" ("providerId", "startTime", "endTime") WHERE "status" IN ('CONFIRMED', 'PAID');

-- Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS "idx_services_category_price_rating" ON "Service" ("category", "basePrice", "providerId") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_services_location_category" ON "Service" ("location", "category", "isActive");

-- Favorites optimization
CREATE INDEX IF NOT EXISTS "idx_favorites_user_created" ON "Favorite" ("userId", "createdAt" DESC);

-- Notification optimization
CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread" ON "Notification" ("userId", "isRead", "createdAt" DESC);