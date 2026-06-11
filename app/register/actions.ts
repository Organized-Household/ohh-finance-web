'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const registerSchema = z.object({
  householdAlias: z.string().min(2, 'Household alias must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function registerTenant(formData: FormData) {
  const parsed = registerSchema.safeParse({
    householdAlias: formData.get('householdAlias'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { householdAlias, email, password } = parsed.data

  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Auth error:', authError)
    return { error: 'Failed to create user account' }
  }

  const { data: rpcData, error: rpcError } = await adminClient.rpc(
    'create_tenant_and_membership',
    {
      p_alias: householdAlias,
      p_user_id: authData.user.id,
    }
  )

  if (rpcError) {
    console.error('RPC error:', rpcError)
    await adminClient.auth.admin.deleteUser(authData.user.id)
    if (rpcError.message?.includes('unique')) {
      return { error: 'Household alias already exists' }
    }
    return { error: 'Failed to create tenant' }
  }

  redirect('/login?registered=true')
}
