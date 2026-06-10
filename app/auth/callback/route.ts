// TARGETED MODIFICATION: Add 'email' to accepted types for email verification flow
// All other logic preserved exactly as-is

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/app'

  if (token_hash && type) {
    const supabase = createClient()

    // MODIFIED: Add 'email' to accepted types for signup confirmation
    if (type === 'invite' || type === 'email') {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type === 'invite' ? 'invite' : 'email',
      })

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      return NextResponse.redirect(`${origin}/login?error=invite_expired`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
