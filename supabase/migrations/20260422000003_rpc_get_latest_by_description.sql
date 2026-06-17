-- Migration: 20260422000003_rpc_get_latest_by_description.sql
-- Returns most recent posted transaction per unique description for a tenant
-- Used for auto-filling import staging rows (STORY-4.3)
--
-- Note: physical schema uses transaction_date (not occurred_at) for the date column

CREATE OR REPLACE FUNCTION get_latest_transactions_by_description(
  p_tenant_id    uuid,
  p_descriptions text[]
)
RETURNS TABLE (
  description_key           text,
  category_id               uuid,
  transaction_type          text,
  linked_account_id         uuid,
  payment_source_account_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (LOWER(description))
    LOWER(description)          AS description_key,
    category_id,
    transaction_type,
    linked_account_id,
    payment_source_account_id
  FROM transactions
  WHERE tenant_id = p_tenant_id
    AND LOWER(description) = ANY(
      SELECT LOWER(unnest(p_descriptions))
    )
  ORDER BY LOWER(description), transaction_date DESC, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_latest_transactions_by_description(uuid, text[])
  TO authenticated;
