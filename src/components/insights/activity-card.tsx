"use client";

import type { ReactNode } from "react";
import { MoneyText } from "@/components/ui/money-text";
import type {
  DebtActivity,
  InvestmentActivity,
} from "@/lib/insights/types";

export function ActivityCard({
  investment,
  debt,
}: {
  investment: InvestmentActivity;
  debt: DebtActivity;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold">Investasi & Hutang</h2>
        <p className="mt-1 text-sm text-muted">
          Aktivitas netral dipisahkan dari pengeluaran konsumtif.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActivityPanel title="Aktivitas Investasi">
          <ActivityRow label="Top up investasi">
            <MoneyText value={investment.buyTotal} className="text-investment" />
          </ActivityRow>
          <ActivityRow label="Tarik investasi">
            <MoneyText value={investment.sellTotal} />
          </ActivityRow>
          <ActivityRow label="Net investasi">
            <MoneyText
              value={Math.abs(investment.netFlow)}
              sign={investment.netFlow < 0 ? "-" : ""}
              className={
                investment.netFlow >= 0 ? "text-investment" : "text-muted"
              }
            />
          </ActivityRow>
          <ActivityRow label="Biaya investasi">
            <MoneyText value={investment.feeTotal} className="text-expense" />
          </ActivityRow>
        </ActivityPanel>

        <ActivityPanel title="Aktivitas Hutang">
          <ActivityRow label="Pokok dibayar">
            <MoneyText value={debt.principalPaid} className="text-debt" />
          </ActivityRow>
          <ActivityRow label="Biaya/bunga">
            <MoneyText value={debt.feeTotal} className="text-expense" />
          </ActivityRow>
          <p className="mt-4 rounded-control bg-surface-muted p-3 text-xs leading-5 text-muted">
            Pokok hutang tidak dihitung sebagai pengeluaran. Biaya atau bunga
            tetap masuk pengeluaran.
          </p>
        </ActivityPanel>
      </div>
    </section>
  );
}

function ActivityPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-bold">{title}</h3>
      <dl className="mt-4 space-y-3">{children}</dl>
    </article>
  );
}

function ActivityRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-bold">{children}</dd>
    </div>
  );
}
