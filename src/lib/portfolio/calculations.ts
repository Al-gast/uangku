import type {
  AllocationKey,
  AllocationSlice,
  PortfolioAccountItem,
  PortfolioAssetItem,
  PortfolioAssetType,
  PortfolioLiabilityItem,
  PortfolioRecommendation,
  PortfolioRecommendationSeverity,
  PortfolioTotals,
} from "./types";
import { portfolioIncludedAccountTypes } from "./types";
import { formatIdr } from "../format";

export type PortfolioAccountRow = {
  id: string;
  name: string;
  type: string;
  current_balance: number | string;
  updated_at?: string | null;
};

export type PortfolioAssetRow = {
  id: string;
  name: string;
  type: string;
  platform: string | null;
  quantity: number | string | null;
  unit: string | null;
  last_price: number | string | null;
  last_price_updated_at: string | null;
  total_cost: number | string | null;
  current_value: number | string;
  notes: string | null;
  updated_at?: string | null;
};

export type PortfolioLiabilityRow = {
  id: string;
  name: string;
  amount: number | string;
  remaining_amount: number | string;
  due_date: string | null;
  reminder_enabled: boolean;
  notes: string | null;
  updated_at?: string | null;
};

export type LiabilityReminderStatus = {
  state: "inactive" | "scheduled" | "due_soon" | "overdue";
  daysUntilDue: number | null;
};

export type AssetReturnSummary = {
  profit: number;
  returnPercent: number;
  direction: "gain" | "loss" | "flat";
};

export type AssetFreshnessStatus = {
  state: "fresh" | "stale" | "unknown";
  daysSinceUpdate: number | null;
  updatedAt: string | null;
};

export type PortfolioFreshnessSummary = {
  lastUpdatedAt: string | null;
  staleAssetCount: number;
};

const staleAssetAfterDays = 30;
const maxPortfolioRecommendations = 3;
const recommendationSeverityOrder: Record<
  PortfolioRecommendationSeverity,
  number
> = {
  danger: 0,
  warning: 1,
  info: 2,
  good: 3,
};

const allocationMeta: Record<
  AllocationKey,
  { label: string; color: string }
> = {
  cash: { label: "Cash & Rekening", color: "var(--alloc-cash)" },
  reksadana: { label: "Reksadana", color: "var(--alloc-rd)" },
  gold: { label: "Emas", color: "var(--alloc-gold)" },
  crypto: { label: "Crypto", color: "var(--alloc-crypto)" },
  stock: { label: "Saham", color: "var(--alloc-stock)" },
  other: { label: "Aset Lain", color: "var(--alloc-other)" },
};

const assetTypeOrder: Record<PortfolioAssetType, number> = {
  rdpu: 0,
  rdpt: 1,
  gold: 2,
  crypto: 3,
  stock: 4,
  other_asset: 5,
};

export function mapPortfolioAccounts(
  rows: PortfolioAccountRow[],
): PortfolioAccountItem[] {
  const typeOrder = { cash: 0, bank_account: 1, e_wallet: 2 };

  return rows
    .filter((account) =>
      portfolioIncludedAccountTypes.includes(
        account.type as PortfolioAccountItem["type"],
      ),
    )
    .map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type as PortfolioAccountItem["type"],
      currentBalance: Number(account.current_balance),
      updatedAt: account.updated_at ?? null,
    }))
    .sort(
      (a, b) =>
        typeOrder[a.type] - typeOrder[b.type] ||
        a.name.localeCompare(b.name, "id"),
    );
}

export function mapPortfolioAssets(
  rows: PortfolioAssetRow[],
): PortfolioAssetItem[] {
  return rows
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type as PortfolioAssetType,
      platform: asset.platform,
      quantity: asset.quantity === null ? null : Number(asset.quantity),
      unit: asset.unit,
      unitPrice:
        asset.last_price === null ? null : Number(asset.last_price),
      unitPriceUpdatedAt: asset.last_price_updated_at,
      totalCost: asset.total_cost === null ? null : Number(asset.total_cost),
      currentValue: Number(asset.current_value),
      notes: asset.notes,
      updatedAt: asset.updated_at ?? null,
    }))
    .sort(
      (a, b) =>
        assetTypeOrder[a.type] - assetTypeOrder[b.type] ||
        a.name.localeCompare(b.name, "id"),
    );
}

