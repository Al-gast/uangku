"use client";

import { useState } from "react";
import type { ExportFormat, ExportScope } from "@/lib/export/types";

const formats: Array<{
  id: ExportFormat;
  label: string;
  description: string;
}> = [
  {
    id: "csv",
    label: "CSV",
    description: "Ringan dan bisa dibuka di hampir semua aplikasi spreadsheet.",
  },
  {
    id: "excel",
    label: "Excel",
    description: "Workbook .xls dengan sheet terpisah untuk setiap jenis data.",
  },
];

function getDownloadUrl(format: ExportFormat, scope: ExportScope) {
  return `/settings/export/download?format=${format}&scope=${scope}`;
}

export function ExportForm() {
  const [format, setFormat] = useState<ExportFormat>("excel");

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-bold">Pilih format</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {formats.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFormat(item.id)}
              aria-pressed={format === item.id}
              className={`rounded-control border p-4 text-left transition active:scale-[0.98] ${
                format === item.id
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-background"
              }`}
            >
              <span className="block font-bold">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <ExportOption
          title="Export Transaksi"
          description="Download seluruh riwayat transaksi, termasuk tipe, sumber, kategori, dan akun."
          href={getDownloadUrl(format, "transactions")}
        />
        <ExportOption
          title="Export Semua Data"
          description="Download transaksi, akun, budget, aset, dan liabilitas milik kamu."
          href={getDownloadUrl(format, "all")}
          primary
        />
      </section>

      <p className="rounded-control border border-border bg-surface-muted p-4 text-xs leading-5 text-muted">
        File dibuat khusus dari data akun kamu. UangKu tidak menyertakan
        password, token login, atau informasi autentikasi.
      </p>
    </div>
  );
}

function ExportOption({
  title,
  description,
  href,
  primary = false,
}: {
  title: string;
  description: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      <a
        href={href}
        download
        className={`mt-4 flex min-h-12 w-full items-center justify-center rounded-control px-4 text-sm font-bold transition active:scale-[0.98] ${
          primary
            ? "bg-accent text-accent-foreground"
            : "border border-accent text-accent-strong"
        }`}
      >
        Download {title.replace("Export ", "")}
      </a>
    </article>
  );
}
