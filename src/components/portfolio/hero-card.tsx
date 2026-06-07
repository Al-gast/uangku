import { MoneyText } from "@/components/ui/money-text";

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
      <MoneyText
        as="p"
        value={netWorth}
        className="mt-3 text-3xl font-extrabold tracking-tight"
      />
      {netWorth < 0 && (
        <p className="mt-2 text-sm font-semibold opacity-90">
          Hutang melebihi total aset
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-80">↑ Aset</p>
          <MoneyText
            as="p"
            value={totalAsset}
            className="mt-1 truncate font-bold"
          />
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-80">↓ Hutang</p>
          <MoneyText
            as="p"
            value={totalLiability}
            className="mt-1 truncate font-bold"
          />
        </div>
      </div>
    </section>
  );
}
