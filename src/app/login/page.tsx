import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/ui/brand";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;
  const isConfigured = hasSupabaseEnv();

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 py-[max(2rem,env(safe-area-inset-top))]">
      <Brand />
      <div className="my-auto py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Selamat datang
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
          Keuangan lebih jelas, setiap hari.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Masuk atau buat akun UangKu dengan email dan password.
        </p>

        {!isConfigured && (
          <p className="mt-6 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
            Supabase belum dikonfigurasi. Isi variabel di{" "}
            <code>.env.local</code> sebelum mencoba login.
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
            {message}
          </p>
        )}

        {isConfigured && <AuthForm />}
      </div>
      <p className="text-center text-xs leading-5 text-muted">
        Data akun dilindungi oleh Supabase Auth dan kebijakan akses per user.
      </p>
    </main>
  );
}
