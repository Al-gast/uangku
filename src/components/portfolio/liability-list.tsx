"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { MoneyText } from "@/components/ui/money-text";
import { formatDateId } from "@/lib/format";
import type { PortfolioLiabilityItem } from "@/lib/portfolio/types";

function dueDateCopy(dueDate: string) {
  const dueTime = new Date(`${dueDate}T00:00:00+07:00`).getTime();
  const now = Date.now();
  const days = Math.ceil((dueTime - now) / (24 * 60 * 60 * 1000));

  if (days < 0) {
    return { text: "⚠️ Lewat jatuh tempo!", urgent: true };
  }

  return {
    text: `${days <= 7 ? "⚠️ " : ""}Jatuh tempo: ${formatDateId(
      `${dueDate}T00:00:00+07:00`,
    )}`,
    urgent: days <= 7,
  };
}

export function LiabilityList({
  liabilities,
  totalLiability,
}: {
  liabilities: PortfolioLiabilityItem[];
  totalLiability: number;
}) {
  const { privacyEnabled } = usePrivacy();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Hutang & Kewajiban</h2>
        <Link
          href="/portfolio/add-liability"
          className="text-sm font-bold text-accent-strong"
        >
          + Tambah
        </Link>
      </div>

      {liabilities.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-5 text-center text-sm leading-6 text-muted">
          Belum ada hutang dicatat. Semoga tetap begitu! 😊
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {liabilities.map((liability) => {
              const progress =
                liability.amount > 0
                  ? Math.min(
                      100,
                      (liability.remainingAmount / liability.amount) * 100,
                    )
                  : 0;
              const due = liability.dueDate
                ? dueDateCopy(liability.dueDate)
                : null;

              return (
                <Link
                  key={liability.id}
                  href={`/portfolio/liability/${liability.id}`}
                  className="block rounded-card border border-border bg-surface p-5 shadow-card transition hover:bg-surface-muted active:scale-[0.99]"
                >
                  <h3 className="text-sm font-bold">{liability.name}</h3>
                  <p className="mt-2 text-xs text-muted">
                    Sisa{" "}
                    <MoneyText value={liability.remainingAmount} /> dari{" "}
                    <MoneyText value={liability.amount} />
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-debt transition-[width] duration-300"
                      style={{
                        width: privacyEnabled ? "0%" : `${progress}%`,
                      }}
                    />
                  </div>
                  {due && (
                    <p
                      className={`mt-3 text-xs ${
                        due.urgent ? "font-bold text-expense" : "text-muted"
                      }`}
                    >
                      {due.text}
                    </p>
                  )}
                  {liability.notes && (
                    <p className="mt-2 truncate text-xs italic text-muted">
                      {liability.notes}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-sm text-muted">Total hutang</span>
            <MoneyText
              value={totalLiability}
              className="font-bold text-debt"
            />
          </div>
        </>
      )}
    </section>
  );
}
