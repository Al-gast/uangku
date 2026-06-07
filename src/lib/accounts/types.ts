import type { AccountType } from "@/types/account";

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
