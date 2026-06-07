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

function safeNextPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

function redirectWithMessage(
  pathname: "/login" | "/register",
  type: "error" | "message",
  message: string,
  next?: string,
): never {
  const params = new URLSearchParams({ [type]: message });

  if (next && next !== "/dashboard") {
    params.set("next", next);
  }

  redirect(`${pathname}?${params.toString()}`);
}

export async function login(formData: FormData) {
  const { email, password } = getCredentials(formData);
  const next = safeNextPath(formData.get("next"));

  if (!email || password.length < 6) {
    redirectWithMessage(
      "/login",
      "error",
      "Isi email dan password minimal 6 karakter.",
      next,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithMessage(
      "/login",
      "error",
      "Email atau password belum sesuai.",
      next,
    );
  }

  redirect(next);
}

export async function signup(formData: FormData) {
  const { email, password } = getCredentials(formData);
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email || password.length < 6) {
    redirectWithMessage(
      "/register",
      "error",
      "Isi email dan password minimal 6 karakter.",
    );
  }

  if (!confirmPassword) {
    redirectWithMessage(
      "/register",
      "error",
      "Konfirmasi password wajib diisi.",
    );
  }

  if (password !== confirmPassword) {
    redirectWithMessage(
      "/register",
      "error",
      "Password dan konfirmasi password belum sama.",
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
    redirectWithMessage("/register", "error", error.message);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirectWithMessage(
    "/login",
    "message",
    "Akun dibuat. Cek email untuk mengonfirmasi akun kamu.",
  );
}
