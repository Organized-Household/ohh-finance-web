-- Normalise all credit card debt account subtypes to lowercase underscore
-- Handles 'Credit Card', 'credit card', 'CREDIT CARD' — any capitalisation/spacing variant
UPDATE accounts
SET account_subtype = 'credit_card'
WHERE account_kind = 'debt'
  AND LOWER(REPLACE(account_subtype, ' ', '_')) = 'credit_card';
