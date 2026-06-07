import type { TransactionType } from "@/types/transaction";

export type ManualTransactionType = Extract<
  TransactionType,
  "income" | "expense" | "transfer"
>;

export type CashflowAccountOption = {
  id: string;
  name: string;
  currentBalance: number;
};

export type CashflowCategoryOption = {
  id: string;
  name: string;
  transactionType: "income" | "expense" | "transfer";
};

export type CashflowTransactionItem = {
  id: string;
  type: ManualTransactionType;
  amount: number;
  transactionDate: string;
  merchant: string | null;
  notes: string | null;
  accountId: string;
  accountName: string;
  transferToAccountId: string | null;
  destinationAccountName: string | null;
  categoryId: string;
  categoryName: string;
};
