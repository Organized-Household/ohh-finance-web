import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const tenantAEmail = process.env.TEST_TENANT_A_EMAIL!;
const tenantAPassword = process.env.TEST_TENANT_A_PASSWORD!;
const tenantBEmail = process.env.TEST_TENANT_B_EMAIL!;
const tenantBPassword = process.env.TEST_TENANT_B_PASSWORD!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!tenantAEmail || !tenantAPassword || !tenantBEmail || !tenantBPassword) {
  throw new Error('Missing TEST_TENANT_A_EMAIL, TEST_TENANT_A_PASSWORD, TEST_TENANT_B_EMAIL, or TEST_TENANT_B_PASSWORD');
}

describe('RLS Tenant Isolation', () => {
  let clientA: ReturnType<typeof createClient>;
  let clientB: ReturnType<typeof createClient>;
  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    clientA = createClient(supabaseUrl, supabaseAnonKey);
    clientB = createClient(supabaseUrl, supabaseAnonKey);

    const { error: errorA } = await clientA.auth.signInWithPassword({
      email: tenantAEmail,
      password: tenantAPassword,
    });
    if (errorA) throw new Error(`Tenant A login failed: ${errorA.message}`);

    const { error: errorB } = await clientB.auth.signInWithPassword({
      email: tenantBEmail,
      password: tenantBPassword,
    });
    if (errorB) throw new Error(`Tenant B login failed: ${errorB.message}`);

    const { data: memberA } = await clientA
      .from('tenant_members')
      .select('tenant_id')
      .single();
    if (!memberA) throw new Error('Tenant A membership not found');
    tenantAId = memberA.tenant_id;

    const { data: memberB } = await clientB
      .from('tenant_members')
      .select('tenant_id')
      .single();
    if (!memberB) throw new Error('Tenant B membership not found');
    tenantBId = memberB.tenant_id;
  });

  describe('Read Isolation', () => {
    it('accounts: Tenant B cannot read Tenant A accounts', async () => {
      const { data: accountsA } = await clientA.from('accounts').select('id').limit(1);
      if (!accountsA || accountsA.length === 0) {
        return;
      }
      const accountId = accountsA[0].id;

      const { data: accountsB } = await clientB
        .from('accounts')
        .select('id')
        .eq('id', accountId);
      expect(accountsB).toEqual([]);
    });

    it('budget_lines: Tenant B cannot read Tenant A budget_lines', async () => {
      const { data: linesA } = await clientA.from('budget_lines').select('id').limit(1);
      if (!linesA || linesA.length === 0) {
        return;
      }
      const lineId = linesA[0].id;

      const { data: linesB } = await clientB
        .from('budget_lines')
        .select('id')
        .eq('id', lineId);
      expect(linesB).toEqual([]);
    });

    it('budgets: Tenant B cannot read Tenant A budgets', async () => {
      const { data: budgetsA } = await clientA.from('budgets').select('id').limit(1);
      if (!budgetsA || budgetsA.length === 0) {
        return;
      }
      const budgetId = budgetsA[0].id;

      const { data: budgetsB } = await clientB
        .from('budgets')
        .select('id')
        .eq('id', budgetId);
      expect(budgetsB).toEqual([]);
    });

    it('categories: Tenant B cannot read Tenant A categories', async () => {
      const { data: catsA } = await clientA.from('categories').select('id').limit(1);
      if (!catsA || catsA.length === 0) {
        return;
      }
      const catId = catsA[0].id;

      const { data: catsB } = await clientB
        .from('categories')
        .select('id')
        .eq('id', catId);
      expect(catsB).toEqual([]);
    });

    it('device_tokens: Tenant B cannot read Tenant A device_tokens', async () => {
      const { data: tokensA } = await clientA.from('device_tokens').select('id').limit(1);
      if (!tokensA || tokensA.length === 0) {
        return;
      }
      const tokenId = tokensA[0].id;

      const { data: tokensB } = await clientB
        .from('device_tokens')
        .select('id')
        .eq('id', tokenId);
      expect(tokensB).toEqual([]);
    });

    it('expense_types: Tenant B cannot read Tenant A expense_types', async () => {
      const { data: typesA } = await clientA.from('expense_types').select('id').limit(1);
      if (!typesA || typesA.length === 0) {
        return;
      }
      const typeId = typesA[0].id;

      const { data: typesB } = await clientB
        .from('expense_types')
        .select('id')
        .eq('id', typeId);
      expect(typesB).toEqual([]);
    });

    it('import_batches: Tenant B cannot read Tenant A import_batches', async () => {
      const { data: batchesA } = await clientA.from('import_batches').select('id').limit(1);
      if (!batchesA || batchesA.length === 0) {
        return;
      }
      const batchId = batchesA[0].id;

      const { data: batchesB } = await clientB
        .from('import_batches')
        .select('id')
        .eq('id', batchId);
      expect(batchesB).toEqual([]);
    });

    it('import_staging: Tenant B cannot read Tenant A import_staging', async () => {
      const { data: stagingA } = await clientA.from('import_staging').select('id').limit(1);
      if (!stagingA || stagingA.length === 0) {
        return;
      }
      const stagingId = stagingA[0].id;

      const { data: stagingB } = await clientB
        .from('import_staging')
        .select('id')
        .eq('id', stagingId);
      expect(stagingB).toEqual([]);
    });

    it('invitations: Tenant B cannot read Tenant A invitations', async () => {
      const { data: invitesA } = await clientA.from('invitations').select('id').limit(1);
      if (!invitesA || invitesA.length === 0) {
        return;
      }
      const inviteId = invitesA[0].id;

      const { data: invitesB } = await clientB
        .from('invitations')
        .select('id')
        .eq('id', inviteId);
      expect(invitesB).toEqual([]);
    });

    it('profiles: Tenant B cannot read Tenant A profiles', async () => {
      const { data: profilesA } = await clientA.from('profiles').select('user_id').limit(1);
      if (!profilesA || profilesA.length === 0) {
        return;
      }
      const userId = profilesA[0].user_id;

      const { data: profilesB } = await clientB
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId);
      expect(profilesB).toEqual([]);
    });

    it('tenant_members: Tenant B cannot read Tenant A tenant_members', async () => {
      const { data: membersA } = await clientA
        .from('tenant_members')
        .select('tenant_id, user_id')
        .eq('tenant_id', tenantAId)
        .limit(1);
      if (!membersA || membersA.length === 0) {
        return;
      }
      const memberUserId = membersA[0].user_id;

      const { data: membersB } = await clientB
        .from('tenant_members')
        .select('tenant_id, user_id')
        .eq('tenant_id', tenantAId)
        .eq('user_id', memberUserId);
      expect(membersB).toEqual([]);
    });

    it('tenants: Tenant B cannot read Tenant A tenants record', async () => {
      const { data: tenantsB } = await clientB
        .from('tenants')
        .select('id')
        .eq('id', tenantAId);
      expect(tenantsB).toEqual([]);
    });

    it('transactions: Tenant B cannot read Tenant A transactions', async () => {
      const { data: txA } = await clientA.from('transactions').select('id').limit(1);
      if (!txA || txA.length === 0) {
        return;
      }
      const txId = txA[0].id;

      const { data: txB } = await clientB
        .from('transactions')
        .select('id')
        .eq('id', txId);
      expect(txB).toEqual([]);
    });
  });

  describe('Write Isolation', () => {
    it('transactions: Tenant B cannot INSERT transaction with Tenant A tenant_id', async () => {
      const { data: categoriesA } = await clientA.from('categories').select('id').limit(1);
      if (!categoriesA || categoriesA.length === 0) {
        throw new Error('No categories for Tenant A; cannot run insert test');
      }
      const categoryId = categoriesA[0].id;

      const { data: userB } = await clientB.auth.getUser();
      if (!userB.user) throw new Error('Tenant B user not found');

      const { error } = await clientB.from('transactions').insert({
        tenant_id: tenantAId,
        transaction_date: '2025-01-01',
        description: 'Cross-tenant insert attempt',
        amount: 100,
        transaction_type: 'expense',
        category_id: categoryId,
        created_by_user_id: userB.user.id,
      });

      expect(error).toBeTruthy();
      if (error) {
        expect(error.message.toLowerCase()).toContain('policy');
      }
    });

    it('budget_lines: Tenant B cannot UPDATE a budget_line belonging to Tenant A', async () => {
      const { data: linesA } = await clientA.from('budget_lines').select('id').limit(1);
      if (!linesA || linesA.length === 0) {
        return;
      }
      const lineId = linesA[0].id;

      const { error } = await clientB
        .from('budget_lines')
        .update({ amount: 999 })
        .eq('id', lineId);

      expect(error).toBeTruthy();
      if (error) {
        expect(error.message.toLowerCase()).toContain('policy');
      }
    });
  });

  describe('Admin-only Isolation', () => {
    it('categories: non-admin member cannot INSERT a category', async () => {
      const clientMember = createClient(supabaseUrl, supabaseAnonKey);

      const memberEmail = process.env.TEST_MEMBER_EMAIL;
      const memberPassword = process.env.TEST_MEMBER_PASSWORD;

      if (!memberEmail || !memberPassword) {
        console.warn('Skipping admin-only test: TEST_MEMBER_EMAIL or TEST_MEMBER_PASSWORD not set');
        return;
      }

      const { error: loginErr } = await clientMember.auth.signInWithPassword({
        email: memberEmail,
        password: memberPassword,
      });
      if (loginErr) throw new Error(`Member login failed: ${loginErr.message}`);

      const { data: memberData } = await clientMember
        .from('tenant_members')
        .select('tenant_id, role')
        .single();
      if (!memberData) throw new Error('Member membership not found');
      if (memberData.role === 'admin') {
        throw new Error('TEST_MEMBER_EMAIL must be a non-admin member for this test');
      }

      const { data: types } = await clientMember.from('expense_types').select('slug').limit(1);
      if (!types || types.length === 0) {
        throw new Error('No expense_types found for category insert test');
      }
      const tagSlug = types[0].slug;

      const { error } = await clientMember.from('categories').insert({
        tenant_id: memberData.tenant_id,
        name: 'Member Attempt',
        tag: tagSlug,
      });

      expect(error).toBeTruthy();
      if (error) {
        expect(error.message.toLowerCase()).toContain('policy');
      }
    });

    it('categories: non-admin member cannot UPDATE a category', async () => {
      const clientMember = createClient(supabaseUrl, supabaseAnonKey);

      const memberEmail = process.env.TEST_MEMBER_EMAIL;
      const memberPassword = process.env.TEST_MEMBER_PASSWORD;

      if (!memberEmail || !memberPassword) {
        console.warn('Skipping admin-only test: TEST_MEMBER_EMAIL or TEST_MEMBER_PASSWORD not set');
        return;
      }

      const { error: loginErr } = await clientMember.auth.signInWithPassword({
        email: memberEmail,
        password: memberPassword,
      });
      if (loginErr) throw new Error(`Member login failed: ${loginErr.message}`);

      const { data: memberData } = await clientMember
        .from('tenant_members')
        .select('tenant_id, role')
        .single();
      if (!memberData) throw new Error('Member membership not found');
      if (memberData.role === 'admin') {
        throw new Error('TEST_MEMBER_EMAIL must be a non-admin member for this test');
      }

      const { data: categories } = await clientMember.from('categories').select('id').limit(1);
      if (!categories || categories.length === 0) {
        return;
      }
      const categoryId = categories[0].id;

      const { error } = await clientMember
        .from('categories')
        .update({ name: 'Member Update Attempt' })
        .eq('id', categoryId);

      expect(error).toBeTruthy();
      if (error) {
        expect(error.message.toLowerCase()).toContain('policy');
      }
    });
  });
});
