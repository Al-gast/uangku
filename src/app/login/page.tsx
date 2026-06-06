import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 py-[max(2rem,env(safe-area-inset-top))]">
      <Brand />
      <div className="my-auto py-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Selamat datang
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
          Keuangan lebih jelas, setiap hari.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Halaman login ini masih berupa placeholder. Autentikasi akan
          dihubungkan pada fase tersendiri.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 flex min-h-13 items-center justify-center gap-2 rounded-control bg-accent px-5 font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
        >
          Lihat foundation
          <Icon name="arrow" className="size-5" />
        </Link>
        <Link
          href="/onboarding"
          className="mt-3 flex min-h-13 items-center justify-center rounded-control border border-border bg-surface px-5 font-bold"
        >
          Lihat onboarding
        </Link>
      </div>
      <p className="text-center text-xs leading-5 text-muted">
        Belum ada data akun atau autentikasi yang diproses.
      </p>
    </main>
  );
}
