-- Migration: Add file_fingerprint column to import_batches for duplicate detection
-- Story: OHHFIN-161 (STORY-12.2)
-- Purpose: Prevent duplicate CSV imports at the batch (file) level

-- Add nullable file_fingerprint column
ALTER TABLE import_batches
ADD COLUMN file_fingerprint TEXT NULL;

-- Add unique constraint scoped per tenant
ALTER TABLE import_batches
ADD CONSTRAINT import_batches_tenant_fingerprint_unique
UNIQUE (tenant_id, file_fingerprint);

-- Create index to support fast duplicate lookups
CREATE INDEX idx_import_batches_fingerprint
ON import_batches(tenant_id, file_fingerprint)
WHERE file_fingerprint IS NOT NULL;

-- Comment the column for documentation
COMMENT ON COLUMN import_batches.file_fingerprint IS 'SHA-256 hash of raw file content (hex string) for duplicate detection';
