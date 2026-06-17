-- Normalise all investment account subtypes to lowercase
-- Handles 'RRSP', 'TFSA', 'Stocks', etc. → 'rrsp', 'tfsa', 'stocks', etc.
UPDATE accounts
SET account_subtype = LOWER(account_subtype)
WHERE account_kind = 'investment'
  AND account_subtype IS NOT NULL;
