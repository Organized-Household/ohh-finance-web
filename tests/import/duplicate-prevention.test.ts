import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHash } from 'crypto';

describe('Import Duplicate Prevention (OHHFIN-161)', () => {
  const supabase = createAdminClient();
  let testTenantId: string;
  let testUserId: string;
  const testFileContent = 'Date,Description,Amount\n2024-01-15,Test Transaction,100.00';
  const fileFingerprint = createHash('sha256').update(testFileContent).digest('hex');

  beforeAll(async () => {
    // Create test tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ alias: 'test-duplicate-prevention-tenant' })
      .select('id')
      .single();

    if (tenantError || !tenant) {
      throw new Error('Failed to create test tenant: ' + tenantError?.message);
    }
    testTenantId = tenant.id;

    // Create test user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test-duplicate-prevention@example.com',
      password: 'test-password-123',
      email_confirm: true
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test user: ' + authError?.message);
    }
    testUserId = authUser.user.id;

    // Create tenant membership
    await supabase.from('tenant_members').insert({
      tenant_id: testTenantId,
      user_id: testUserId,
      role: 'admin'
    });
  });

  afterAll(async () => {
    // Clean up in reverse dependency order
    await supabase.from('import_staging').delete().eq('tenant_id', testTenantId);
    await supabase.from('import_batches').delete().eq('tenant_id', testTenantId);
    await supabase.from('tenant_members').delete().eq('tenant_id', testTenantId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('should allow first import with fingerprint', async () => {
    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        tenant_id: testTenantId,
        original_filename: 'test-first.csv',
        imported_by: testUserId,
        file_fingerprint: fileFingerprint,
        status: 'pending'
      })
      .select('id, file_fingerprint')
      .single();

    expect(error).toBeNull();
    expect(batch).toBeDefined();
    expect(batch!.file_fingerprint).toBe(fileFingerprint);
  });

  it('should reject duplicate import for same tenant', async () => {
    const { error } = await supabase
      .from('import_batches')
      .insert({
        tenant_id: testTenantId,
        original_filename: 'test-duplicate.csv',
        imported_by: testUserId,
        file_fingerprint: fileFingerprint,
        status: 'pending'
      });

    expect(error).toBeDefined();
    expect(error?.code).toBe('23505'); // PostgreSQL unique violation
    expect(error?.message).toContain('import_batches_tenant_fingerprint_unique');
  });

  it('should allow same file for different tenant', async () => {
    // Create second tenant
    const { data: tenant2, error: tenant2Error } = await supabase
      .from('tenants')
      .insert({ alias: 'test-duplicate-prevention-tenant-2' })
      .select('id')
      .single();

    expect(tenant2Error).toBeNull();
    expect(tenant2).toBeDefined();

    const tenant2Id = tenant2!.id;

    // Create tenant membership for second tenant
    await supabase.from('tenant_members').insert({
      tenant_id: tenant2Id,
      user_id: testUserId,
      role: 'admin'
    });

    // Same fingerprint, different tenant should succeed
    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        tenant_id: tenant2Id,
        original_filename: 'test-different-tenant.csv',
        imported_by: testUserId,
        file_fingerprint: fileFingerprint,
        status: 'pending'
      })
      .select('id, file_fingerprint')
      .single();

    expect(error).toBeNull();
    expect(batch).toBeDefined();
    expect(batch!.file_fingerprint).toBe(fileFingerprint);

    // Cleanup second tenant
    await supabase.from('import_batches').delete().eq('tenant_id', tenant2Id);
    await supabase.from('tenant_members').delete().eq('tenant_id', tenant2Id);
    await supabase.from('tenants').delete().eq('id', tenant2Id);
  });

  it('should allow null fingerprint for backwards compatibility', async () => {
    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        tenant_id: testTenantId,
        original_filename: 'test-null-fingerprint.csv',
        imported_by: testUserId,
        file_fingerprint: null,
        status: 'pending'
      })
      .select('id, file_fingerprint')
      .single();

    expect(error).toBeNull();
    expect(batch).toBeDefined();
    expect(batch!.file_fingerprint).toBeNull();
  });

  it('should verify index exists for performance', async () => {
    const { data: indexes, error } = await supabase.rpc('get_table_indexes', {
      table_name: 'import_batches'
    });

    expect(error).toBeNull();
    expect(indexes).toBeDefined();
    
    const fingerprintIndex = indexes?.find((idx: { indexname: string }) =>
      idx.indexname === 'idx_import_batches_fingerprint'
    );
    
    expect(fingerprintIndex).toBeDefined();
  });
});
