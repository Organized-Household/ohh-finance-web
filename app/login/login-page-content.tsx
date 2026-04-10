"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormEvent } from "react";
import AuthCard from "@/components/public/auth-card";
import FormAlert from "@/components/public/form-alert";
import InlineErrorMessage from "@/components/public/inline-error-message";
import PublicBrandHeader from "@/components/public/public-brand-header";
import { loginAction } from "./actions";

const initialState = {
  error: "",
};

type LoginPageContentProps = {
  redirectTo: string;
  showProtectedRouteMessage: boolean;
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function mapLoginError(error: string): string {
  const normalized = error.toLowerCase();

  if (normalized.includes("invalid email or password")) {
    return "Email or password is incorrect.";
  }

  return "We couldn’t sign you in. Please try again.";
}

export default function LoginPageContent({
  redirectTo,
  showProtectedRouteMessage,
}: LoginPageContentProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [offlineError, setOfflineError] = useState("");

  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  const protectedRouteMessage = showProtectedRouteMessage
    ? "Please sign in to continue."
    : "";
  const formErrorMessage = offlineError || (state?.error ? mapLoginError(state.error) : "");

  function validateFields(): LoginFieldErrors {
    const nextErrors: LoginFieldErrors = {};

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
    setOfflineError("");
    const nextErrors = validateFields();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      event.preventDefault();
      setOfflineError("You appear to be offline. Check your connection and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <PublicBrandHeader current="login" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 pb-10 pt-10 sm:pt-14">
        <AuthCard
          title="Login"
          description="Sign in with your email and password."
          footer={
            <p className="text-sm text-slate-600">
              Need an account?{" "}
              <Link
                href="/register"
                className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Register
              </Link>
            </p>
          }
        >
          <div className="space-y-3">
            {protectedRouteMessage ? <FormAlert message={protectedRouteMessage} tone="info" /> : null}
            {formErrorMessage ? <FormAlert message={formErrorMessage} /> : null}

            <form action={formAction} onSubmit={handleSubmit} className="space-y-3">
              <input type="hidden" name="redirectTo" value={redirectTo} />

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
                {pending ? "Signing in..." : "Login"}
              </button>
            </form>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-sm text-slate-600 underline underline-offset-2 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Back to Welcome
            </Link>
          </div>
        </AuthCard>
      </main>
    </div>
  );
}
