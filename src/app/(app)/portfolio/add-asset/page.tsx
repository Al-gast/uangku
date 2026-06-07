import type { Metadata } from "next";
import Link from "next/link";
import { portfolioAssetTypeMeta } from "@/constants/portfolio";
import { portfolioAssetTypes } from "@/lib/portfolio/types";

export const metadata: Metadata = {
  title: "Tambah Aset",
};

export default function AddAssetPage() {
  return (
    <>
      <Link
        href="/portfolio"
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Kembali
      </Link>
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-[-0.04em]">
          Tambah aset baru
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Pilih jenis aset yang ingin kamu catat.
        </p>
      </header>

      <div className="space-y-2">
        {portfolioAssetTypes.map((type) => {
          const meta = portfolioAssetTypeMeta[type];
          return (
            <Link
              key={type}
              href={`/portfolio/add-asset-form?type=${type}`}
              className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition hover:bg-surface-muted active:scale-[0.98]"
            >
              <span className="text-lg">{meta.icon}</span>
              <span className="flex-1 text-sm font-bold">{meta.label}</span>
              <span className="text-muted">›</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
