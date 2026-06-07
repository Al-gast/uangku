import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Buat Akun",
};

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { error, message } = await searchParams;
  const isConfigured = hasSupabaseEnv();

  return (
    <AuthPageShell
      eyebrow="Mulai sekarang"
      title="Buat akun UangKu."
      subtitle="Mulai catat uang, saldo, dan budget kamu dengan lebih rapi."
      isConfigured={isConfigured}
      error={error}
      message={message}
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
