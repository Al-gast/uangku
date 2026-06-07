import { formatIdr } from "@/lib/format";

export function PortfolioHeroCard({
  netWorth,
  totalAsset,
  totalLiability,
}: {
  netWorth: number;
  totalAsset: number;
  totalLiability: number;
}) {
  return (
    <section className="rounded-card bg-accent p-6 text-accent-foreground shadow-lg">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] opacity-80">
        Net Worth
      </p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">
        {formatIdr(netWorth)}
      </p>
      {netWorth < 0 && (
        <p className="mt-2 text-sm font-semibold opacity-90">
          Hutang melebihi total aset
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-80">↑ Aset</p>
          <p className="mt-1 truncate font-bold">{formatIdr(totalAsset)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-80">↓ Hutang</p>
          <p className="mt-1 truncate font-bold">
            {formatIdr(totalLiability)}
          </p>
        </div>
      </div>
    </section>
  );
}
