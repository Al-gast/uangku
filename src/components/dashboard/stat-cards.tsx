import { formatIdr } from "@/lib/format";

type StatCardsProps = {
  income: number;
  expense: number;
  monthLabel: string;
};

export function StatCards({ income, expense, monthLabel }: StatCardsProps) {
  const cashflow = income - expense;
  const rawSavingRate = income > 0 ? (cashflow / income) * 100 : null;
  const displaySavingRate =
    rawSavingRate === null ? null : Math.max(0, Math.round(rawSavingRate));
  const progress = Math.min(100, displaySavingRate ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <section className="rounded-card border border-border bg-surface p-4 shadow-card">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
          Saving Rate
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight">
          {displaySavingRate === null ? "--" : `${displaySavingRate}%`}
        </p>
        {displaySavingRate === null ? (
          <p className="mt-2 text-xs text-muted">Belum ada pemasukan</p>
        ) : (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </section>

      <section className="rounded-card border border-border bg-surface p-4 shadow-card">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
          Cashflow
        </p>
        <p
          className={`mt-2 break-words text-xl font-extrabold tracking-tight ${
            cashflow >= 0 ? "text-income" : "text-expense"
          }`}
        >
          {cashflow > 0 ? "+" : ""}
          {formatIdr(cashflow)}
        </p>
        <p className="mt-2 text-xs text-muted">{monthLabel}</p>
      </section>
    </div>
  );
}
