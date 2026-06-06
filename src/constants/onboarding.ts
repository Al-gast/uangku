import type { AccountType } from "@/types/account";

export const accountTypeOptions: Array<{
  value: AccountType;
  label: string;
}> = [
  { value: "cash", label: "Cash" },
  { value: "bank_account", label: "Bank Account" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "investment_account", label: "Investment Account" },
  { value: "asset_account", label: "Asset Account" },
  { value: "liability", label: "Liability" },
];

export const accountPresets: Array<{
  name: string;
  type: AccountType;
}> = [
  { name: "BCA", type: "bank_account" },
  { name: "Jago", type: "bank_account" },
  { name: "GoPay", type: "e_wallet" },
  { name: "Cash", type: "cash" },
  { name: "Bibit", type: "investment_account" },
  { name: "Stockbit", type: "investment_account" },
];

export const onboardingBudgetCategories = [
  "Makan",
  "Transport",
  "Lifestyle",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
] as const;

export type OnboardingBudgetCategory =
  (typeof onboardingBudgetCategories)[number];
