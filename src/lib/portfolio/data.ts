import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AllocationKey,
  AllocationSlice,
  PortfolioAccountItem,
  PortfolioAssetItem,
  PortfolioAssetType,
  PortfolioData,
  PortfolioLiabilityItem,
  PortfolioSummary,
} from "@/lib/portfolio/types";

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

function mapAccounts(
  rows: Array<{
    id: string;
    name: string;
    type: string;
    current_balance: number | string;
  }>,
): PortfolioAccountItem[] {
  const typeOrder = { cash: 0, bank_account: 1, e_wallet: 2 };

  return rows
    .map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type as PortfolioAccountItem["type"],
      currentBalance: Number(account.current_balance),
    }))
    .sort(
      (a, b) =>
        typeOrder[a.type] - typeOrder[b.type] ||
        a.name.localeCompare(b.name, "id"),
    );
}

function mapAssets(
  rows: Array<{
    id: string;
    name: string;
    type: string;
    platform: string | null;
    quantity: number | string | null;
    unit: string | null;
    last_price: number | string | null;
    total_cost: number | string | null;
    current_value: number | string;
    notes: string | null;
  }>,
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
      totalCost: asset.total_cost === null ? null : Number(asset.total_cost),
      currentValue: Number(asset.current_value),
      notes: asset.notes,
    }))
    .sort(
      (a, b) =>
        assetTypeOrder[a.type] - assetTypeOrder[b.type] ||
        a.name.localeCompare(b.name, "id"),
    );
}

function mapLiabilities(
  rows: Array<{
    id: string;
    name: string;
    amount: number | string;
    remaining_amount: number | string;
    due_date: string | null;
    notes: string | null;
  }>,
): PortfolioLiabilityItem[] {
  return rows
    .map((liability) => ({
      id: liability.id,
      name: liability.name,
      amount: Number(liability.amount),
      remainingAmount: Number(liability.remaining_amount),
      dueDate: liability.due_date,
      notes: liability.notes,
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

function calculatePortfolio(
  accounts: PortfolioAccountItem[],
  assets: PortfolioAssetItem[],
  liabilities: PortfolioLiabilityItem[],
) {
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
  const allocation: AllocationSlice[] = (
    Object.keys(values) as AllocationKey[]
  )
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

export async function getPortfolioData(): Promise<PortfolioData> {
  const supabase = await createClient();
  const [accountResult, assetResult, liabilityResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id,name,type,current_balance")
      .eq("is_active", true)
      .in("type", ["cash", "bank_account", "e_wallet"]),
    supabase
      .from("assets")
      .select(
        "id,name,type,platform,quantity,unit,last_price,total_cost,current_value,notes",
      )
      .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"]),
    supabase
      .from("liabilities")
      .select("id,name,amount,remaining_amount,due_date,notes"),
  ]);

  if (accountResult.error || assetResult.error || liabilityResult.error) {
    return {
      accounts: [],
      assets: [],
      liabilities: [],
      allocation: [],
      totalAccountBalances: 0,
      totalAssetValues: 0,
      totalAsset: 0,
      totalLiability: 0,
      netWorth: 0,
      error: "Data portfolio belum bisa dimuat.",
    };
  }

  const accounts = mapAccounts(accountResult.data ?? []);
  const assets = mapAssets(assetResult.data ?? []);
  const liabilities = mapLiabilities(liabilityResult.data ?? []);

  return {
    accounts,
    assets,
    liabilities,
    ...calculatePortfolio(accounts, assets, liabilities),
    error: null,
  };
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const data = await getPortfolioData();
  return {
    totalAccountBalances: data.totalAccountBalances,
    totalAssetValues: data.totalAssetValues,
    totalAsset: data.totalAsset,
    totalLiability: data.totalLiability,
    netWorth: data.netWorth,
    error: data.error,
  };
}

export async function getPortfolioAsset(assetId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select(
      "id,name,type,platform,quantity,unit,last_price,total_cost,current_value,notes",
    )
    .eq("id", assetId)
    .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return mapAssets([data])[0];
}

export async function getPortfolioLiability(liabilityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("liabilities")
    .select("id,name,amount,remaining_amount,due_date,notes")
    .eq("id", liabilityId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return mapLiabilities([data])[0];
}
