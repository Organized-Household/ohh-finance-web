import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'
import { z } from 'zod'

const updateTransactionSchema = z.object({
  transaction_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  amount: z.number().optional(),
  transaction_type: z.enum(['income', 'expense']).optional(),
  category_id: z.string().uuid().optional(),
  account_id: z.string().uuid().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('tenant_id', membership.tenant_id)
      .select()
      .single()

    if (error) {
      console.error('Transaction update error:', error)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', membership.tenant_id)

    if (error) {
      console.error('Transaction delete error:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
