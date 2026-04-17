-- Migration: rpc_dashboard_summary v2
-- Changes from v1 (20260417010000):
--   - budget_is_set: now requires budgets row + at least one budget_lines.amount > 0
--     (previously only checked for existence of a budgets row)
-- All other RPC logic is unchanged.

DROP FUNCTION IF EXISTS rpc_dashboard_summary(date);

CREATE OR REPLACE FUNCTION rpc_dashboard_summary(p_month_start date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id   uuid;
  v_month_end date;
  v_result    json;
BEGIN
  v_user_id := auth.uid();

  SELECT tenant_id INTO v_tenant_id
  FROM tenant_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant membership found for current user';
  END IF;

  v_month_end := (p_month_start + interval '1 month')::date;

  SELECT json_build_object(

    'income_total', COALESCE(SUM(amount) FILTER (
      WHERE transaction_type = 'income'
        AND transaction_date >= p_month_start
        AND transaction_date <  v_month_end
    ), 0),

    'expense_total', COALESCE(SUM(amount) FILTER (
      WHERE transaction_type = 'expense'
        AND transaction_date >= p_month_start
        AND transaction_date <  v_month_end
    ), 0),

    'budgeted_income', COALESCE((
      SELECT SUM(ABS(bl.amount))
      FROM budget_lines bl
      JOIN budgets b ON b.id = bl.budget_id
      JOIN categories c ON c.id = bl.category_id
      WHERE b.tenant_id   = v_tenant_id
        AND b.user_id     = v_user_id
        AND b.month_start = p_month_start
        AND c.category_type = 'income'
    ), 0),

    'budgeted_expense', COALESCE((
      SELECT SUM(ABS(bl.amount))
      FROM budget_lines bl
      JOIN budgets b ON b.id = bl.budget_id
      JOIN categories c ON c.id = bl.category_id
      WHERE b.tenant_id   = v_tenant_id
        AND b.user_id     = v_user_id
        AND b.month_start = p_month_start
        AND c.category_type = 'expense'
    ), 0),

    'monthly_trend', (
      SELECT json_agg(m ORDER BY m.month_start)
      FROM (
        SELECT
          date_trunc('month', transaction_date)::date         AS month_start,
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'),  0) AS income,
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) AS expenses
        FROM transactions
        WHERE tenant_id      = v_tenant_id
          AND transaction_date >= (p_month_start - interval '5 months')::date
          AND transaction_date <  v_month_end
        GROUP BY date_trunc('month', transaction_date)::date
      ) m
    ),

    'budget_vs_actual', (
      SELECT json_agg(r ORDER BY
        CASE WHEN r.category_type = 'income' THEN 0 ELSE 1 END,
        CASE
          WHEN r.tag = 'standard'   THEN 0
          WHEN r.tag = 'savings'    THEN 1
          WHEN r.tag = 'investment' THEN 2
          ELSE 3
        END,
        r.category_name)
      FROM (
        SELECT
          c.id            AS category_id,
          c.name          AS category_name,
          c.category_type,
          c.tag,
          ABS(COALESCE(bl.amount, 0))       AS budgeted,
          COALESCE(SUM(t.amount), 0)        AS actual
        FROM categories c
        LEFT JOIN budgets b
          ON  b.tenant_id   = v_tenant_id
          AND b.user_id     = v_user_id
          AND b.month_start = p_month_start
        LEFT JOIN budget_lines bl
          ON  bl.budget_id   = b.id
          AND bl.category_id = c.id
        LEFT JOIN transactions t
          ON  t.category_id      = c.id
          AND t.tenant_id        = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date <  v_month_end
        WHERE c.tenant_id = v_tenant_id
          AND c.is_active = true
        GROUP BY c.id, c.name, c.category_type, c.tag, bl.amount
      ) r
    ),

    'savings_accounts', (
      SELECT json_agg(s)
      FROM (
        SELECT
          a.id,
          a.name,
          a.interest_rate,
          a.opening_balance,
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id         = a.id), 0) AS in_this_month,
          COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0) AS out_this_month
        FROM accounts a
        LEFT JOIN transactions t
          ON  (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id         = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date <  v_month_end
        WHERE a.tenant_id    = v_tenant_id
          AND a.account_kind = 'savings'
          AND a.is_active    = true
        GROUP BY a.id, a.name, a.interest_rate, a.opening_balance
      ) s
    ),

    'investment_accounts', (
      SELECT json_agg(i)
      FROM (
        SELECT
          a.id,
          a.name,
          a.account_subtype,
          a.interest_rate,
          a.opening_balance,
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id         = a.id), 0) AS in_this_month,
          COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0) AS out_this_month
        FROM accounts a
        LEFT JOIN transactions t
          ON  (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id         = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date <  v_month_end
        WHERE a.tenant_id    = v_tenant_id
          AND a.account_kind = 'investment'
          AND a.is_active    = true
        GROUP BY a.id, a.name, a.account_subtype, a.interest_rate, a.opening_balance
      ) i
    ),

    'debt_accounts', (
      SELECT json_agg(d)
      FROM (
        SELECT
          a.id,
          a.name,
          a.account_subtype,
          a.interest_rate,
          a.opening_balance,
          -- "Paid": money paid INTO the debt (reduces balance) — linked_account_id
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id         = a.id), 0) AS in_this_month,
          -- "Spent": money charged VIA the debt account — payment_source_account_id
          COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0) AS paid_this_month
        FROM accounts a
        LEFT JOIN transactions t
          ON  (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id         = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date <  v_month_end
        WHERE a.tenant_id    = v_tenant_id
          AND a.account_kind = 'debt'
          AND (a.account_subtype IS NULL OR a.account_subtype <> 'credit_card')
          AND a.is_active    = true
        GROUP BY a.id, a.name, a.account_subtype, a.interest_rate, a.opening_balance
      ) d
    ),

    'credit_card_accounts', (
      SELECT json_agg(cc)
      FROM (
        SELECT
          a.id,
          a.name,
          a.interest_rate,
          a.opening_balance,
          -- Charged: expenses put ON the card — payment_source_account_id
          COALESCE(SUM(t.amount) FILTER (WHERE t.payment_source_account_id = a.id), 0) AS charged_this_month,
          -- Payment: money sent TO the card to pay it down — linked_account_id
          COALESCE(SUM(t.amount) FILTER (WHERE t.linked_account_id         = a.id), 0) AS payment_this_month
        FROM accounts a
        LEFT JOIN transactions t
          ON  (t.linked_account_id = a.id OR t.payment_source_account_id = a.id)
          AND t.tenant_id         = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date <  v_month_end
        WHERE a.tenant_id       = v_tenant_id
          AND a.account_kind    = 'debt'
          AND a.account_subtype = 'credit_card'   -- exact match, lowercase
          AND a.is_active       = true
        GROUP BY a.id, a.name, a.interest_rate, a.opening_balance
      ) cc
    ),

    'pending_review_count', 0,

    -- FIXED: budget is only "set" when a budget row exists AND at least one
    -- budget_lines row has amount > 0.  An empty budget no longer counts.
    'budget_is_set', (
      SELECT EXISTS (
        SELECT 1
        FROM budgets b
        JOIN budget_lines bl ON bl.budget_id = b.id
        WHERE b.tenant_id   = v_tenant_id
          AND b.user_id     = v_user_id
          AND b.month_start = p_month_start
          AND bl.amount     > 0
      )
    ),

    'last_transaction_date', (
      SELECT MAX(transaction_date)::text
      FROM transactions
      WHERE tenant_id = v_tenant_id
    )

  ) INTO v_result
  FROM transactions
  WHERE tenant_id = v_tenant_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_dashboard_summary(date) TO authenticated;
