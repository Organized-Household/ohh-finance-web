-- Migration: Add row-level idempotency to import_staging
-- Story: OHHFIN-175 / STORY-12.3
-- Purpose: Prevent duplicate row imports within the same tenant using deterministic fingerprints

-- Add nullable row_fingerprint column to import_staging
ALTER TABLE import_staging
ADD COLUMN IF NOT EXISTS row_fingerprint TEXT NULL;

-- Create unique constraint scoped per tenant to enforce idempotency
ALTER TABLE import_staging
ADD CONSTRAINT import_staging_tenant_row_fingerprint_unique
UNIQUE (tenant_id, row_fingerprint);

-- Add comment explaining the fingerprint format
COMMENT ON COLUMN import_staging.row_fingerprint IS 'SHA-256 hash of: tenant_id + transaction_date + amount + normalized_description (lowercase, trimmed). Used for row-level deduplication.';
