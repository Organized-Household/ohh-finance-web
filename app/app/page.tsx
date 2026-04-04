import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app");
  }

  return (
    <main>
      <h1>Authenticated App</h1>
      <p>You are signed in.</p>
      <p>Email: {user.email}</p>
    </main>
  );
}