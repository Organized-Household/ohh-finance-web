-- RLS Coverage Helper Functions
-- OHHFIN-160 — STORY-12.1
-- 
-- Helper functions to support RLS coverage validation tests.
-- These functions allow the test suite to query RLS status without
-- requiring direct access to system catalogs.

-- Function to check if a table has RLS enabled
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = table_name
    AND relnamespace = 'public'::regnamespace
    AND relkind = 'r';
  
  RETURN COALESCE(rls_enabled, false);
END;
$$;

-- Function to count RLS policies for a table
CREATE OR REPLACE FUNCTION check_rls_policies(table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = table_name
    AND schemaname = 'public';
  
  RETURN policy_count;
END;
$$;

-- Function to get all tables in public schema
CREATE OR REPLACE FUNCTION get_all_public_tables()
RETURNS TABLE(tablename text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.tablename::text
  FROM pg_tables t
  WHERE t.schemaname = 'public';
END;
$$;

-- Function to get tables without RLS enabled
CREATE OR REPLACE FUNCTION get_tables_without_rls()
RETURNS TABLE(tablename text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.relname::text
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity;
END;
$$;

COMMENT ON FUNCTION check_rls_enabled IS 'Returns true if the specified table has RLS enabled';
COMMENT ON FUNCTION check_rls_policies IS 'Returns the count of RLS policies for the specified table';
COMMENT ON FUNCTION get_all_public_tables IS 'Returns all table names in the public schema';
COMMENT ON FUNCTION get_tables_without_rls IS 'Returns tables in public schema that do not have RLS enabled';
