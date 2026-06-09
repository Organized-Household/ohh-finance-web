'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantMembership } from '@/lib/tenant/get-current-tenant-membership'

const transactionSchema = z.object({
  transaction_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  transaction_type: z.enum(['income', 'expense']).optional(),
  category_id: z.string().uuid('Invalid category ID'),
  linked_account_id: z.string().uuid('Invalid linked account ID').optional().nullable(),
  payment_source_account_id: z.string().uuid('Invalid payment source account ID').optional().nullable(),
})

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  const supabase = await createClient()
  const membership = await getCurrentTenantMembership()

  if (!membership) {
    throw new Error('No tenant membership found')
  }

  const { data: userData } = await supabase.auth.getUser()

  const validatedData = transactionSchema.parse(data)

  const { error } = await supabase
    .from('transactions')
    .insert({
      ...validatedData,
      tenant_id: membership.tenant_id,
      created_by_user_id: userData.user?.id,
    })

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`)
  }

  revalidatePath('/app/transactions')
  redirect('/app/transactions')
}

export async function updateTransaction(
  id: string,
  data: z.infer<typeof transactionSchema>
) {
  const supabase = await createClient()
  const membership = await getCurrentTenantMembership()

  if (!membership) {
    throw new Error('No tenant membership found')
  }

  const validatedData = transactionSchema.parse(data)

  const { error } = await supabase
    .from('transactions')
    .update(validatedData)
    .eq('id', id)
    .eq('tenant_id', membership.tenant_id)

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`)
  }

  revalidatePath('/app/transactions')
  redirect('/app/transactions')
}

export async function updateTransactionInline(
  id: string,
  data: z.infer<typeof transactionSchema>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return { ok: false, error: 'No tenant membership found' }
    }

    const validatedData = transactionSchema.parse(data)

    const { error } = await supabase
      .from('transactions')
      .update(validatedData)
      .eq('id', id)
      .eq('tenant_id', membership.tenant_id)

    if (error) {
      return { ok: false, error: `Failed to update transaction: ${error.message}` }
    }

    revalidatePath('/app/transactions')
    return { ok: true }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.issues.map(e => e.message).join(', ') }
    }
    if (err instanceof Error) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Unknown error occurred' }
  }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const membership = await getCurrentTenantMembership()

  if (!membership) {
    throw new Error('No tenant membership found')
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', membership.tenant_id)

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`)
  }

  revalidatePath('/app/transactions')
  redirect('/app/transactions')
}

export async function deleteTransactionInline(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const membership = await getCurrentTenantMembership()

    if (!membership) {
      return { ok: false, error: 'No tenant membership found' }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('tenant_id', membership.tenant_id)

    if (error) {
      return { ok: false, error: `Failed to delete transaction: ${error.message}` }
    }

    revalidatePath('/app/transactions')
    return { ok: true }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Unknown error occurred' }
  }
}
