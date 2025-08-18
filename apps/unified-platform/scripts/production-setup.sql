-- Production Database Setup Script
-- This script sets up the production database with optimized settings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create optimized indexes for production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified 
ON users (email) WHERE email_verified = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_location_verified 
ON providers USING GIST (location) WHERE is_verified = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_search_optimized 
ON services USING GIN (to_tsvector('english', name || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_date 
ON bookings (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_provider_rating 
ON reviews (provider_id, rating DESC) WHERE is_published = true;

-- Create materialized view for search optimization
CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.category,
    s.base_price,
    s.rating,
    s.review_count,
    p.name as provider_name,
    p.location,
    p.is_verified,
    to_tsvector('english', s.name || ' ' || s.description || ' ' || p.name) as search_vector
FROM services s
JOIN providers p ON s.provider_id = p.id
WHERE s.is_active = true AND p.is_verified = true;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_search_index_vector 
ON search_index USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_search_index_location 
ON search_index USING GIST (location);

-- Set up automatic refresh for materialized view
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh search index
CREATE OR REPLACE FUNCTION trigger_refresh_search_index()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('refresh_search_index', '');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Set up triggers for automatic refresh
DROP TRIGGER IF EXISTS services_search_refresh ON services;
CREATE TRIGGER services_search_refresh
    AFTER INSERT OR UPDATE OR DELETE ON services
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_search_index();

DROP TRIGGER IF EXISTS providers_search_refresh ON providers;
CREATE TRIGGER providers_search_refresh
    AFTER INSERT OR UPDATE OR DELETE ON providers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_search_index();

-- Optimize database settings for production
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Create monitoring views
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;