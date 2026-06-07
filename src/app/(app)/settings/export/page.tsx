import type { Metadata } from "next";
import Link from "next/link";
import { ExportForm } from "@/components/settings/export-form";

export const metadata: Metadata = {
  title: "Export Data",
};

export default function ExportPage() {
  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Settings
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Backup Pribadi
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Export Data
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Download data UangKu kamu untuk backup pribadi.
        </p>
      </header>

      <ExportForm />
    </>
  );
}
