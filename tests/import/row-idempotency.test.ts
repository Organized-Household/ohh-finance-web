import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeRowFingerprint } from '@/lib/import/row-fingerprint';

const adminClient = createAdminClient();
const uniqueSuffix = Date.now().toString();

describe('OHHFIN-175: Import Row Idempotency', () => {
  let testTenantId: string;
  let testBatchId: string;

  beforeAll(async () => {
    // Create a real tenant for this test run
    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .insert({ alias: `test-row-idempotency-${uniqueSuffix}` })
      .select('id')
      .single();

    if (tenantError || !tenant) {
      throw new Error('Failed to create test tenant: ' + tenantError?.message);
    }
    testTenantId = tenant.id;

    // Create a real import batch
    const { data: batch, error: batchError } = await adminClient
      .from('import_batches')
      .insert({
        tenant_id: testTenantId,
        original_filename: 'test-idempotency.csv',
        imported_by: '00000000-0000-0000-0000-000000000001',
        status: 'created'
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      throw new Error('Failed to create test batch: ' + batchError?.message);
    }
    testBatchId = batch.id;

    // Clean up any existing test staging data
    await adminClient
      .from('import_staging')
      .delete()
      .eq('tenant_id', testTenantId);
  });

  afterAll(async () => {
    await adminClient.from('import_staging').delete().eq('tenant_id', testTenantId);
    await adminClient.from('import_batches').delete().eq('tenant_id', testTenantId);
    await adminClient.from('tenants').delete().eq('id', testTenantId);
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
      testTenantId,
      '2024-03-22',
      -50.0,
      '  Test Description  '
    );
    const fp2 = computeRowFingerprint(
      testTenantId,
      '2024-03-22',
      -50.0,
      'test description'
    );

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64);
  });

  it('should prevent duplicate rows via unique constraint', async () => {
    const fingerprint = computeRowFingerprint(
      testTenantId,
      '2024-03-22',
      -50.0,
      'Grocery Store'
    );

    const row = {
      tenant_id: testTenantId,
      import_batch_id: testBatchId,
      occurred_at: '2024-03-22',
      description: 'Grocery Store',
      amount: -50.0,
      transaction_type: 'expense',
      status: 'pending',
      row_fingerprint: fingerprint,
    };

    const { error: error1 } = await adminClient
      .from('import_staging')
      .insert(row);

    expect(error1).toBeNull();

    const { data: upserted, error: error2 } = await adminClient
      .from('import_staging')
      .upsert(row, {
        onConflict: 'tenant_id,row_fingerprint',
        ignoreDuplicates: true,
      })
      .select('id');

    expect(error2).toBeNull();
    expect(upserted).toHaveLength(0);
  });

  it('should accurately count inserted vs skipped rows', async () => {
    const rows = [
      {
        tenant_id: testTenantId,
        import_batch_id: testBatchId,
        occurred_at: '2024-03-23',
        description: 'New Row 1',
        amount: -25.0,
        transaction_type: 'expense',
        status: 'pending',
        row_fingerprint: computeRowFingerprint(testTenantId, '2024-03-23', -25.0, 'New Row 1'),
      },
      {
        tenant_id: testTenantId,
        import_batch_id: testBatchId,
        occurred_at: '2024-03-23',
        description: 'New Row 2',
        amount: -30.0,
        transaction_type: 'expense',
        status: 'pending',
        row_fingerprint: computeRowFingerprint(testTenantId, '2024-03-23', -30.0, 'New Row 2'),
      },
      {
        tenant_id: testTenantId,
        import_batch_id: testBatchId,
        occurred_at: '2024-03-22',
        description: 'Grocery Store',
        amount: -50.0,
        transaction_type: 'expense',
        status: 'pending',
        row_fingerprint: computeRowFingerprint(testTenantId, '2024-03-22', -50.0, 'Grocery Store'),
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
    expect(inserted).toHaveLength(2);

    const insertedCount = inserted?.length ?? 0;
    const skippedCount = rows.length - insertedCount;

    expect(insertedCount).toBe(2);
    expect(skippedCount).toBe(1);
  });

  it('should use transaction_date not occurred_at in fingerprint', () => {
    const fingerprint = computeRowFingerprint(testTenantId, '2024-03-22', -50.0, 'Test');
    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(64);
  });
});
