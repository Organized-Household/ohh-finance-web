-- Migration B: Add opening_balance and interest_rate to accounts
-- Apply this BEFORE the rpc_dashboard_summary migration (20260417010000).

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS interest_rate   NUMERIC(5,4)  NULL;

COMMENT ON COLUMN accounts.opening_balance IS
  'User-entered starting balance. Running balance = opening_balance + linked_in - payment_source_out. No interest accrual in v1.';

COMMENT ON COLUMN accounts.interest_rate IS
  'Nominal interest rate for display only (e.g. 0.0489 = 4.89%). No calculations run against this field in v1.';
