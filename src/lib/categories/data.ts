import "server-only";

import type {
  ManageableCategoryGroup,
  ManageableCategoryType,
  SettingsCategoryItem,
} from "@/lib/categories/types";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
  group: ManageableCategoryGroup;
  transaction_type: ManageableCategoryType;
  is_default: boolean;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  aliases: string[] | null;
};

type TransactionCategoryRow = {
  category_id: string | null;
  admin_fee_category_id: string | null;
};

type BudgetCategoryRow = {
  category_id: string;
};

export async function getSettingsCategories(): Promise<{
  categories: SettingsCategoryItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { error: setupError } = await supabase.rpc(
    "ensure_default_categories",
  );

  if (setupError) {
    return {
      categories: [],
      error:
        setupError.code === "PGRST202" || setupError.code === "42883"
          ? "Migration kategori belum diterapkan di Supabase."
          : "Kategori belum bisa disiapkan.",
    };
  }

  const categoryResult = await supabase
    .from("categories")
    .select(
      "id,name,group,transaction_type,is_default,is_active,is_system,sort_order,aliases",
    )
    .in("transaction_type", [
      "expense",
      "income",
      "transfer",
      "investment",
      "debt",
    ])
    .order("transaction_type")
    .order("is_active", { ascending: false })
    .order("sort_order")
    .order("name");

  if (categoryResult.error) {
    return {
      categories: [],
      error: "Kategori belum bisa dimuat.",
    };
  }

  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  const categoryIds = categoryRows.map((category) => category.id);

  if (categoryIds.length === 0) {
    return {
      categories: [],
      error: null,
    };
  }

  const [transactionResult, budgetResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("category_id,admin_fee_category_id")
      .or(
        `category_id.in.(${categoryIds.join(",")}),admin_fee_category_id.in.(${categoryIds.join(",")})`,
      ),
    supabase
      .from("budgets")
      .select("category_id")
      .in("category_id", categoryIds),
  ]);

  if (transactionResult.error || budgetResult.error) {
    return {
      categories: [],
      error: "Pemakaian kategori belum bisa dihitung.",
    };
  }

  const transactionCounts = new Map<string, number>();
  const adminFeeCounts = new Map<string, number>();
  const budgetCounts = new Map<string, number>();

  for (const transaction of (transactionResult.data ??
    []) as TransactionCategoryRow[]) {
    if (transaction.category_id) {
      transactionCounts.set(
        transaction.category_id,
        (transactionCounts.get(transaction.category_id) ?? 0) + 1,
      );
    }

    if (transaction.admin_fee_category_id) {
      adminFeeCounts.set(
        transaction.admin_fee_category_id,
        (adminFeeCounts.get(transaction.admin_fee_category_id) ?? 0) + 1,
      );
    }
  }

  for (const budget of (budgetResult.data ?? []) as BudgetCategoryRow[]) {
    budgetCounts.set(
      budget.category_id,
      (budgetCounts.get(budget.category_id) ?? 0) + 1,
    );
  }

  return {
    categories: categoryRows.map((category) => ({
      id: category.id,
      name: category.name,
      transactionType: category.transaction_type,
      group: category.group,
      isDefault: category.is_default,
      isActive: category.is_active,
      isSystem: category.is_system,
      sortOrder: category.sort_order,
      aliases: category.aliases ?? [],
      transactionCount: transactionCounts.get(category.id) ?? 0,
      budgetCount: budgetCounts.get(category.id) ?? 0,
      adminFeeReferenceCount: adminFeeCounts.get(category.id) ?? 0,
    })),
    error: null,
  };
}
