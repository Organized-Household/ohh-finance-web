-- Migration: 20260422000001_create_import_batches.sql
-- Creates import_batches table for tracking CSV import sessions

CREATE TABLE import_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  original_filename text,
  imported_by       uuid NOT NULL REFERENCES auth.users(id),
  status            text NOT NULL DEFAULT 'created'
                    CHECK (status IN ('created','stored_pending','completed','failed')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_import_batches_tenant_id
  ON import_batches(tenant_id);

CREATE INDEX idx_import_batches_tenant_status
  ON import_batches(tenant_id, status);

-- RLS
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_import_batches"
  ON import_batches
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
