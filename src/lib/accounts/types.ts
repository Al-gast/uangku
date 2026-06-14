import type { AccountType } from "@/types/account";
import type {
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";

export type SpendableAccountType = Extract<
  AccountType,
  "cash" | "bank_account" | "e_wallet"
>;

export type SettingsAccountItem = {
  id: string;
  name: string;
  type: SpendableAccountType;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  transactionCount: number;
  createdAt: string;
};

export type AccountMovementDirection = "in" | "out";

export const accountMutationDateRanges = [
  "all",
  "this_month",
  "last_30_days",
] as const;

export type AccountMutationDateRange =
  (typeof accountMutationDateRanges)[number];

export const accountMutationTypeFilters = [
  "all",
  "income",
  "expense",
  "transfer",
] as const;

export type AccountMutationTypeFilter =
  (typeof accountMutationTypeFilters)[number];

export type AccountMutationFilters = {
  range: AccountMutationDateRange;
  type: AccountMutationTypeFilter;
};

export type AccountMutationItem = Pick<
  CashflowTransactionItem,
  | "id"
  | "source"
  | "reconciliationStatus"
  | "type"
  | "amount"
  | "adminFeeAmount"
  | "adminFeeCategoryName"
  | "transactionDate"
  | "merchant"
  | "notes"
  | "accountId"
  | "accountName"
  | "transferToAccountId"
  | "destinationAccountName"
  | "assetName"
  | "liabilityName"
  | "categoryName"
> & {
  direction: AccountMovementDirection;
  balanceEffect: number;
  title: string;
  subtitle: string;
};

export type AccountMovementSummary = {
  totalIn: number;
  totalOut: number;
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
  otherIn: number;
  otherOut: number;
  adminFees: number;
  netMovement: number;
  transactionCount: number;
};

export type AccountDetailResult = {
  account: SettingsAccountItem | null;
  transactions: AccountMutationItem[];
  summary: AccountMovementSummary;
  error: string | null;
};

export type AccountNewTransactionType = Extract<
  ManualTransactionType,
  "income" | "expense" | "transfer"
>;
