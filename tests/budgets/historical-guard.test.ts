import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertBudget } from '@/app/app/budgets/actions';
import { getCurrentMonthStart } from '@/lib/db/month';

describe('Historical Budget Guard (OHHFIN-163)', () => {
  const admin = createAdminClient();
  let testTenantId: string;
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    const { data: tenant } = await admin
      .from('tenants')
      .insert({ alias: 'test-historical-guard' })
      .select('id')
      .single();
    testTenantId = tenant!.id;

    const { data: authUser } = await admin.auth.admin.createUser({
      email: 'historical-guard@test.local',
      password: 'test123',
      email_confirm: true,
    });
    testUserId = authUser.user!.id;

    await admin.from('tenant_members').insert({
      tenant_id: testTenantId,
      user_id: testUserId,
      role: 'admin',
    });

    const { data: category } = await admin
      .from('categories')
      .insert({
        tenant_id: testTenantId,
        name: 'Test Category',
        tag: 'standard',
      })
      .select('id')
      .single();
    testCategoryId = category!.id;
  });

  afterAll(async () => {
    await admin.from('budget_lines').delete().eq('tenant_id', testTenantId);
    await admin.from('budgets').delete().eq('tenant_id', testTenantId);
    await admin.from('categories').delete().eq('tenant_id', testTenantId);
    await admin.from('tenant_members').delete().eq('tenant_id', testTenantId);
    await admin.auth.admin.deleteUser(testUserId);
    await admin.from('tenants').delete().eq('id', testTenantId);
  });

  it('rejects past month upsert without confirmedHistoricalEdit', async () => {
    const currentMonth = getCurrentMonthStart();
    const pastMonth = new Date(currentMonth);
    pastMonth.setMonth(pastMonth.getMonth() - 1);
    const pastMonthStr = pastMonth.toISOString().substring(0, 10);

    const result = await upsertBudget({
      month_start: pastMonthStr,
      lines: [{ category_id: testCategoryId, amount: 100 }],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('past month');
    expect(result.error).toContain('confirmedHistoricalEdit');
  });

  it('allows past month upsert with confirmedHistoricalEdit: true', async () => {
    const currentMonth = getCurrentMonthStart();
    const pastMonth = new Date(currentMonth);
    pastMonth.setMonth(pastMonth.getMonth() - 1);
    const pastMonthStr = pastMonth.toISOString().substring(0, 10);

    const result = await upsertBudget({
      month_start: pastMonthStr,
      lines: [{ category_id: testCategoryId, amount: 100 }],
      confirmedHistoricalEdit: true,
    });

    expect(result.ok).toBe(true);
    expect(result.budgetId).toBeDefined();
  });

  it('allows current month upsert without confirmedHistoricalEdit', async () => {
    const currentMonth = getCurrentMonthStart();

    const result = await upsertBudget({
      month_start: currentMonth,
      lines: [{ category_id: testCategoryId, amount: 200 }],
    });

    expect(result.ok).toBe(true);
    expect(result.budgetId).toBeDefined();
  });

  it('allows future month upsert without confirmedHistoricalEdit', async () => {
    const currentMonth = getCurrentMonthStart();
    const futureMonth = new Date(currentMonth);
    futureMonth.setMonth(futureMonth.getMonth() + 1);
    const futureMonthStr = futureMonth.toISOString().substring(0, 10);

    const result = await upsertBudget({
      month_start: futureMonthStr,
      lines: [{ category_id: testCategoryId, amount: 300 }],
    });

    expect(result.ok).toBe(true);
    expect(result.budgetId).toBeDefined();
  });
});
