"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = "loading" | "form" | "submitting" | "error";

export default function AcceptInvitePage() {
  const [step, setStep] = useState<Step>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Exchange hash tokens for a session client-side.
  // Supabase invite links deliver tokens in the URL hash fragment — the server
  // never sees them, so we must handle them here via onAuthStateChange.
  useEffect(() => {
    const handleInviteToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setStep("form");
        return;
      }

      // No session yet — check if the hash contains tokens
      const hash = window.location.hash;
      if (!hash.includes("access_token")) {
        setErrorMsg(
          "Invalid or expired invite link. Please ask to be re-invited."
        );
        setStep("error");
      }
      // Otherwise wait for onAuthStateChange below to fire
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        setStep("form");
      }
    });

    handleInviteToken();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep("submitting");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!firstName || !lastName) {
      setErrorMsg("First name and last name are required.");
      setStep("form");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setStep("form");
      return;
    }

    // Update password client-side (session is established at this point)
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setErrorMsg(pwError.message);
      setStep("form");
      return;
    }

    // Server-side: create profile + tenant_members + mark invitation accepted
    const res = await fetch("/api/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName }),
    });

    const result = (await res.json()) as { error?: string; success?: boolean };

    if (result.error) {
      setErrorMsg(result.error);
      setStep("form");
      return;
    }

    router.push("/app");
  };

  const inputCls =
    "w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-slate-400 focus:outline-none disabled:opacity-50";
  const labelCls = "block text-sm font-medium text-slate-300";

  if (step === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-900">
            OH
          </div>
          <p className="text-sm text-slate-400">
            Verifying your invite link…
          </p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
            <p className="mb-4 text-sm text-rose-400">{errorMsg}</p>
            <a
              href="/login"
              className="text-sm text-slate-300 underline hover:text-white"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-900">
            OH
          </div>
          <h1 className="text-xl font-semibold text-white">
            Welcome to OHh Finance
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete your account setup to join the household.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-700 bg-slate-800 p-6"
        >
          {errorMsg && (
            <div className="rounded-md border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="first_name" className={labelCls}>
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              disabled={step === "submitting"}
              className={inputCls}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="last_name" className={labelCls}>
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              disabled={step === "submitting"}
              className={inputCls}
              autoComplete="family-name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className={labelCls}>
              Set Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              disabled={step === "submitting"}
              placeholder="Minimum 8 characters"
              className={inputCls}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={step === "submitting"}
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
          >
            {step === "submitting"
              ? "Setting up your account…"
              : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
