import type { TransactionType } from "@/types/transaction";
import type { TransactionSource } from "@/types/transaction";

export type ManualTransactionType = Extract<
  TransactionType,
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell"
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

export type CashflowCategoryOption = {
  id: string;
  name: string;
  transactionType: "income" | "expense" | "transfer" | "investment";
};

export type CashflowTransactionItem = {
  id: string;
  source: Extract<TransactionSource, "manual" | "chat">;
  type: ManualTransactionType;
  amount: number;
  transactionDate: string;
  merchant: string | null;
  notes: string | null;
  accountId: string;
  accountName: string;
  transferToAccountId: string | null;
  destinationAccountName: string | null;
  assetId: string | null;
  assetName: string | null;
  categoryId: string;
  categoryName: string;
};
