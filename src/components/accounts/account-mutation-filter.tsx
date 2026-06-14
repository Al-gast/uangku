"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import type { AccountMutationFilters } from "@/lib/accounts/types";

export function AccountMutationFilter({
  accountId,
  filters,
  activeCount,
}: {
  accountId: string;
  filters: AccountMutationFilters;
  activeCount: number;
}) {
  const [range, setRange] = useState(filters.range);
  const [type, setType] = useState(filters.type);

  return (
    <details
      open={activeCount > 0}
      className="rounded-card border border-border bg-surface shadow-card"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="font-bold">Filter mutasi</span>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-strong">
          {activeCount > 0 ? `${activeCount} aktif` : "Bulan ini"}
        </span>
      </summary>

      <form
        action={`/accounts/${accountId}`}
        method="get"
        className="space-y-4 border-t border-border p-4"
      >
        <ThemedSelect
          label="Periode"
          name="range"
          value={range}
          onChange={(value) =>
            setRange(value as AccountMutationFilters["range"])
          }
          options={[
            { value: "this_month", label: "Bulan ini" },
            { value: "last_30_days", label: "30 hari terakhir" },
            { value: "all", label: "Semua waktu" },
          ]}
        />

        <ThemedSelect
          label="Jenis mutasi"
          name="type"
          value={type}
          onChange={(value) =>
            setType(value as AccountMutationFilters["type"])
          }
          options={[
            { value: "all", label: "Semua jenis" },
            { value: "income", label: "Pemasukan" },
            { value: "expense", label: "Pengeluaran" },
            { value: "transfer", label: "Transfer" },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/accounts/${accountId}`}
            className="flex min-h-11 items-center justify-center rounded-control border border-border px-4 text-sm font-bold text-muted"
          >
            Reset
          </Link>
          <button
            type="submit"
            className="min-h-11 rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
          >
            Terapkan
          </button>
        </div>
      </form>
    </details>
  );
}
