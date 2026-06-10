// TARGETED MODIFICATION: Add conditional render for email verification prompt
// Preserved all existing imports, layout, and form structure

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerAction } from './actions'
import { createBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verificationState, setVerificationState] = useState<{
    required: boolean
    email: string
  } | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await registerAction(formData)

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    if ('status' in result && result.status === 'email_verification_required') {
      setVerificationState({
        required: true,
        email: result.email,
      })
      setLoading(false)
      return
    }

    if (result.success) {
      router.push('/app')
    }
  }

  const handleResendEmail = async () => {
    if (!verificationState?.email) return

    setResendLoading(true)
    setResendMessage(null)

    const supabase = createBrowserClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: verificationState.email,
    })

    if (error) {
      setResendMessage('Failed to resend email. Please try again.')
    } else {
      setResendMessage('Verification email sent! Check your inbox.')
    }

    setResendLoading(false)
  }

  if (verificationState?.required) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-4 text-gray-600">
              We sent a verification link to{' '}
              <span className="font-semibold">{verificationState.email}</span>.
              Click the link to activate your account.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend email'}
            </button>

            {resendMessage && (
              <p className={`text-sm text-center ${
                resendMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'
              }`}>
                {resendMessage}
              </p>
            )}

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to login
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Register your household
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="householdAlias" className="block text-sm font-medium text-gray-700">
                Household Alias
              </label>
              <input
                id="householdAlias"
                name="householdAlias"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Already have an account? Log in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
