"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import type {
  CashflowFilterAccountOption,
  CashflowFilterCategoryOption,
  CashflowFilters,
} from "@/lib/cashflow/types";

export function CashflowFilterPanel({
  filters,
  accounts,
  categories,
  activeCount,
}: {
  filters: CashflowFilters;
  accounts: CashflowFilterAccountOption[];
  categories: CashflowFilterCategoryOption[];
  activeCount: number;
}) {
  const [type, setType] = useState(filters.type ?? "");
  const [source, setSource] = useState(filters.source ?? "");
  const [accountId, setAccountId] = useState(filters.accountId ?? "");
  const [categoryId, setCategoryId] = useState(filters.categoryId ?? "");
  const [range, setRange] = useState(filters.range);

  return (
    <details
      open={activeCount > 0}
      className="rounded-card border border-border bg-surface shadow-card"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="font-bold">Filter transaksi</span>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-strong">
          {activeCount > 0 ? `${activeCount} aktif` : "Semua"}
        </span>
      </summary>

      <form
        action="/cashflow"
        method="get"
        className="space-y-4 border-t border-border p-4"
      >
        {filters.monthKey && (
          <>
            <input type="hidden" name="month" value={filters.monthKey} />
            <div className="flex items-center justify-between gap-3 rounded-control bg-accent-soft p-3 text-sm">
              <span className="text-muted">Periode rekap</span>
              <span className="font-bold text-accent-strong">
                {filters.monthLabel}
              </span>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ThemedSelect
            label="Jenis transaksi"
            name="type"
            value={type}
            onChange={setType}
            options={[
              { value: "", label: "Semua" },
              { value: "income", label: "Pemasukan" },
              { value: "expense", label: "Pengeluaran" },
              { value: "transfer", label: "Transfer" },
              { value: "investment_buy", label: "Top up investasi" },
              { value: "investment_sell", label: "Tarik investasi" },
              { value: "debt_payment", label: "Bayar hutang" },
            ]}
          />

          <ThemedSelect
            label="Sumber"
            name="source"
            value={source}
            onChange={setSource}
            options={[
              { value: "", label: "Semua sumber" },
              { value: "manual", label: "Manual" },
              { value: "chat", label: "Via Chat" },
            ]}
          />

          <ThemedSelect
            label="Akun"
            name="account"
            value={accountId}
            onChange={setAccountId}
            options={[
              { value: "", label: "Semua akun" },
              ...accounts.map((account) => ({
                value: account.id,
                label: account.name,
                description: account.isActive ? undefined : "Akun nonaktif",
              })),
            ]}
          />

          <ThemedSelect
            label="Kategori"
            name="category"
            value={categoryId}
            onChange={setCategoryId}
            options={[
              { value: "", label: "Semua kategori" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
                description: category.isActive
                  ? undefined
                  : "Kategori nonaktif",
              })),
            ]}
          />
        </div>

        <ThemedSelect
          label="Rentang tanggal"
          name="range"
          value={range}
          onChange={(value) => setRange(value as CashflowFilters["range"])}
          helperText={
            filters.monthKey
              ? "Rentang mengikuti periode rekap yang dipilih."
              : undefined
          }
          options={[
            { value: "all", label: "Semua waktu" },
            { value: "this_month", label: "Bulan ini" },
            { value: "last_7_days", label: "7 hari terakhir" },
            { value: "last_30_days", label: "30 hari terakhir" },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/cashflow"
            className="flex min-h-11 items-center justify-center rounded-control border border-border px-4 text-sm font-bold text-muted"
          >
            Reset filter
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
