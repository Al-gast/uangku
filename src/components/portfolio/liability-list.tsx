"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { MoneyText } from "@/components/ui/money-text";
import { formatDateId } from "@/lib/format";
import { getLiabilityReminderStatus } from "@/lib/portfolio/calculations";
import type { PortfolioLiabilityItem } from "@/lib/portfolio/types";

function dueDateCopy(
  dueDate: string,
  reminderStatus: ReturnType<typeof getLiabilityReminderStatus>,
) {
  if (reminderStatus.state === "overdue") {
    return { text: "⚠️ Lewat jatuh tempo!", urgent: true };
  }

  return {
    text: `${reminderStatus.state === "due_soon" ? "⚠️ " : ""}Jatuh tempo: ${formatDateId(
      `${dueDate}T00:00:00+07:00`,
    )}`,
    urgent: reminderStatus.state === "due_soon",
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
  const reminderStatuses = liabilities.map((liability) => ({
    liability,
    status: getLiabilityReminderStatus(liability),
  }));
  const activeAlerts = reminderStatuses.filter(
    ({ status }) =>
      status.state === "due_soon" || status.state === "overdue",
  );

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
          {activeAlerts.length > 0 && (
            <div className="mb-3 rounded-card border border-expense/25 bg-expense/10 p-4">
              <p className="text-sm font-bold text-expense">
                Ada hutang yang jatuh tempo sebentar lagi.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {activeAlerts.length} pengingat aktif perlu diperiksa.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {reminderStatuses.map(({ liability, status }) => {
              const progress =
                liability.amount > 0
                  ? Math.min(
                      100,
                      (liability.remainingAmount / liability.amount) * 100,
                    )
                  : 0;
              const due = liability.dueDate
                ? dueDateCopy(liability.dueDate, status)
                : null;

              return (
                <Link
                  key={liability.id}
                  href={`/portfolio/liability/${liability.id}`}
                  className="block rounded-card border border-border bg-surface p-5 shadow-card transition hover:bg-surface-muted active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold">{liability.name}</h3>
                    {status.state !== "inactive" && (
                      <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-bold text-accent-strong">
                        Pengingat aktif
                      </span>
                    )}
                  </div>
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
