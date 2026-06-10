"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useState } from "react";
import type { FormEvent } from "react";
import AuthCard from "@/components/public/auth-card";
import FormAlert from "@/components/public/form-alert";
import InlineErrorMessage from "@/components/public/inline-error-message";
import PublicBrandHeader from "@/components/public/public-brand-header";
import { createClient } from "@/lib/supabase/client";
import { registerAction } from "./actions";

const initialState: { error?: string; success?: string; status?: "email_verification_required"; email?: string } = {};

type RegisterFieldErrors = {
  alias?: string;
  email?: string;
  password?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapRegisterError(error: string): string {
  const normalized = error.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "An account with this email already exists.";
  }

  if (normalized.includes("signup") && normalized.includes("disable")) {
    return "Registration is currently unavailable.";
  }

  return "We couldn't create your account. Please try again.";
}

export default function RegisterPage() {
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  // OHHFIN-187: Resend email state for the verification prompt
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  function validateFields(): RegisterFieldErrors {
    const nextErrors: RegisterFieldErrors = {};

    if (!alias.trim()) {
      nextErrors.alias = "Household Alias is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validateFields();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  // OHHFIN-187: Handle resend verification email
  async function handleResendEmail() {
    if (!state?.email) return;

    setResendLoading(true);
    setResendMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: state.email,
    });

    if (error) {
      setResendMessage("Failed to resend email. Please try again.");
    } else {
      setResendMessage("Verification email sent! Check your inbox.");
    }

    setResendLoading(false);
  }

  // OHHFIN-187: Show verification prompt when email confirmation is required
  if (state?.status === "email_verification_required") {
    return (
      <div className="min-h-screen bg-slate-100">
        <PublicBrandHeader current="register" />
        <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 pb-10 pt-10 sm:pt-14">
          <AuthCard
            title="Check your email"
            description={`We sent a verification link to ${state.email}. Click the link to activate your account.`}
          >
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                {resendLoading ? "Sending..." : "Resend email"}
              </button>

              {resendMessage && (
                <p className={`text-sm text-center ${
                  resendMessage.includes("Failed") ? "text-red-600" : "text-green-600"
                }`}>
                  {resendMessage}
                </p>
              )}

              <p className="text-sm text-center text-slate-600">
                <Link
                  href="/login"
                  className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-900"
                >
                  Back to login
                </Link>
              </p>
            </div>
          </AuthCard>
        </main>
      </div>
    );
  }

  const formErrorMessage = state?.error ? mapRegisterError(state.error) : "";

  return (
    <div className="min-h-screen bg-slate-100">
      <PublicBrandHeader current="register" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 pb-10 pt-10 sm:pt-14">
        <AuthCard
          title="Register"
          description="Create your household and admin account."
          footer={
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Login
              </Link>
            </p>
          }
        >
          <div className="space-y-3">
            {formErrorMessage ? <FormAlert message={formErrorMessage} /> : null}
            {state?.success ? <FormAlert tone="success" message={state.success} /> : null}

            <form action={formAction} onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="alias" className="mb-1 block text-sm font-medium text-slate-700">
                  Household Alias
                </label>
                <input
                  id="alias"
                  name="alias"
                  type="text"
                  required
                  value={alias}
                  onChange={(event) => {
                    setAlias(event.target.value);
                    if (fieldErrors.alias) {
                      setFieldErrors((prev) => ({ ...prev, alias: undefined }));
                    }
                  }}
                  aria-describedby={fieldErrors.alias ? "alias-error" : undefined}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                />
                <InlineErrorMessage id="alias-error" message={fieldErrors.alias} />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                />
                <InlineErrorMessage id="email-error" message={fieldErrors.email} />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                />
                <InlineErrorMessage id="password-error" message={fieldErrors.password} />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                {pending ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </AuthCard>
      </main>
    </div>
  );
}
