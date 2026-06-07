import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  isConfigured: boolean;
  error?: string;
  message?: string;
  children: ReactNode;
};

export function AuthPageShell({
  eyebrow,
  title,
  subtitle,
  isConfigured,
  error,
  message,
  children,
}: AuthPageShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 py-[max(2rem,env(safe-area-inset-top))]">
      <Brand />
      <div className="my-auto py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">{subtitle}</p>

        {!isConfigured && (
          <p className="mt-6 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
            Supabase belum dikonfigurasi. Isi variabel di{" "}
            <code>.env.local</code> sebelum mencoba autentikasi.
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

        {isConfigured && children}
      </div>
      <p className="text-center text-xs leading-5 text-muted">
        Data akun dilindungi oleh Supabase Auth dan kebijakan akses per user.
      </p>
    </main>
  );
}
