-- Migration: 20260422000002_create_import_staging.sql
-- Creates import_staging table for pending imported transactions
-- Separate from transactions table — transactions table stays clean (posted only)

CREATE TABLE import_staging (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  import_batch_id             uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  occurred_at                 date NOT NULL,
  description                 text NOT NULL,
  amount                      numeric(12,2) NOT NULL,
  transaction_type            text NULL
                              CHECK (transaction_type IN
                                ('expense','income','savings','investment')),
  category_id                 uuid NULL REFERENCES categories(id) ON DELETE SET NULL,
  linked_account_id           uuid NULL REFERENCES accounts(id) ON DELETE SET NULL,
  payment_source_account_id   uuid NULL REFERENCES accounts(id) ON DELETE SET NULL,
  status                      text NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','posted')),
  created_at                  timestamptz NOT NULL DEFAULT now(),

  -- Constraint: linked and payment source cannot be the same account
  CONSTRAINT chk_different_accounts
    CHECK (linked_account_id IS NULL
      OR payment_source_account_id IS NULL
      OR linked_account_id <> payment_source_account_id)
);

-- Indexes
CREATE INDEX idx_import_staging_tenant_id
  ON import_staging(tenant_id);

CREATE INDEX idx_import_staging_tenant_batch
  ON import_staging(tenant_id, import_batch_id);

CREATE INDEX idx_import_staging_tenant_status
  ON import_staging(tenant_id, status);

CREATE INDEX idx_import_staging_tenant_occurred
  ON import_staging(tenant_id, occurred_at);

-- RLS
ALTER TABLE import_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_import_staging"
  ON import_staging
  FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
