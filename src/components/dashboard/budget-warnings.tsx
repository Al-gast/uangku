"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { formatPrivateAmount } from "@/lib/format";
import type { BudgetWarning } from "@/lib/budgets/types";

export function BudgetWarnings({
  warnings,
}: {
  warnings: BudgetWarning[];
}) {
  const { privacyEnabled } = usePrivacy();

  if (warnings.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Peringatan Budget</h2>
        <Link
          href="/settings/budgets"
          className="text-sm font-bold text-accent-strong"
        >
          Lihat budget
        </Link>
      </div>
      <div className="space-y-2">
        {warnings.map((warning) => {
          const exceeded = warning.remaining < 0;

          return (
            <article
              key={warning.id}
              className="rounded-card border border-expense/25 bg-expense/10 p-4"
            >
              <p className="text-sm font-semibold leading-6 text-foreground">
                {exceeded
                  ? `Budget ${warning.categoryName.toLowerCase()} kamu sudah melewati batas sebesar ${formatPrivateAmount(
                      Math.abs(warning.remaining),
                      privacyEnabled,
                    )}.`
                  : `Budget ${warning.categoryName.toLowerCase()} kamu tinggal ${formatPrivateAmount(
                      warning.remaining,
                      privacyEnabled,
                    )} bulan ini.`}
              </p>
              <p className="mt-1 text-xs font-bold text-expense">
                {privacyEnabled
                  ? "••% terpakai"
                  : `${Math.round(warning.progressPercent)}% terpakai`}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
