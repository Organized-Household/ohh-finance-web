import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'
import { z } from 'zod'

const createTransactionSchema = z.object({
  transaction_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number(),
  transaction_type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  account_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')

    let query = supabase
      .from('transactions')
      .select('*, categories(name), accounts(name)')
      .eq('tenant_id', membership.tenant_id)
      .order('transaction_date', { ascending: false })

    if (month) {
      const monthStart = new Date(month)
      const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
      query = query
        .gte('transaction_date', monthStart.toISOString().split('T')[0])
        .lt('transaction_date', nextMonth.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Transactions fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { transaction_date, description, amount, transaction_type, category_id, account_id } = parsed.data

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        tenant_id: membership.tenant_id,
        transaction_date,
        description,
        amount,
        transaction_type,
        category_id,
        account_id,
        created_by_user_id: userData.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Transaction create error:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
