import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { firstName?: string; lastName?: string };
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Session must already be established client-side before this is called
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Session not found. Please use the invite link from your email." },
      { status: 401 }
    );
  }

  // Find pending invitation for this user's email using admin client (bypasses RLS)
  const { data: invitation } = await supabaseAdmin
    .from("invitations")
    .select("id, tenant_id, role")
    .eq("email", user.email!)
    .eq("status", "pending")
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json(
      { error: "No pending invitation found. It may have been revoked." },
      { status: 404 }
    );
  }

  // Idempotency guard — skip insert if already a member
  const { data: existingMember } = await supabaseAdmin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", invitation.tenant_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberError } = await supabaseAdmin
      .from("tenant_members")
      .insert({
        tenant_id: invitation.tenant_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
  }

  // Create / update profile
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Mark invitation accepted
  await supabaseAdmin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true });
}
