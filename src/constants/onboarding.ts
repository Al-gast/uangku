import type { AccountType } from "@/types/account";

export const accountTypeOptions: Array<{
  value: AccountType;
  label: string;
}> = [
  { value: "cash", label: "Tunai" },
  { value: "bank_account", label: "Rekening Bank" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "investment_account", label: "Akun Investasi" },
  { value: "asset_account", label: "Akun Aset" },
  { value: "liability", label: "Hutang/Pinjaman" },
];

export const accountPresets: Array<{
  name: string;
  type: AccountType;
  icon: string;
}> = [
  { name: "BCA", type: "bank_account", icon: "🏦" },
  { name: "Jago", type: "bank_account", icon: "🏦" },
  { name: "GoPay", type: "e_wallet", icon: "📱" },
  { name: "Cash", type: "cash", icon: "💵" },
  { name: "Bibit", type: "investment_account", icon: "📈" },
  { name: "Stockbit", type: "investment_account", icon: "📈" },
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