export function mapPortfolioLiabilities(
  rows: PortfolioLiabilityRow[],
): PortfolioLiabilityItem[] {
  return rows
    .map((liability) => ({
      id: liability.id,
      name: liability.name,
      amount: Number(liability.amount),
      remainingAmount: Number(liability.remaining_amount),
      dueDate: liability.due_date,
      reminderEnabled: liability.reminder_enabled,
      notes: liability.notes,
      updatedAt: liability.updated_at ?? null,
    }))
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.remainingAmount - a.remainingAmount;
    });
}

export function getLiabilityReminderStatus(
  liability: Pick<
    PortfolioLiabilityItem,
    "dueDate" | "reminderEnabled" | "remainingAmount"
  >,
  now = new Date(),
): LiabilityReminderStatus {
  if (
    !liability.reminderEnabled ||
    !liability.dueDate ||
    liability.remainingAmount <= 0
  ) {
    return { state: "inactive", daysUntilDue: null };
  }

  const dueTime = new Date(
    `${liability.dueDate}T00:00:00+07:00`,
  ).getTime();
  const daysUntilDue = Math.ceil(
    (dueTime - now.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysUntilDue < 0) {
    return { state: "overdue", daysUntilDue };
  }

  if (daysUntilDue <= 7) {
    return { state: "due_soon", daysUntilDue };
  }

  return { state: "scheduled", daysUntilDue };
}

export function getAssetReturnSummary(
  asset: Pick<PortfolioAssetItem, "currentValue" | "totalCost">,
): AssetReturnSummary | null {
  if (asset.totalCost === null || asset.totalCost <= 0) {
    return null;
  }

  const profit = asset.currentValue - asset.totalCost;

  return {
    profit,
    returnPercent: (profit / asset.totalCost) * 100,
    direction:
      profit > 0 ? "gain" : profit < 0 ? "loss" : "flat",
  };
}

export function getAssetFreshnessStatus(
  asset: Pick<PortfolioAssetItem, "unitPriceUpdatedAt" | "updatedAt">,
  now = new Date(),
): AssetFreshnessStatus {
  const updatedAt = asset.unitPriceUpdatedAt ?? asset.updatedAt;

  if (!updatedAt) {
    return { state: "unknown", daysSinceUpdate: null, updatedAt: null };
  }

  const updatedTime = new Date(updatedAt).getTime();

  if (!Number.isFinite(updatedTime)) {
    return { state: "unknown", daysSinceUpdate: null, updatedAt: null };
  }

  const daysSinceUpdate = Math.max(
    0,
    Math.floor((now.getTime() - updatedTime) / (24 * 60 * 60 * 1000)),
  );

  return {
    state: daysSinceUpdate > staleAssetAfterDays ? "stale" : "fresh",
    daysSinceUpdate,
    updatedAt,
  };
}

export function getPortfolioFreshnessSummary(
  accounts: Pick<PortfolioAccountItem, "updatedAt">[],
  assets: Pick<PortfolioAssetItem, "unitPriceUpdatedAt" | "updatedAt">[],
  liabilities: Pick<PortfolioLiabilityItem, "updatedAt">[],
  now = new Date(),
): PortfolioFreshnessSummary {
  const timestamps = [
    ...accounts.map((account) => account.updatedAt),
    ...assets.map((asset) => asset.unitPriceUpdatedAt ?? asset.updatedAt),
    ...liabilities.map((liability) => liability.updatedAt),
  ]
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter(Number.isFinite);
  const lastUpdatedAt =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps)).toISOString()
      : null;
  const staleAssetCount = assets.filter(
    (asset) => getAssetFreshnessStatus(asset, now).state === "stale",
  ).length;

  return {
    lastUpdatedAt,
    staleAssetCount,
  };
}

