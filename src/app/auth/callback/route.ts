import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next");
  const safeNext =
    nextPath?.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set(
    "error",
    "Konfirmasi akun gagal atau tautan sudah kedaluwarsa.",
  );
  return NextResponse.redirect(loginUrl);
}
