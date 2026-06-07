import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyToggle } from "@/components/settings/privacy-toggle";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Settings
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Privasi & Keamanan
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Mode Privasi
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Atur informasi finansial yang terlihat saat aplikasi dibuka.
        </p>
      </header>

      <PrivacyToggle />

      <section className="mt-4 rounded-card border border-border bg-surface-muted p-5 opacity-70">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">PIN Lock</h2>
            <p className="mt-1 text-sm text-muted">
              Perlindungan aplikasi dengan PIN.
            </p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted">
            Segera hadir
          </span>
        </div>
      </section>
    </>
  );
}