export function buildPortfolioRecommendations(
  {
    accounts,
    assets,
    liabilities,
    allocation,
    totalAsset,
    totalLiability,
    netWorth,
  }: {
    accounts: PortfolioAccountItem[];
    assets: PortfolioAssetItem[];
    liabilities: PortfolioLiabilityItem[];
    allocation: AllocationSlice[];
  } & PortfolioTotals,
  now = new Date(),
): PortfolioRecommendation[] {
  const recommendations: PortfolioRecommendation[] = [];
  const activeLiabilities = liabilities.filter(
    (liability) => liability.remainingAmount > 0,
  );
  const liabilityAlerts = activeLiabilities
    .map((liability) => ({
      liability,
      status: getLiabilityReminderStatus(liability, now),
    }))
    .filter(
      ({ status }) =>
        status.state === "overdue" || status.state === "due_soon",
    );
  const overdue = liabilityAlerts.find(
    ({ status }) => status.state === "overdue",
  );

  if (netWorth < 0) {
    const firstActiveLiability = activeLiabilities[0];

    recommendations.push({
      id: "negative-net-worth",
      severity: "danger",
      title: "Net worth masih negatif",
      body: `Hutang lebih besar dari aset sebesar ${formatIdr(
        Math.abs(netWorth),
      )}. Prioritaskan pelunasan hutang berbunga atau yang jatuh tempo paling dekat.`,
      privacyBody:
        "Hutang masih lebih besar dari aset. Prioritaskan pelunasan hutang berbunga atau yang jatuh tempo paling dekat.",
      actionHref: firstActiveLiability
        ? `/portfolio/liability/${firstActiveLiability.id}`
        : undefined,
      actionLabel: "Cek hutang",
    });
  }

  if (overdue) {
    recommendations.push({
      id: "overdue-liability",
      severity: "danger",
      title: "Ada hutang lewat jatuh tempo",
      body: `${overdue.liability.name} sudah lewat jatuh tempo. Perbarui status hutang atau catat pembayaran jika sudah dibayar.`,
      actionHref: `/portfolio/liability/${overdue.liability.id}`,
      actionLabel: "Buka hutang",
    });
  } else if (liabilityAlerts.length > 0) {
    const nearest = liabilityAlerts[0];
    recommendations.push({
      id: "due-soon-liability",
      severity: "warning",
      title: "Ada hutang mendekati jatuh tempo",
      body: `${nearest.liability.name} jatuh tempo dalam ${nearest.status.daysUntilDue} hari. Siapkan pembayaran agar tidak terlambat.`,
      actionHref: `/portfolio/liability/${nearest.liability.id}`,
      actionLabel: "Buka hutang",
    });
  }

  const staleAssets = assets
    .map((asset) => ({
      asset,
      freshness: getAssetFreshnessStatus(asset, now),
    }))
    .filter(({ freshness }) => freshness.state === "stale");

  if (staleAssets.length > 0) {
    const oldest = staleAssets.reduce((candidate, item) =>
      (item.freshness.daysSinceUpdate ?? 0) >
      (candidate.freshness.daysSinceUpdate ?? 0)
        ? item
        : candidate,
    );

    recommendations.push({
      id: "stale-asset-values",
      severity: "warning",
      title: "Update nilai aset manual",
      body:
        staleAssets.length === 1
          ? `${oldest.asset.name} belum diperbarui ${oldest.freshness.daysSinceUpdate} hari. Update nilai saat ini agar net worth tetap akurat.`
          : `${staleAssets.length} aset belum diperbarui lebih dari ${staleAssetAfterDays} hari. Mulai dari ${oldest.asset.name} yang paling lama tidak dicek.`,
      privacyBody:
        "Ada aset yang nilainya sudah lama tidak diperbarui. Update nilai saat ini agar net worth tetap akurat.",
      actionHref: `/portfolio/asset/${oldest.asset.id}`,
      actionLabel: "Update aset",
    });
  }

  const debtRatio = totalAsset > 0 ? totalLiability / totalAsset : 0;
  if (netWorth >= 0 && debtRatio >= 0.5) {
    recommendations.push({
      id: "high-debt-ratio",
      severity: "warning",
      title: "Porsi hutang cukup besar",
      body: `Total hutang setara ${Math.round(
        debtRatio * 100,
      )}% dari total aset. Tahan hutang baru sampai rasio ini turun.`,
      privacyBody:
        "Porsi hutang terhadap aset cukup besar. Tahan hutang baru sampai rasio ini turun.",
      actionHref: "/portfolio/add-liability",
      actionLabel: "Cek hutang",
    });
  }

  const largestAllocation = allocation.reduce<AllocationSlice | null>(
    (largest, slice) =>
      !largest || slice.percentage > largest.percentage ? slice : largest,
    null,
  );
  if (largestAllocation && largestAllocation.percentage >= 70) {
    recommendations.push({
      id: "concentrated-allocation",
      severity: "info",
      title: "Alokasi aset terkonsentrasi",
      body: `${largestAllocation.label} mengambil ${Math.round(
        largestAllocation.percentage,
      )}% dari total aset. Cek lagi apakah komposisi ini sudah sesuai tujuan dan toleransi risiko kamu.`,
      privacyBody:
        "Alokasi aset cukup terkonsentrasi. Cek lagi apakah komposisinya sudah sesuai tujuan dan toleransi risiko.",
    });
  }

  if (assets.length === 0 && accounts.length > 0) {
    recommendations.push({
      id: "no-investment-assets",
      severity: "info",
      title: "Belum ada aset investasi tercatat",
      body: "Portfolio saat ini baru berisi saldo cash/rekening. Jika punya reksadana, emas, saham, crypto, atau aset lain, catat agar net worth lebih lengkap.",
      actionHref: "/portfolio/add-asset",
      actionLabel: "Tambah aset",
    });
  }

  if (
    recommendations.length === 0 &&
    totalAsset > 0 &&
    netWorth >= 0
  ) {
    recommendations.push({
      id: "portfolio-looks-ok",
      severity: "good",
      title: "Portfolio terlihat rapi",
      body: "Tidak ada hutang mendesak atau aset yang perlu diperbarui sekarang. Jaga ritme update nilai aset secara berkala.",
      privacyBody:
        "Tidak ada hutang mendesak atau aset yang perlu diperbarui sekarang.",
    });
  }

  return recommendations
    .sort(
      (a, b) =>
        recommendationSeverityOrder[a.severity] -
        recommendationSeverityOrder[b.severity],
    )
    .slice(0, maxPortfolioRecommendations);
}

