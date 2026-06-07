"use client";

import { DonutChart } from "@/components/portfolio/donut-chart";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import type { AllocationSlice } from "@/lib/portfolio/types";

export function AssetAllocation({
  allocation,
  totalAsset,
}: {
  allocation: AllocationSlice[];
  totalAsset: number;
}) {
  const { privacyEnabled } = usePrivacy();

  if (totalAsset === 0) {
    return (
      <section className="rounded-card border border-dashed border-border bg-surface p-5 text-center">
        <h2 className="text-lg font-bold">Alokasi Aset</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Alokasi akan muncul setelah kamu memiliki saldo atau aset.
        </p>
      </section>
    );
  }

  if (allocation.length < 2) {
    return null;
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-lg font-bold">Alokasi Aset</h2>
      <div className={`mt-4 ${privacyEnabled ? "opacity-20 blur-sm" : ""}`}>
        <DonutChart slices={allocation} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        {allocation.map((slice) => (
          <div
            key={slice.key}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-sm font-semibold">
                {slice.label}
              </span>
            </div>
            <div className="shrink-0 text-right text-sm">
              <span className="font-bold">
                <PrivateText value={`${slice.percentage.toFixed(0)}%`} />
              </span>
              <MoneyText
                value={slice.value}
                className="ml-2 text-muted"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
