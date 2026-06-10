// TARGETED MODIFICATION: Update null-session branch to return email_verification_required status
// All other logic preserved exactly as-is

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const registerSchema = z.object({
  householdAlias: z.string().min(1, 'Household alias is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function registerAction(formData: FormData) {
  const rawData = {
    householdAlias: formData.get('householdAlias'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validationResult = registerSchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    }
  }

  const { householdAlias, email, password } = validationResult.data

  const supabase = createClient()
  const signUpData = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpData.error) {
    return {
      error: signUpData.error.message,
    }
  }

  if (!signUpData.data.user) {
    return {
      error: 'User creation failed',
    }
  }

  // MODIFIED: Return email_verification_required status when session is null (email confirmation required)
  if (!signUpData.data.session) {
    return {
      status: 'email_verification_required',
      email: email,
    }
  }

  const userId = signUpData.data.user.id

  const adminClient = createAdminClient()
  const { data: tenantData, error: tenantError } = await adminClient.rpc(
    'bootstrap_tenant_membership',
    {
      p_alias: householdAlias,
      p_user_id: userId,
    }
  )

  if (tenantError) {
    return {
      error: tenantError.message || 'Failed to create household',
    }
  }

  return {
    success: true,
    tenantId: tenantData,
  }
}
