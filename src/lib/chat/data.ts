import "server-only";

import type {
  ChatAccount,
  ChatAsset,
  ChatCategory,
  ChatLiability,
} from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

export async function getChatOptions() {
  const supabase = await createClient();
  const [
    categorySetupResult,
    accountResult,
    assetResult,
    liabilityResult,
  ] = await Promise.all([
    supabase.rpc("ensure_default_categories"),
    supabase
      .from("accounts")
      .select("id,name,type,current_balance")
      .eq("is_active", true)
      .in("type", ["cash", "bank_account", "e_wallet"])
      .order("created_at"),
    supabase
      .from("assets")
      .select("id,name,type,current_value")
      .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
      .order("created_at"),
    supabase
      .from("liabilities")
      .select("id,name,remaining_amount")
      .gt("remaining_amount", 0)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at"),
  ]);
  const setupError = categorySetupResult.error;

  if (setupError) {
    return {
      accounts: [] as ChatAccount[],
      assets: [] as ChatAsset[],
      liabilities: [] as ChatLiability[],
      categories: [] as ChatCategory[],
      setupError:
        setupError.code === "PGRST202" ||
        setupError.code === "42883"
          ? "Migration Chat Input belum diterapkan di Supabase."
          : "Kategori chat belum bisa disiapkan.",
    };
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id,name,transaction_type,aliases")
    .in("transaction_type", [
      "income",
      "expense",
      "transfer",
      "investment",
      "debt",
    ])
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  const { data: accountRows, error: accountError } = accountResult;
  const { data: assetRows, error: assetError } = assetResult;
  const { data: liabilityRows, error: liabilityError } = liabilityResult;

  if (accountError || assetError || liabilityError || categoryError) {
    return {
      accounts: [] as ChatAccount[],
      assets: [] as ChatAsset[],
      liabilities: [] as ChatLiability[],
      categories: [] as ChatCategory[],
      setupError: "Data akun dan kategori belum bisa dimuat.",
    };
  }

  return {
    accounts: (accountRows ?? []).map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type as ChatAccount["type"],
      currentBalance: Number(account.current_balance),
    })),
    assets: (assetRows ?? []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type as ChatAsset["type"],
      currentValue: Number(asset.current_value),
    })),
    liabilities: (liabilityRows ?? []).map((liability) => ({
      id: liability.id,
      name: liability.name,
      remainingAmount: Number(liability.remaining_amount),
    })),
    categories: (categoryRows ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      transactionType:
        category.transaction_type as ChatCategory["transactionType"],
      aliases: category.aliases ?? [],
    })),
    setupError: null,
  };
}
