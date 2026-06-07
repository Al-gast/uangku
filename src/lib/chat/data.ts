import "server-only";

import type { ChatAccount, ChatAsset, ChatCategory } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

export async function getChatOptions() {
  const supabase = await createClient();
  const { error: categorySetupError } = await supabase.rpc(
    "ensure_chat_categories",
  );

  if (categorySetupError) {
    return {
      accounts: [] as ChatAccount[],
      assets: [] as ChatAsset[],
      categories: [] as ChatCategory[],
      setupError:
        categorySetupError.code === "PGRST202" ||
        categorySetupError.code === "42883"
          ? "Migration Chat Input belum diterapkan di Supabase."
          : "Kategori chat belum bisa disiapkan.",
    };
  }

  const [
    { data: accountRows, error: accountError },
    { data: assetRows, error: assetError },
    { data: categoryRows, error: categoryError },
  ] = await Promise.all([
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
        .from("categories")
        .select("id,name,transaction_type")
        .in("transaction_type", ["income", "expense", "transfer", "investment"])
        .eq("is_active", true)
        .order("name"),
    ]);

  if (accountError || assetError || categoryError) {
    return {
      accounts: [] as ChatAccount[],
      assets: [] as ChatAsset[],
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
    categories: (categoryRows ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      transactionType:
        category.transaction_type as ChatCategory["transactionType"],
    })),
    setupError: null,
  };
}
