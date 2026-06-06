import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Onboarding",
};

const steps = ["Tambahkan akun", "Isi saldo awal", "Buat budget awal"];

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 py-[max(2rem,env(safe-area-inset-top))]">
      <Brand />
      <div className="my-auto py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Persiapan awal
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
          Kenalan dulu dengan kondisi keuanganmu.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Wizard belum diimplementasikan. Struktur berikut menunjukkan alur
          onboarding yang akan dibangun pada fase selanjutnya.
        </p>
        <ol className="mt-8 space-y-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-sm font-extrabold text-accent-strong">
                {index + 1}
              </span>
              <span className="font-bold">{step}</span>
            </li>
          ))}
        </ol>
        <Link
          href="/dashboard"
          className="mt-8 flex min-h-13 items-center justify-center gap-2 rounded-control bg-accent px-5 font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
        >
          Lewati untuk sekarang
          <Icon name="arrow" className="size-5" />
        </Link>
      </div>
    </main>
  );
}
