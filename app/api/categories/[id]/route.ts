import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  tag: z.string().min(1, 'Tag is required').optional(),
  is_active: z.boolean().optional(),
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

    if (membership.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', params.id)
      .eq('tenant_id', membership.tenant_id)
      .select()
      .single()

    if (error) {
      console.error('Category update error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
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

    if (membership.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('tenant_id', membership.tenant_id)

    if (error) {
      console.error('Category delete error:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
