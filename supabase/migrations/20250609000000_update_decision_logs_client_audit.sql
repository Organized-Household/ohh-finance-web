-- Update decision_logs to remove CLIENT TYPE WARNING and document confirmed client types
-- Execution: SEED-OHHFIN-WEB-GAP-EXPENSE-TYPES-PAGE

UPDATE decision_logs
SET patterns_used = replace(
  patterns_used,
  'CLIENT TYPE WARNING: createAdminClient() used for tenant_members count query. This is a read-only UI metadata query (displaying household member count). The anon client with RLS may be sufficient. Requires verification of RLS policy on tenant_members table before changing. If SELECT policy allows authenticated users to read rows for their own tenant_id, switch to createClient(). Otherwise document why service role is required.',
  '-- Confirmed client types after OHHFIN-260 audit:
   - tenants.name query: admin client used (service role required: no RLS SELECT policy on tenants for member reads)
   - tenant_members count query: anon client used (RLS SELECT policy allows authenticated users to read tenant_members within their tenant)'
)
WHERE execution_id = 'SEED-OHHFIN-WEB-GAP-EXPENSE-TYPES-PAGE';

-- Execution: SEED-OHHFIN-WEB-GAP-BUDGET-CATEGORIES-PAGE

UPDATE decision_logs
SET patterns_used = replace(
  patterns_used,
  'CLIENT TYPE WARNING: createAdminClient() used for two queries: (1) tenants.name and (2) tenant_members count. Both are read-only UI metadata. The anon client may be sufficient for both. Requires verification of RLS policies on both tables before changing. For tenant_members: if SELECT policy allows authenticated users to read rows for their own tenant_id, switch to createClient(). For tenants: if SELECT policy allows authenticated members to read their own tenant row, switch to createClient(). Otherwise document why service role is required for each query.',
  '-- Confirmed client types after OHHFIN-260 audit:
   - tenants.name query: admin client used (service role required: no RLS SELECT policy on tenants for member reads)
   - tenant_members count query: anon client used (RLS SELECT policy allows authenticated users to read tenant_members within their tenant)'
)
WHERE execution_id = 'SEED-OHHFIN-WEB-GAP-BUDGET-CATEGORIES-PAGE';
