"use client";

import type { ReactNode } from "react";
import { MoneyText, PrivateText } from "@/components/ui/money-text";

export function MonthlySummaryCard({
  monthLabel,
  income,
  expense,
  netCashflow,
  savingRate,
}: {
  monthLabel: string;
  income: number;
  expense: number;
  netCashflow: number;
  savingRate: number | null;
}) {
  const savingRateLabel =
    savingRate === null ? "--" : `${Math.round(savingRate)}%`;
  const netCashflowClass =
    netCashflow >= 0 ? "text-income" : "text-expense";

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Ringkasan
        </p>
        <h2 className="mt-2 text-xl font-bold">Rekap {monthLabel}</h2>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <SummaryItem
          label="Pemasukan"
          value={<MoneyText value={income} className="text-income" />}
        />
        <SummaryItem
          label="Pengeluaran"
          value={<MoneyText value={expense} className="text-expense" />}
        />
        <SummaryItem
          label="Net cashflow"
          value={
            <MoneyText
              value={Math.abs(netCashflow)}
              sign={netCashflow < 0 ? "-" : ""}
              className={netCashflowClass}
            />
          }
        />
        <SummaryItem
          label="Saving rate"
          value={<PrivateText value={savingRateLabel} masked="••%" />}
        />
      </dl>
    </section>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-control bg-surface-muted p-4">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-2 text-lg font-bold">{value}</dd>
    </div>
  );
}
