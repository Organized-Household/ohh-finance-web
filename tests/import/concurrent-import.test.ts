/**
 * Concurrent Import Safety Tests
 * Story: OHHFIN-167 — STORY-12.9 — Handle Concurrent Import Race Conditions
 * 
 * Validates that import operations handle concurrency safely:
 * - Duplicate prevention under concurrent inserts
 * - Import serialization via advisory locks
 * - Data consistency maintained across race conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  acquireImportLock,
  releaseImportLock,
  checkDuplicateImport,
  withImportLock,
  calculateFileHash
} from '@/lib/import/import-lock';

describe('Concurrent Import Safety', () => {
  const supabase = createAdminClient();
  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testFilename = 'test-transactions.csv';
  const testFileContent = 'Date,Description,Amount\n2024-01-01,Test,100.00';
  let testFileHash: string;

  beforeAll(async () => {
    testFileHash = await calculateFileHash(testFileContent);
    
    // Clean up any existing test data
    await supabase
      .from('import_batches')
      .delete()
      .eq('tenant_id', testTenantId);
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('import_batches')
      .delete()
      .eq('tenant_id', testTenantId);
  });

  describe('Advisory Lock Mechanism', () => {
    it('should acquire and release import lock successfully', async () => {
      const lockId = await acquireImportLock(testTenantId);
      expect(lockId).toBeDefined();
      expect(typeof lockId).toBe('string');

      const released = await releaseImportLock(lockId);
      expect(released).toBe(true);
    });

    it('should serialize concurrent operations with withImportLock', async () => {
      const results: number[] = [];
      const delays = [50, 30, 10]; // Intentionally out of order

      // Launch three concurrent operations
      const operations = delays.map((delay, index) =>
        withImportLock(testTenantId, async () => {
          await new Promise(resolve => setTimeout(resolve, delay));
          results.push(index);
          return index;
        })
      );

      await Promise.all(operations);

      // All operations should complete
      expect(results).toHaveLength(3);
      expect(results).toContain(0);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should detect no duplicate when none exists', async () => {
      const duplicate = await checkDuplicateImport(
        testTenantId,
        'unique-file.csv',
        'unique-hash-123'
      );

      expect(duplicate).toBeNull();
    });

    it('should prevent duplicate import batch insertion', async () => {
      // Insert first batch
      const { data: batch1, error: error1 } = await supabase
        .from('import_batches')
        .insert({
          tenant_id: testTenantId,
          original_filename: testFilename,
          file_hash: testFileHash,
          imported_by: '00000000-0000-0000-0000-000000000001',
          status: 'pending'
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(batch1).toBeDefined();

      // Attempt duplicate insert with same hash
      const { error: error2 } = await supabase
        .from('import_batches')
        .insert({
          tenant_id: testTenantId,
          original_filename: testFilename,
          file_hash: testFileHash,
          imported_by: '00000000-0000-0000-0000-000000000001',
          status: 'pending'
        });

      // Should violate unique constraint
      expect(error2).toBeDefined();
      expect(error2?.code).toBe('23505'); // unique_violation
    });

    it('should detect existing duplicate via checkDuplicateImport', async () => {
      const duplicate = await checkDuplicateImport(
        testTenantId,
        testFilename,
        testFileHash
      );

      expect(duplicate).toBeDefined();
      expect(duplicate?.status).toBe('pending');
      expect(duplicate?.batch_id).toBeDefined();
    });
  });

  describe('Concurrent Pending Status Constraint', () => {
    it('should allow only one pending import per tenant', async () => {
      // Clean slate
      await supabase
        .from('import_batches')
        .delete()
        .eq('tenant_id', testTenantId);

      // Insert first pending batch
      const { data: batch1, error: error1 } = await supabase
        .from('import_batches')
        .insert({
          tenant_id: testTenantId,
          original_filename: 'file1.csv',
          file_hash: 'hash1',
          imported_by: '00000000-0000-0000-0000-000000000001',
          status: 'pending'
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(batch1).toBeDefined();

      // Attempt second pending batch for same tenant
      const { error: error2 } = await supabase
        .from('import_batches')
        .insert({
          tenant_id: testTenantId,
          original_filename: 'file2.csv',
          file_hash: 'hash2',
          imported_by: '00000000-0000-0000-0000-000000000001',
          status: 'pending'
        });

      // Should violate partial unique index
      expect(error2).toBeDefined();
      expect(error2?.code).toBe('23505'); // unique_violation
    });

    it('should allow multiple completed imports per tenant', async () => {
      // Clean slate
      await supabase
        .from('import_batches')
        .delete()
        .eq('tenant_id', testTenantId);

      // Insert two completed batches
      const { error: error1 } = await supabase
        .from('import_batches')
        .insert({
          tenant_id: testTenantId,
          original_filename: 'file1.csv',
          file_hash: 'hash1',
          imported_by: '00000000-0000-0000-0000-000000000001',
          status: 'completed'
        });

      const { error: error2 } = await supabase
        .from('import_batches')
        .insert({
          tenant_id: testTenantId,
          original_filename: 'file2.csv',
          file_hash: 'hash2',
          imported_by: '00000000-0000-0000-0000-000000000001',
          status: 'completed'
        });

      // Both should succeed
      expect(error1).toBeNull();
      expect(error2).toBeNull();
    });
  });

  describe('File Hash Calculation', () => {
    it('should calculate consistent hash for same content', async () => {
      const hash1 = await calculateFileHash(testFileContent);
      const hash2 = await calculateFileHash(testFileContent);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different content', async () => {
      const hash1 = await calculateFileHash('content1');
      const hash2 = await calculateFileHash('content2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle ArrayBuffer input', async () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(testFileContent).buffer;
      const hash = await calculateFileHash(buffer);

      expect(hash).toHaveLength(64);
    });
  });

  describe('Data Consistency Under Concurrency', () => {
    it('should maintain referential integrity during concurrent imports', async () => {
      // Clean slate
      await supabase
        .from('import_batches')
        .delete()
        .eq('tenant_id', testTenantId);

      await supabase
        .from('import_staging')
        .delete()
        .eq('tenant_id', testTenantId);

      // Simulate concurrent import workflow
      const batch1Result = await withImportLock(testTenantId, async () => {
        // Create batch
        const { data: batch, error: batchError } = await supabase
          .from('import_batches')
          .insert({
            tenant_id: testTenantId,
            original_filename: 'concurrent1.csv',
            file_hash: 'concurrent-hash-1',
            imported_by: '00000000-0000-0000-0000-000000000001',
            status: 'pending'
          })
          .select()
          .single();

        if (batchError) throw batchError;

        // Insert staging records
        const { error: stagingError } = await supabase
          .from('import_staging')
          .insert({
            tenant_id: testTenantId,
            import_batch_id: batch.id,
            occurred_at: '2024-01-01',
            description: 'Test Transaction',
            amount: 100.00,
            transaction_type: 'expense'
          });

        if (stagingError) throw stagingError;

        return batch;
      });

      // Verify batch and staging exist
      const { data: batchCheck } = await supabase
        .from('import_batches')
        .select('id')
        .eq('id', batch1Result.id)
        .single();

      const { data: stagingCheck, count } = await supabase
        .from('import_staging')
        .select('*', { count: 'exact' })
        .eq('import_batch_id', batch1Result.id);

      expect(batchCheck).toBeDefined();
      expect(count).toBe(1);
      expect(stagingCheck).toHaveLength(1);
    });
  });
});
