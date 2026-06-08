import type {
  CategoryGroup,
  CategoryTransactionType,
} from "@/types/category";

export type ManageableCategoryType = Extract<
  CategoryTransactionType,
  "income" | "expense"
>;

export type ManageableCategoryGroup = CategoryGroup;

export type SettingsCategoryItem = {
  id: string;
  name: string;
  transactionType: ManageableCategoryType;
  group: ManageableCategoryGroup;
  isDefault: boolean;
  isActive: boolean;
  isProtected: boolean;
  transactionCount: number;
  budgetCount: number;
  adminFeeReferenceCount: number;
};

export const categoryTypeLabels: Record<ManageableCategoryType, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
};

export const categoryGroupLabels: Record<ManageableCategoryGroup, string> = {
  primer: "Primer",
  sekunder: "Sekunder",
  lifestyle: "Lifestyle",
  transport: "Transport",
  tagihan: "Tagihan",
  kesehatan: "Kesehatan",
  pendidikan: "Pendidikan",
  investasi: "Investasi",
  transfer: "Transfer",
  income: "Income",
  debt: "Debt",
  other: "Lainnya",
};

export const categoryGroupOptions: Array<{
  value: ManageableCategoryGroup;
  label: string;
}> = [
  { value: "primer", label: categoryGroupLabels.primer },
  { value: "sekunder", label: categoryGroupLabels.sekunder },
  { value: "lifestyle", label: categoryGroupLabels.lifestyle },
  { value: "transport", label: categoryGroupLabels.transport },
  { value: "tagihan", label: categoryGroupLabels.tagihan },
  { value: "kesehatan", label: categoryGroupLabels.kesehatan },
  { value: "pendidikan", label: categoryGroupLabels.pendidikan },
  { value: "investasi", label: categoryGroupLabels.investasi },
  { value: "income", label: categoryGroupLabels.income },
  { value: "other", label: categoryGroupLabels.other },
];

export const protectedCategoryNames = new Set(["biaya admin", "investasi"]);

export function isProtectedCategoryName(name: string) {
  return protectedCategoryNames.has(name.trim().toLowerCase());
}
