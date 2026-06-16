import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHash } from 'crypto';

describe('Import Duplicate Prevention (OHHFIN-161)', () => {
  const supabase = createAdminClient();
  let testTenantId: string;
  let testUserId: string;
  const testFileContent = 'Date,Description,Amount\n2024-01-15,Test Transaction,100.00';
  const fileFingerprint = createHash('sha256').update(testFileContent).digest('hex');
  const uniqueSuffix = Date.now().toString();

  beforeAll(async () => {
    // Create test tenant with unique alias to avoid collision from previous runs
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ alias: `test-dup-prevention-${uniqueSuffix}` })
      .select('id')
      .single();

    if (tenantError || !tenant) {
      throw new Error('Failed to create test tenant: ' + tenantError?.message);
    }
    testTenantId = tenant.id;

    // Create test user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: `test-dup-prevention-${uniqueSuffix}@example.com`,
      password: 'test-password-123',
      email_confirm: true
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test user: ' + authError?.message);
    }
    testUserId = authUser.user.id;

    await supabase.from('tenant_members').insert({
      tenant_id: testTenantId,
      user_id: testUserId,
      role: 'admin'
    });
  });

  afterAll(async () => {
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
        status: 'created'
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
        status: 'created'
      });

    expect(error).toBeDefined();
    expect(error?.code).toBe('23505');
    expect(error?.message).toContain('import_batches_tenant_fingerprint_unique');
  });

  it('should allow same file for different tenant', async () => {
    const { data: tenant2, error: tenant2Error } = await supabase
      .from('tenants')
      .insert({ alias: `test-dup-prevention-2-${uniqueSuffix}` })
      .select('id')
      .single();

    expect(tenant2Error).toBeNull();
    expect(tenant2).toBeDefined();

    const tenant2Id = tenant2!.id;

    await supabase.from('tenant_members').insert({
      tenant_id: tenant2Id,
      user_id: testUserId,
      role: 'admin'
    });

    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        tenant_id: tenant2Id,
        original_filename: 'test-different-tenant.csv',
        imported_by: testUserId,
        file_fingerprint: fileFingerprint,
        status: 'created'
      })
      .select('id, file_fingerprint')
      .single();

    expect(error).toBeNull();
    expect(batch).toBeDefined();
    expect(batch!.file_fingerprint).toBe(fileFingerprint);

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
        status: 'created'
      })
      .select('id, file_fingerprint')
      .single();

    expect(error).toBeNull();
    expect(batch).toBeDefined();
    expect(batch!.file_fingerprint).toBeNull();
  });
});
