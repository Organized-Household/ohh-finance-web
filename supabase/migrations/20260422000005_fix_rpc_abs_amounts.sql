-- Migration: 20260422000005_fix_rpc_abs_amounts.sql
-- Rewrites rpc_dashboard_summary to add ABS() on all expense aggregations.
--
-- Convention enforced: income = positive, expense = negative in DB.
-- ABS() applied here so every caller receives positive display values.
-- Income aggregations need no ABS — already positive.

DROP FUNCTION IF EXISTS rpc_dashboard_summary(date);

CREATE OR REPLACE FUNCTION rpc_dashboard_summary(p_month_start date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_month_end date;
  v_result    json;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM tenant_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant membership found';
  END IF;

  v_month_end := p_month_start + interval '1 month';

  SELECT json_build_object(

    -- ── KPIs ────────────────────────────────────────────────────────────────

    -- Income: positive, no ABS needed
    'income_total', COALESCE(SUM(amount) FILTER (
      WHERE transaction_type = 'income'
        AND transaction_date >= p_month_start
        AND transaction_date < v_month_end
        AND tenant_id = v_tenant_id
    ), 0),

    -- Expense: stored negative, return positive
    'expense_total', COALESCE(ABS(SUM(amount)) FILTER (
      WHERE transaction_type = 'expense'
        AND transaction_date >= p_month_start
        AND transaction_date < v_month_end
        AND tenant_id = v_tenant_id
    ), 0),

    -- ── Budget lines ─────────────────────────────────────────────────────────

    'budgeted_income', COALESCE((
      SELECT SUM(bl.amount)
      FROM budget_lines bl
      JOIN budgets b ON b.id = bl.budget_id
      JOIN categories c ON c.id = bl.category_id
      WHERE b.tenant_id = v_tenant_id
        AND b.month_start = p_month_start
        AND c.category_type = 'income'
    ), 0),

    'budgeted_expense', COALESCE((
      SELECT SUM(bl.amount)
      FROM budget_lines bl
      JOIN budgets b ON b.id = bl.budget_id
      JOIN categories c ON c.id = bl.category_id
      WHERE b.tenant_id = v_tenant_id
        AND b.month_start = p_month_start
        AND c.category_type != 'income'
    ), 0),

    -- ── 6-month trend (ABS on expenses) ──────────────────────────────────────

    'monthly_trend', (
      SELECT json_agg(m ORDER BY m.month_start)
      FROM (
        SELECT
          date_trunc('month', transaction_date)::date AS month_start,
          COALESCE(SUM(amount) FILTER (
            WHERE transaction_type = 'income'
          ), 0) AS income,
          COALESCE(ABS(SUM(amount)) FILTER (
            WHERE transaction_type = 'expense'
          ), 0) AS expenses
        FROM transactions
        WHERE tenant_id = v_tenant_id
          AND transaction_date >= (p_month_start - interval '5 months')
          AND transaction_date < v_month_end
        GROUP BY date_trunc('month', transaction_date)::date
      ) m
    ),

    -- ── Budget vs Actual (ABS on actual) ─────────────────────────────────────

    'budget_vs_actual', (
      SELECT json_agg(r ORDER BY r.tag, r.category_name)
      FROM (
        SELECT
          c.id   AS category_id,
          c.name AS category_name,
          c.tag,
          c.category_type,
          COALESCE(bl.amount, 0)      AS budgeted,
          COALESCE(ABS(SUM(t.amount)), 0) AS actual
        FROM categories c
        LEFT JOIN budgets b ON b.tenant_id = v_tenant_id
          AND b.month_start = p_month_start
        LEFT JOIN budget_lines bl ON bl.budget_id = b.id
          AND bl.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id
          AND t.tenant_id = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date < v_month_end
        WHERE c.tenant_id = v_tenant_id
          AND c.is_active = true
        GROUP BY c.id, c.name, c.tag, c.category_type, bl.amount
      ) r
    ),

    -- ── Savings accounts (ABS on in/out) ─────────────────────────────────────

    'savings_accounts', (
      SELECT json_agg(s)
      FROM (
        SELECT
          a.id, a.name, a.interest_rate, a.opening_balance,
          a.target_amount, a.target_date,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.linked_account_id = a.id
          )), 0) AS in_this_month,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.payment_source_account_id = a.id
          )), 0) AS out_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (
            t.linked_account_id = a.id
            OR t.payment_source_account_id = a.id
          )
          AND t.tenant_id = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date < v_month_end
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'savings'
          AND a.is_active = true
        GROUP BY a.id, a.name, a.interest_rate, a.opening_balance,
                 a.target_amount, a.target_date
      ) s
    ),

    -- ── Investment accounts (ABS on in/out) ──────────────────────────────────

    'investment_accounts', (
      SELECT json_agg(i)
      FROM (
        SELECT
          a.id, a.name, a.account_subtype, a.interest_rate,
          a.opening_balance, a.target_amount, a.target_date,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.linked_account_id = a.id
          )), 0) AS in_this_month,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.payment_source_account_id = a.id
          )), 0) AS out_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (
            t.linked_account_id = a.id
            OR t.payment_source_account_id = a.id
          )
          AND t.tenant_id = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date < v_month_end
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'investment'
          AND a.is_active = true
        GROUP BY a.id, a.name, a.account_subtype, a.interest_rate,
                 a.opening_balance, a.target_amount, a.target_date
      ) i
    ),

    -- ── Debt accounts non-CC (ABS on paid/spent) ─────────────────────────────

    'debt_accounts', (
      SELECT json_agg(d)
      FROM (
        SELECT
          a.id, a.name, a.account_subtype, a.interest_rate,
          a.opening_balance, a.target_amount, a.target_date,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.linked_account_id = a.id
          )), 0) AS paid_this_month,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.payment_source_account_id = a.id
          )), 0) AS spent_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (
            t.linked_account_id = a.id
            OR t.payment_source_account_id = a.id
          )
          AND t.tenant_id = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date < v_month_end
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'debt'
          AND (a.account_subtype IS NULL OR a.account_subtype != 'credit_card')
          AND a.is_active = true
        GROUP BY a.id, a.name, a.account_subtype, a.interest_rate,
                 a.opening_balance, a.target_amount, a.target_date
      ) d
    ),

    -- ── Credit card accounts (ABS on charged/payment) ────────────────────────

    'credit_card_accounts', (
      SELECT json_agg(cc)
      FROM (
        SELECT
          a.id, a.name, a.interest_rate, a.opening_balance,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.payment_source_account_id = a.id
          )), 0) AS charged_this_month,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.linked_account_id = a.id
          )), 0) AS payment_this_month
        FROM accounts a
        LEFT JOIN transactions t ON (
            t.linked_account_id = a.id
            OR t.payment_source_account_id = a.id
          )
          AND t.tenant_id = v_tenant_id
          AND t.transaction_date >= p_month_start
          AND t.transaction_date < v_month_end
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'debt'
          AND a.account_subtype = 'credit_card'
          AND a.is_active = true
        GROUP BY a.id, a.name, a.interest_rate, a.opening_balance
      ) cc
    ),

    -- ── Savings goals — all-time contributions (ABS) ─────────────────────────

    'savings_goals', (
      SELECT json_agg(g)
      FROM (
        SELECT
          a.id, a.name, a.target_amount, a.target_date,
          COALESCE(ABS(SUM(t.amount) FILTER (
            WHERE t.linked_account_id = a.id
          )), 0) AS contributed_all_time
        FROM accounts a
        LEFT JOIN transactions t ON t.linked_account_id = a.id
          AND t.tenant_id = v_tenant_id
        WHERE a.tenant_id = v_tenant_id
          AND a.account_kind = 'savings'
          AND a.is_active = true
          AND a.target_amount IS NOT NULL
        GROUP BY a.id, a.name, a.target_amount, a.target_date
      ) g
    ),

    -- ── Investment trend (ABS — contributions stored negative) ───────────────

    'investment_trend', (
      SELECT json_agg(iv ORDER BY iv.month_start)
      FROM (
        SELECT
          date_trunc('month', t.transaction_date)::date AS month_start,
          COALESCE(ABS(SUM(t.amount)), 0) AS contributed
        FROM transactions t
        JOIN accounts a ON a.id = t.linked_account_id
        WHERE t.tenant_id = v_tenant_id
          AND a.account_kind = 'investment'
          AND t.transaction_date >= (p_month_start - interval '5 months')
          AND t.transaction_date < v_month_end
        GROUP BY date_trunc('month', t.transaction_date)::date
      ) iv
    ),

    -- ── Pending import review count ───────────────────────────────────────────

    'pending_review_count', (
      SELECT COUNT(*)
      FROM import_staging
      WHERE tenant_id = v_tenant_id
        AND status = 'pending'
    ),

    -- ── Last transaction date ─────────────────────────────────────────────────

    'last_transaction_date', (
      SELECT MAX(transaction_date)
      FROM transactions
      WHERE tenant_id = v_tenant_id
    ),

    -- ── Budget set flag ───────────────────────────────────────────────────────

    'budget_is_set', (
      SELECT EXISTS (
        SELECT 1 FROM budgets b
        JOIN budget_lines bl ON bl.budget_id = b.id
        WHERE b.tenant_id = v_tenant_id
          AND b.month_start = p_month_start
          AND bl.amount > 0
      )
    )

  ) INTO v_result
  FROM transactions
  WHERE tenant_id = v_tenant_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_dashboard_summary(date) TO authenticated;
