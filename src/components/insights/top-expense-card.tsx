"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import { buildCashflowDrilldownHref } from "@/lib/insights/links";
import type { TopExpenseCategory } from "@/lib/insights/types";

export function TopExpenseCard({
  categories,
  monthKey,
}: {
  categories: TopExpenseCategory[];
  monthKey: string;
}) {
  const { privacyEnabled } = usePrivacy();

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold">Pengeluaran Terbesar</h2>
        <p className="mt-1 text-sm text-muted">
          Kategori yang paling banyak menyerap pengeluaran bulan ini.
        </p>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        {categories.length === 0 ? (
          <div className="p-5 text-sm text-muted">
            Belum ada pengeluaran tercatat bulan ini.
          </div>
        ) : (
          categories.map((category, index) => {
            const barWidth = Math.min(100, Math.max(0, category.sharePercent));

            return (
              <Link
                key={category.categoryId}
                href={buildCashflowDrilldownHref({
                  monthKey,
                  categoryId: category.categoryId,
                })}
                className={`p-4 ${
                  index > 0 ? "border-t border-border" : ""
                } block transition hover:bg-surface-muted active:scale-[0.995]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold">
                      {category.categoryName}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      <MoneyText value={category.spent} />
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-accent-strong">
                    <PrivateText
                      value={`${Math.round(category.sharePercent)}%`}
                    />
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: privacyEnabled ? "0%" : `${barWidth}%`,
                    }}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
