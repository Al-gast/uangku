import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, next } = await searchParams;
  const isConfigured = hasSupabaseEnv();
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthPageShell
      eyebrow="Selamat datang"
      title="Keuangan lebih jelas, setiap hari."
      subtitle="Masuk ke akun UangKu kamu."
      isConfigured={isConfigured}
      error={error}
      message={message}
    >
      <LoginForm next={safeNext} />
    </AuthPageShell>
  );
}
