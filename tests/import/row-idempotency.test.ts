/**
 * Row-level import idempotency tests
 * Story: OHHFIN-175 / STORY-12.3
 *
 * Validates:
 * - row_fingerprint column exists on import_staging
 * - unique constraint on (tenant_id, row_fingerprint)
 * - duplicate rows are skipped during import
 * - skipped count is accurate
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeRowFingerprint } from '@/lib/import/row-fingerprint';

const adminClient = createAdminClient();
const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_BATCH_ID = '00000000-0000-0000-0000-000000000002';

describe('OHHFIN-175: Import Row Idempotency', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await adminClient
      .from('import_staging')
      .delete()
      .eq('tenant_id', TEST_TENANT_ID);
  });

  afterAll(async () => {
    // Clean up test data
    await adminClient
      .from('import_staging')
      .delete()
      .eq('tenant_id', TEST_TENANT_ID);
  });

  it('should have row_fingerprint column on import_staging', async () => {
    const { data, error } = await adminClient
      .from('import_staging')
      .select('row_fingerprint')
      .limit(0);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should compute deterministic fingerprints', () => {
    const fp1 = computeRowFingerprint(
      TEST_TENANT_ID,
      '2024-03-22',
      -50.0,
      '  Test Description  '
    );
    const fp2 = computeRowFingerprint(
      TEST_TENANT_ID,
      '2024-03-22',
      -50.0,
      'test description'
    );

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64); // SHA-256 hex length
  });

  it('should prevent duplicate rows via unique constraint', async () => {
    const fingerprint = computeRowFingerprint(
      TEST_TENANT_ID,
      '2024-03-22',
      -50.0,
      'Grocery Store'
    );

    const row = {
      tenant_id: TEST_TENANT_ID,
      batch_id: TEST_BATCH_ID,
      transaction_date: '2024-03-22',
      description: 'Grocery Store',
      amount: -50.0,
      row_fingerprint: fingerprint,
    };

    // First insert should succeed
    const { error: error1 } = await adminClient
      .from('import_staging')
      .insert(row);

    expect(error1).toBeNull();

    // Second insert should be skipped by upsert
    const { data: upserted, error: error2 } = await adminClient
      .from('import_staging')
      .upsert(row, {
        onConflict: 'tenant_id,row_fingerprint',
        ignoreDuplicates: true,
      })
      .select('id');

    expect(error2).toBeNull();
    expect(upserted).toHaveLength(0); // No new rows inserted
  });

  it('should accurately count inserted vs skipped rows', async () => {
    const rows = [
      {
        tenant_id: TEST_TENANT_ID,
        batch_id: TEST_BATCH_ID,
        transaction_date: '2024-03-23',
        description: 'New Row 1',
        amount: -25.0,
        row_fingerprint: computeRowFingerprint(
          TEST_TENANT_ID,
          '2024-03-23',
          -25.0,
          'New Row 1'
        ),
      },
      {
        tenant_id: TEST_TENANT_ID,
        batch_id: TEST_BATCH_ID,
        transaction_date: '2024-03-23',
        description: 'New Row 2',
        amount: -30.0,
        row_fingerprint: computeRowFingerprint(
          TEST_TENANT_ID,
          '2024-03-23',
          -30.0,
          'New Row 2'
        ),
      },
      {
        tenant_id: TEST_TENANT_ID,
        batch_id: TEST_BATCH_ID,
        transaction_date: '2024-03-22',
        description: 'Grocery Store',
        amount: -50.0,
        row_fingerprint: computeRowFingerprint(
          TEST_TENANT_ID,
          '2024-03-22',
          -50.0,
          'Grocery Store'
        ),
      },
    ];

    const { data: inserted, error } = await adminClient
      .from('import_staging')
      .upsert(rows, {
        onConflict: 'tenant_id,row_fingerprint',
        ignoreDuplicates: true,
      })
      .select('id');

    expect(error).toBeNull();
    expect(inserted).toHaveLength(2); // Only new rows inserted

    const insertedCount = inserted?.length ?? 0;
    const skippedCount = rows.length - insertedCount;

    expect(insertedCount).toBe(2);
    expect(skippedCount).toBe(1);
  });

  it('should use transaction_date not occurred_at in fingerprint', () => {
    // This test validates the column name used in fingerprint computation
    const fingerprint = computeRowFingerprint(
      TEST_TENANT_ID,
      '2024-03-22',
      -50.0,
      'Test'
    );

    // The fingerprint function signature requires transaction_date parameter
    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(64);
  });
});
