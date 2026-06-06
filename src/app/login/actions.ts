"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

function redirectToLogin(type: "error" | "message", message: string): never {
  redirect(`/login?${type}=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const { email, password } = getCredentials(formData);

  if (!email || password.length < 6) {
    redirectToLogin(
      "error",
      "Isi email dan password minimal 6 karakter.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectToLogin("error", "Email atau password belum sesuai.");
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const { email, password } = getCredentials(formData);

  if (!email || password.length < 6) {
    redirectToLogin(
      "error",
      "Isi email dan password minimal 6 karakter.",
    );
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: origin
      ? {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        }
      : undefined,
  });

  if (error) {
    redirectToLogin("error", error.message);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirectToLogin(
    "message",
    "Akun dibuat. Cek email untuk mengonfirmasi akun kamu.",
  );
}
