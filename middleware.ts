import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth/callback"
];

export async function middleware(request: NextRequest) {

  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublicPath) {

    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set(
      "redirectTo",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
