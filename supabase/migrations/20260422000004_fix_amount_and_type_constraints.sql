-- Migration: 20260422000004_fix_amount_and_type_constraints.sql
-- Fix 4 — Align amount and transaction_type constraints across tables
--
-- Root cause (confirmed from DB queries):
--   1. transactions.amount has CHECK (amount >= 0) — rejects negative amounts
--   2. import_staging.transaction_type allows 'savings' and 'investment'
--      which are not valid values in transactions.transaction_type
--
-- Decision (Decision Log 2026-04-22):
--   - transaction_type = 'income' or 'expense' only — final, no expansion
--   - Savings/investment transactions identified via linked_account_id
--     pointing to accounts with account_kind = 'savings' or 'investment'
--   - amount is SIGNED: income positive, expense/savings/investment negative
--   - amount <> 0 constraint — zero amounts not allowed
--   - Redundancy between transaction_type and amount sign is intentional
--     and kept for query readability

-- ─── Fix 1: Allow negative amounts on transactions ────────────────────────────
-- Signed cashflow convention requires negative amounts for expenses.
-- Old constraint (>= 0) rejected all expense/savings/investment rows.

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_amount_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_amount_check
  CHECK (amount <> 0);

-- ─── Fix 2: Align import_staging.transaction_type to match transactions ───────
-- Remove 'savings' and 'investment' from the allowed type list.
-- These were incorrectly included in the original staging schema.

ALTER TABLE import_staging
  DROP CONSTRAINT IF EXISTS import_staging_transaction_type_check;

ALTER TABLE import_staging
  ADD CONSTRAINT import_staging_transaction_type_check
  CHECK (transaction_type IN ('income', 'expense'));

-- ─── Fix 3: Remove any amount constraint from import_staging ──────────────────
-- Staging accepts any non-zero value; client-side parseImportFile handles
-- format validation before the row reaches the database.
-- (No ADD CONSTRAINT here — staging has no amount check going forward.)

ALTER TABLE import_staging
  DROP CONSTRAINT IF EXISTS import_staging_amount_check;
