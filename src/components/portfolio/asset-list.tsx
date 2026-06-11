import Link from "next/link";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import {
  getAssetFreshnessStatus,
  getAssetReturnSummary,
} from "@/lib/portfolio/calculations";
import type {
  PortfolioAccountItem,
  PortfolioAssetItem,
  PortfolioAssetType,
} from "@/lib/portfolio/types";

const accountLabels: Record<PortfolioAccountItem["type"], string> = {
  cash: "Cash",
  bank_account: "Rekening",
  e_wallet: "E-Wallet",
};

const groups: Array<{
  key: string;
  label: string;
  types: PortfolioAssetType[];
}> = [
  { key: "reksadana", label: "📈 Reksadana", types: ["rdpu", "rdpt"] },
  { key: "gold", label: "🪙 Emas", types: ["gold"] },
  { key: "crypto", label: "₿ Crypto", types: ["crypto"] },
  { key: "stock", label: "📊 Saham", types: ["stock"] },
  { key: "other", label: "📦 Aset Lain", types: ["other_asset"] },
];

function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 8,
  }).format(value);
}

function getAssetSubtitle(
  asset: PortfolioAssetItem,
  fallbackLabel: string,
) {
  if (asset.quantity === null) {
    return asset.platform || fallbackLabel;
  }

  const quantity = `${formatQuantity(asset.quantity)}${
    asset.unit ? ` ${asset.unit}` : ""
  }`;

  return asset.platform ? `${quantity} · ${asset.platform}` : quantity;
}

function AssetReturnText({ asset }: { asset: PortfolioAssetItem }) {
  const summary = getAssetReturnSummary(asset);

  if (!summary) {
    return null;
  }

  const sign =
    summary.profit > 0 ? "+" : summary.profit < 0 ? "-" : "";
  const tone =
    summary.direction === "gain"
      ? "text-income"
      : summary.direction === "loss"
        ? "text-expense"
        : "text-muted";

  return (
    <p className={`mt-1 text-xs font-semibold ${tone}`}>
      <MoneyText
        value={Math.abs(summary.profit)}
        sign={sign}
      />{" "}
      <PrivateText
        value={`(${sign}${Math.abs(summary.returnPercent).toFixed(1)}%)`}
      />
    </p>
  );
}

function AssetFreshnessText({ asset }: { asset: PortfolioAssetItem }) {
  const freshness = getAssetFreshnessStatus(asset);

  if (freshness.state !== "stale" || freshness.daysSinceUpdate === null) {
    return null;
  }

  return (
    <p className="mt-1 text-xs font-semibold text-expense">
      Perlu update nilai · {freshness.daysSinceUpdate} hari lalu
    </p>
  );
}

function GroupCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <h3 className="bg-surface-muted px-5 py-3.5 text-sm font-bold">
        {label}
      </h3>
      {children}
    </div>
  );
}

export function AssetList({
  accounts,
  assets,
}: {
  accounts: PortfolioAccountItem[];
  assets: PortfolioAssetItem[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Daftar Aset</h2>
        <Link
          href="/portfolio/add-asset"
          className="text-sm font-bold text-accent-strong"
        >
          + Tambah
        </Link>
      </div>
      <p className="mb-3 text-xs leading-5 text-muted">
        Saldo cash, rekening, dan e-wallet dihitung otomatis. Nilai akun
        investasi berasal dari aset yang kamu catat agar tidak terhitung dua
        kali.
      </p>

      <div className="space-y-4">
        {accounts.length > 0 && (
          <GroupCard label="🏦 Cash & Rekening">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between gap-4 border-t border-border px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {account.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {accountLabels[account.type]}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <MoneyText
                    as="p"
                    value={account.currentBalance}
                    className="text-sm font-bold"
                  />
                  <span className="text-xs text-muted">🔒</span>
                </div>
              </div>
            ))}
          </GroupCard>
        )}

        {groups.map((group) => {
          const items = assets.filter((asset) =>
            group.types.includes(asset.type),
          );

          if (items.length === 0) {
            return null;
          }

          return (
            <GroupCard key={group.key} label={group.label}>
              {items.map((asset) => {
                const fallbackLabel = group.label.replace(/^[^\s]+\s/, "");

                return (
                  <Link
                    key={asset.id}
                    href={`/portfolio/asset/${asset.id}`}
                    className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 transition hover:bg-surface-muted active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {asset.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {getAssetSubtitle(asset, fallbackLabel)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <MoneyText
                        as="p"
                        value={asset.currentValue}
                        className="text-sm font-bold"
                      />
                      <AssetReturnText asset={asset} />
                      <AssetFreshnessText asset={asset} />
                      <span className="text-sm text-muted">›</span>
                    </div>
                  </Link>
                );
              })}
            </GroupCard>
          );
        })}

        {assets.length === 0 && (
          <div className="rounded-card border border-dashed border-accent/30 bg-surface p-5 text-center">
            <div className="text-2xl">💡</div>
            <h3 className="mt-3 text-sm font-bold">
              Punya investasi atau aset?
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Catat reksadana, emas, crypto, saham, atau aset lainnya untuk
              melihat alokasi kamu.
            </p>
            <Link
              href="/portfolio/add-asset"
              className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground"
            >
              + Tambah Aset
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
