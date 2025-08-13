-- Check indexes on Category table
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('Category', 'SearchAnalytics', 'SystemSettings')
ORDER BY tablename, indexname;