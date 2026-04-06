"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";

const initialState = {
  error: "",
};

export default function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/app";

  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in with your email and password.</p>

      <form action={formAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input id="email" name="email" type="email" required />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <br />
          <input id="password" name="password" type="password" required />
        </div>

        {state?.error ? (
          <p style={{ color: "red" }}>{state.error}</p>
        ) : null}

        <button type="submit" disabled={pending}>
          {pending ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
