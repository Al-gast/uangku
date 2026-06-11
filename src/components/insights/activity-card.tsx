"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import { buildCashflowDrilldownHref } from "@/lib/insights/links";
import type {
  DebtActivity,
  InvestmentActivity,
} from "@/lib/insights/types";

export function ActivityCard({
  investment,
  debt,
  isCurrentMonth,
  monthKey,
}: {
  investment: InvestmentActivity;
  debt: DebtActivity;
  isCurrentMonth: boolean;
  monthKey: string;
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
        <ActivityPanel
          title="Aktivitas Investasi"
          actionHref="/portfolio"
          actionLabel="Lihat portfolio"
        >
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

        <ActivityPanel
          title="Beban Cicilan & Hutang"
          actionHref={buildCashflowDrilldownHref({
            monthKey,
            type: "debt_payment",
          })}
          actionLabel="Lihat pembayaran"
        >
          <DebtStatusBadge status={debt.status} />
          <ActivityRow label="Pokok dibayar">
            <MoneyText value={debt.principalPaid} className="text-debt" />
          </ActivityRow>
          <ActivityRow label="Biaya/bunga">
            <MoneyText value={debt.feeTotal} className="text-expense" />
          </ActivityRow>
          <ActivityRow label="Total keluar">
            <MoneyText value={debt.totalPaid} className="text-debt" />
          </ActivityRow>
          <ActivityRow label="Rasio ke pemasukan">
            <PrivateText
              value={
                debt.paymentToIncomeRatio === null
                  ? "--"
                  : `${Math.round(debt.paymentToIncomeRatio)}%`
              }
              masked="••%"
            />
          </ActivityRow>
          <ActivityRow
            label={isCurrentMonth ? "Sisa hutang aktif" : "Sisa hutang saat ini"}
          >
            <MoneyText value={debt.remainingAmount} />
          </ActivityRow>
          <ActivityRow
            label={
              isCurrentMonth
                ? "Jumlah hutang aktif"
                : "Hutang aktif saat ini"
            }
          >
            <PrivateText
              value={`${debt.activeLiabilityCount}`}
              masked="•"
            />
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

function DebtStatusBadge({ status }: { status: DebtActivity["status"] }) {
  const meta: Record<
    DebtActivity["status"],
    { label: string; className: string }
  > = {
    none: {
      label: "Tidak ada beban aktif",
      className: "bg-surface-muted text-muted",
    },
    safe: {
      label: "Terkendali",
      className: "bg-income/10 text-income",
    },
    watch: {
      label: "Pantau",
      className: "bg-expense/10 text-expense",
    },
    heavy: {
      label: "Berat",
      className: "bg-expense text-white",
    },
  };
  const item = meta[status];

  return (
    <span
      className={`mb-4 inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function ActivityPanel({
  title,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  children: ReactNode;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-bold">{title}</h3>
      <dl className="mt-4 space-y-3">{children}</dl>
      <Link
        href={actionHref}
        className="mt-5 inline-flex min-h-10 items-center text-sm font-bold text-accent-strong"
      >
        {actionLabel} →
      </Link>
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
