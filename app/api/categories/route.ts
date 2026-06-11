import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tag: z.string().min(1, 'Tag is required'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', membership.tenant_id)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
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

    if (membership.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, tag } = parsed.data

    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: membership.tenant_id,
        name,
        tag,
      })
      .select()
      .single()

    if (error) {
      console.error('Category create error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
