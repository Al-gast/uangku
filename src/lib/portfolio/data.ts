import "server-only";

import { notFound } from "next/navigation";
import {
  calculatePortfolio,
  mapPortfolioAccounts,
  mapPortfolioAssets,
  mapPortfolioLiabilities,
} from "@/lib/portfolio/calculations";
import { createClient } from "@/lib/supabase/server";
import type {
  PortfolioData,
  PortfolioSummary,
} from "@/lib/portfolio/types";
import { portfolioIncludedAccountTypes } from "@/lib/portfolio/types";

export async function getPortfolioData(): Promise<PortfolioData> {
  const supabase = await createClient();
  const [accountResult, assetResult, liabilityResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id,name,type,current_balance,updated_at")
      .eq("is_active", true)
      .in("type", [...portfolioIncludedAccountTypes]),
    supabase
      .from("assets")
      .select(
        "id,name,type,platform,quantity,unit,last_price,last_price_updated_at,total_cost,current_value,notes,updated_at",
      )
      .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"]),
    supabase
      .from("liabilities")
      .select(
        "id,name,amount,remaining_amount,due_date,reminder_enabled,notes,updated_at",
      ),
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

  const accounts = mapPortfolioAccounts(accountResult.data ?? []);
  const assets = mapPortfolioAssets(assetResult.data ?? []);
  const liabilities = mapPortfolioLiabilities(liabilityResult.data ?? []);

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
    assetCount: data.accounts.length + data.assets.length,
    liabilityCount: data.liabilities.filter(
      (liability) => liability.remainingAmount > 0,
    ).length,
    error: data.error,
  };
}

export async function getPortfolioAsset(assetId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select(
      "id,name,type,platform,quantity,unit,last_price,last_price_updated_at,total_cost,current_value,notes,updated_at",
    )
    .eq("id", assetId)
    .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return mapPortfolioAssets([data])[0];
}

export async function getPortfolioLiability(liabilityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("liabilities")
    .select(
      "id,name,amount,remaining_amount,due_date,reminder_enabled,notes,updated_at",
    )
    .eq("id", liabilityId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return mapPortfolioLiabilities([data])[0];
}
