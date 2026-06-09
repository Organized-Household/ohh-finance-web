/**
 * RLS Coverage Validation Tests
 * OHHFIN-160 — STORY-12.1
 * 
 * Validates that all tenant-owned tables have:
 * 1. RLS enabled (relrowsecurity = true)
 * 2. At least one RLS policy defined
 * 
 * This is a structural validation that gates deployments against
 * schema changes that add tables without proper tenant isolation.
 */

import { createClient } from '@supabase/supabase-js';
import { describe, test, expect, beforeAll } from 'vitest';

// Required tables that must have RLS
const REQUIRED_TABLES_WITH_RLS = [
  'accounts',
  'budget_lines',
  'budgets',
  'categories',
  'device_tokens',
  'expense_types',
  'import_batches',
  'import_staging',
  'invitations',
  'profiles',
  'tenant_members',
  'tenants',
  'transactions'
];

describe('RLS Coverage Validation', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for RLS coverage tests'
      );
    }

    supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  });

  // Test each required table individually for clear failure reporting
  REQUIRED_TABLES_WITH_RLS.forEach(tableName => {
    describe(`Table: ${tableName}`, () => {
      test('has RLS enabled', async () => {
        const { data, error } = await supabase.rpc('check_rls_enabled', {
          table_name: tableName
        });

        if (error) {
          // Fallback: query pg_class directly
          const { data: rlsData, error: rlsError } = await supabase
            .from('pg_class')
            .select('relname, relrowsecurity')
            .eq('relname', tableName)
            .eq('relnamespace', 'public')
            .single();

          if (rlsError) {
            throw new Error(
              `Failed to check RLS status for ${tableName}: ${rlsError.message}`
            );
          }

          expect(
            rlsData?.relrowsecurity,
            `Table ${tableName} must have RLS enabled (relrowsecurity = true)`
          ).toBe(true);
        } else {
          expect(
            data,
            `Table ${tableName} must have RLS enabled`
          ).toBe(true);
        }
      });

      test('has at least one RLS policy', async () => {
        const { data, error } = await supabase.rpc('check_rls_policies', {
          table_name: tableName
        });

        if (error) {
          // Fallback: query pg_policies directly
          const { data: policyData, error: policyError } = await supabase
            .from('pg_policies')
            .select('policyname')
            .eq('tablename', tableName)
            .eq('schemaname', 'public');

          if (policyError) {
            throw new Error(
              `Failed to check policies for ${tableName}: ${policyError.message}`
            );
          }

          expect(
            policyData?.length || 0,
            `Table ${tableName} must have at least one RLS policy`
          ).toBeGreaterThan(0);
        } else {
          expect(
            data,
            `Table ${tableName} must have at least one RLS policy`
          ).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Forward-looking validation', () => {
    test('all public schema tables have at least one RLS policy', async () => {
      // Get all tables in public schema
      const { data: allTables, error: tablesError } = await supabase.rpc(
        'get_all_public_tables'
      );

      if (tablesError) {
        // Fallback: query pg_tables directly
        const { data: tableData, error: tableQueryError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');

        if (tableQueryError) {
          throw new Error(
            `Failed to query public tables: ${tableQueryError.message}`
          );
        }

        const tables = tableData?.map(t => t.tablename) || [];

        // Get policy counts for all tables
        const { data: policyData, error: policyError } = await supabase
          .from('pg_policies')
          .select('tablename')
          .eq('schemaname', 'public');

        if (policyError) {
          throw new Error(
            `Failed to query policies: ${policyError.message}`
          );
        }

        const tablesWithPolicies = new Set(
          policyData?.map(p => p.tablename) || []
        );

        const tablesWithoutPolicies = tables.filter(
          t => !tablesWithPolicies.has(t)
        );

        expect(
          tablesWithoutPolicies,
          `All tables in public schema must have at least one RLS policy. ` +
          `Tables without policies: ${tablesWithoutPolicies.join(', ')}`
        ).toEqual([]);
      } else {
        const tablesWithoutPolicies = allTables || [];
        expect(
          tablesWithoutPolicies,
          `All tables in public schema must have at least one RLS policy. ` +
          `Tables without policies: ${tablesWithoutPolicies.join(', ')}`
        ).toEqual([]);
      }
    });

    test('all public schema tables have RLS enabled', async () => {
      // Get all tables with RLS disabled
      const { data: tablesWithoutRLS, error } = await supabase.rpc(
        'get_tables_without_rls'
      );

      if (error) {
        // Fallback: query pg_class directly
        const { data: tableData, error: queryError } = await supabase
          .from('pg_class')
          .select('relname, relrowsecurity')
          .eq('relkind', 'r')
          .eq('relnamespace', 'public');

        if (queryError) {
          throw new Error(
            `Failed to query table RLS status: ${queryError.message}`
          );
        }

        const tablesWithoutRLS = tableData
          ?.filter(t => !t.relrowsecurity)
          .map(t => t.relname) || [];

        expect(
          tablesWithoutRLS,
          `All tables in public schema must have RLS enabled. ` +
          `Tables without RLS: ${tablesWithoutRLS.join(', ')}`
        ).toEqual([]);
      } else {
        expect(
          tablesWithoutRLS || [],
          `All tables in public schema must have RLS enabled. ` +
          `Tables without RLS: ${(tablesWithoutRLS || []).join(', ')}`
        ).toEqual([]);
      }
    });
  });
});
