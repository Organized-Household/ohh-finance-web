-- Migration: Add constraints and advisory locks for concurrent import safety
-- Story: OHHFIN-167 — STORY-12.9 — Handle Concurrent Import Race Conditions
-- Purpose: Prevent duplicate imports and ensure import operations are serialized

-- file_hash does not exist on import_batches yet (verified via information_schema 2026-06-10)
ALTER TABLE import_batches ADD COLUMN file_hash TEXT;

-- Add composite unique constraint to prevent duplicate imports
-- Uses tenant_id, original_filename, and file_hash to detect exact duplicates
ALTER TABLE import_batches
  ADD CONSTRAINT import_batches_tenant_filename_hash_unique 
  UNIQUE (tenant_id, original_filename, file_hash);

-- Add partial unique index to prevent concurrent in-progress imports per tenant
-- Only one import can be in 'pending' status per tenant at a time
CREATE UNIQUE INDEX import_batches_tenant_pending_unique
  ON import_batches (tenant_id)
  WHERE status = 'pending';

-- Function to acquire advisory lock for import operations
-- Returns lock ID based on tenant_id to serialize imports per tenant
CREATE OR REPLACE FUNCTION acquire_import_lock(p_tenant_id uuid)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  lock_id bigint;
BEGIN
  -- Generate consistent lock ID from tenant UUID
  -- Use first 8 bytes of UUID as bigint
  lock_id := ('x' || substring(p_tenant_id::text, 1, 16))::bit(64)::bigint;
  
  -- Acquire advisory lock (blocks until available)
  PERFORM pg_advisory_lock(lock_id);
  
  RETURN lock_id;
END;
$$;

-- Function to release advisory lock for import operations
CREATE OR REPLACE FUNCTION release_import_lock(p_lock_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN pg_advisory_unlock(p_lock_id);
END;
$$;

-- Function to check if import with same content already exists
CREATE OR REPLACE FUNCTION check_duplicate_import(
  p_tenant_id uuid,
  p_filename text,
  p_file_hash text
)
RETURNS TABLE (
  batch_id uuid,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    import_batches.status,
    import_batches.created_at
  FROM import_batches
  WHERE tenant_id = p_tenant_id
    AND original_filename = p_filename
    AND file_hash = p_file_hash
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$;

-- Add comment explaining the safety mechanism
COMMENT ON CONSTRAINT import_batches_tenant_filename_hash_unique ON import_batches IS
  'Prevents exact duplicate imports (same file content) from being inserted concurrently';

COMMENT ON INDEX import_batches_tenant_pending_unique IS
  'Ensures only one import can be in pending status per tenant at a time, serializing import operations';

COMMENT ON FUNCTION acquire_import_lock(uuid) IS
  'Acquires PostgreSQL advisory lock for tenant-scoped import operations to prevent race conditions';

COMMENT ON FUNCTION release_import_lock(bigint) IS
  'Releases PostgreSQL advisory lock acquired for import operations';

COMMENT ON FUNCTION check_duplicate_import(uuid, text, text) IS
  'Checks if an import with identical content already exists for the tenant';
