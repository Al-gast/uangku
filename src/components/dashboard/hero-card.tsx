import Link from "next/link";
import { formatIdr } from "@/lib/format";

type HeroCardProps = {
  monthLabel: string;
  income: number;
  expense: number;
};

export function HeroCard({ monthLabel, income, expense }: HeroCardProps) {
  const remaining = income - expense;

  return (
    <section className="rounded-card bg-accent p-5 text-accent-foreground shadow-lg">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] opacity-80">
        Sisa bulan ini · {monthLabel}
      </p>
      <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">
        {formatIdr(remaining)}
      </p>
      {remaining < 0 && (
        <p className="mt-2 text-xs font-medium opacity-85">
          Pengeluaran melebihi pemasukan bulan ini
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-80">↑ Pemasukan</p>
          <p className="mt-1 text-base font-bold">{formatIdr(income)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-80">↓ Pengeluaran</p>
          <p className="mt-1 text-base font-bold">{formatIdr(expense)}</p>
        </div>
      </div>
    </section>
  );
}

export function EmptyHero() {
  return (
    <section className="rounded-card border border-dashed border-accent-foreground/30 bg-accent p-6 text-center text-accent-foreground shadow-lg">
      <span className="text-3xl" aria-hidden="true">
        📊
      </span>
      <h2 className="mt-3 text-lg font-bold">
        Belum ada transaksi bulan ini
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 opacity-80">
        Mulai catat pemasukan atau pengeluaran pertama kamu.
      </p>
      <Link
        href="/cashflow/new"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-white px-5 text-sm font-bold text-accent-strong transition active:scale-[0.98]"
      >
        + Catat Transaksi
      </Link>
    </section>
  );
}
