import { Suspense } from "react";
import LoginPageContent from "./login-page-content";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main>
      <h1>Login</h1>
      <p>Sign in with your email and password.</p>

      <form>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input id="email" name="email" type="email" disabled />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <br />
          <input id="password" name="password" type="password" disabled />
        </div>

        <button type="button" disabled>
          Loading...
        </button>
      </form>
    </main>
  );
}
