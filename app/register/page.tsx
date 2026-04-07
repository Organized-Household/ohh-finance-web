"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

const initialState: { error?: string; success?: string } = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <main style={{ padding: 20 }}>
      <h1>Register</h1>
      <p>Create your household and admin account.</p>

      <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <div>
          <label htmlFor="alias">Household Alias</label>
          <br />
          <input id="alias" name="alias" type="text" required />
        </div>

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

        {state?.error ? <p style={{ color: "red" }}>{state.error}</p> : null}
        {state?.success ? <p style={{ color: "green" }}>{state.success}</p> : null}

        <button type="submit" disabled={pending}>
          {pending ? "Registering..." : "Register"}
        </button>
      </form>
    </main>
  );
}