export function calculatePortfolio(
  accounts: PortfolioAccountItem[],
  assets: PortfolioAssetItem[],
  liabilities: PortfolioLiabilityItem[],
): PortfolioTotals & { allocation: AllocationSlice[] } {
  const totalAccountBalances = accounts.reduce(
    (total, account) => total + account.currentBalance,
    0,
  );
  const totalAssetValues = assets.reduce(
    (total, asset) => total + asset.currentValue,
    0,
  );
  const totalAsset = totalAccountBalances + totalAssetValues;
  const totalLiability = liabilities.reduce(
    (total, liability) => total + liability.remainingAmount,
    0,
  );
  const values: Record<AllocationKey, number> = {
    cash: totalAccountBalances,
    reksadana: assets
      .filter((asset) => asset.type === "rdpu" || asset.type === "rdpt")
      .reduce((total, asset) => total + asset.currentValue, 0),
    gold: assets
      .filter((asset) => asset.type === "gold")
      .reduce((total, asset) => total + asset.currentValue, 0),
    crypto: assets
      .filter((asset) => asset.type === "crypto")
      .reduce((total, asset) => total + asset.currentValue, 0),
    stock: assets
      .filter((asset) => asset.type === "stock")
      .reduce((total, asset) => total + asset.currentValue, 0),
    other: assets
      .filter((asset) => asset.type === "other_asset")
      .reduce((total, asset) => total + asset.currentValue, 0),
  };
  const allocation = (Object.keys(values) as AllocationKey[])
    .filter((key) => values[key] > 0)
    .map((key) => ({
      key,
      label: allocationMeta[key].label,
      value: values[key],
      percentage: totalAsset > 0 ? (values[key] / totalAsset) * 100 : 0,
      color: allocationMeta[key].color,
    }));

  return {
    totalAccountBalances,
    totalAssetValues,
    totalAsset,
    totalLiability,
    netWorth: totalAsset - totalLiability,
    allocation,
  };
}
