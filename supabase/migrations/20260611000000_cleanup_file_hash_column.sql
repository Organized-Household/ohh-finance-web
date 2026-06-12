-- Cleanup: remove file_hash column and related objects superseded by file_fingerprint (OHHFIN-161)
-- The file_hash column from OHHFIN-167 used a 3-column unique constraint (tenant_id, original_filename, file_hash)
-- which could miss duplicates uploaded with different filenames.
-- file_fingerprint uses a 2-column constraint (tenant_id, file_fingerprint) which is stricter and correct.

-- Note: DROP CONSTRAINT must come before DROP INDEX — the unique constraint's
-- backing index shares its name, and Postgres refuses to drop an index that a
-- constraint requires (error 2BP01). Dropping the constraint removes the index.
ALTER TABLE import_batches DROP CONSTRAINT IF EXISTS import_batches_tenant_filename_hash_unique;
DROP INDEX IF EXISTS import_batches_tenant_filename_hash_unique;
DROP FUNCTION IF EXISTS check_duplicate_import(uuid, text, text);
ALTER TABLE import_batches DROP COLUMN IF EXISTS file_hash;
