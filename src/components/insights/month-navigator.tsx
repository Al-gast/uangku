import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export function MonthNavigator({
  monthKey,
  monthLabel,
  previousMonthKey,
  nextMonthKey,
  isCurrentMonth,
}: {
  monthKey: string;
  monthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  isCurrentMonth: boolean;
}) {
  const previousHref = `/insights?month=${previousMonthKey}`;
  const nextHref =
    nextMonthKey === currentMonthKey()
      ? "/insights"
      : `/insights?month=${nextMonthKey}`;

  return (
    <section className="mb-6 border-y border-border bg-surface py-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={previousHref}
          aria-label="Lihat bulan sebelumnya"
          title="Bulan sebelumnya"
          className="grid size-10 shrink-0 place-items-center rounded-control border border-border bg-background text-foreground transition hover:border-accent active:scale-[0.96]"
        >
          <Icon name="arrow" className="size-4 rotate-180" />
        </Link>

        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-bold">{monthLabel}</p>
          {!isCurrentMonth && (
            <Link
              href="/insights"
              className="mt-1 inline-block text-xs font-bold text-accent-strong"
            >
              Kembali ke bulan ini
            </Link>
          )}
        </div>

        {isCurrentMonth ? (
          <span
            aria-label="Sudah di bulan berjalan"
            title="Bulan berikutnya belum tersedia"
            className="grid size-10 shrink-0 place-items-center rounded-control border border-border bg-surface-muted text-muted opacity-50"
          >
            <Icon name="arrow" className="size-4" />
          </span>
        ) : (
          <Link
            href={nextHref}
            aria-label="Lihat bulan berikutnya"
            title="Bulan berikutnya"
            className="grid size-10 shrink-0 place-items-center rounded-control border border-border bg-background text-foreground transition hover:border-accent active:scale-[0.96]"
          >
            <Icon name="arrow" className="size-4" />
          </Link>
        )}
      </div>

      <form action="/insights" className="mt-3 flex gap-2">
        <input
          type="month"
          name="month"
          defaultValue={monthKey}
          max={currentMonthKey()}
          aria-label="Pilih bulan rekap"
          className="min-h-11 min-w-0 flex-1 rounded-control border border-border bg-background px-3 text-sm font-semibold outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
        <button
          type="submit"
          className="min-h-11 rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
        >
          Tampilkan
        </button>
      </form>
    </section>
  );
}

function currentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}
