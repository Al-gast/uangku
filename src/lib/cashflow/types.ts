import type { TransactionType } from "@/types/transaction";
import type { TransactionSource } from "@/types/transaction";

export type ManualTransactionType = Extract<
  TransactionType,
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell"
  | "debt_payment"
>;

export type CashflowAccountOption = {
  id: string;
  name: string;
  currentBalance: number;
};

export type CashflowAssetOption = {
  id: string;
  name: string;
  currentValue: number;
};

export type CashflowLiabilityOption = {
  id: string;
  name: string;
  remainingAmount: number;
};

export type CashflowCategoryOption = {
  id: string;
  name: string;
  transactionType: "income" | "expense" | "transfer" | "investment" | "debt";
};

export const cashflowDateRanges = [
  "all",
  "this_month",
  "last_7_days",
  "last_30_days",
] as const;

export type CashflowDateRange = (typeof cashflowDateRanges)[number];

export type CashflowFilters = {
  type: ManualTransactionType | null;
  accountId: string | null;
  categoryId: string | null;
  source: CashflowTransactionItem["source"] | null;
  range: CashflowDateRange;
};

export type CashflowFilterAccountOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type CashflowFilterCategoryOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type CashflowTransactionItem = {
  id: string;
  source: Extract<TransactionSource, "manual" | "chat">;
  type: ManualTransactionType;
  amount: number;
  adminFeeAmount: number;
  adminFeeCategoryId: string | null;
  adminFeeCategoryName: string | null;
  transactionDate: string;
  merchant: string | null;
  notes: string | null;
  accountId: string;
  accountName: string;
  transferToAccountId: string | null;
  destinationAccountName: string | null;
  assetId: string | null;
  assetName: string | null;
  liabilityId: string | null;
  liabilityName: string | null;
  categoryId: string;
  categoryName: string;
};
