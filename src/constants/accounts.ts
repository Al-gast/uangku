import type { SpendableAccountType } from "@/lib/accounts/types";

export const spendableAccountTypeOptions: Array<{
  value: SpendableAccountType;
  label: string;
  icon: string;
}> = [
  { value: "cash", label: "Tunai", icon: "💵" },
  { value: "bank_account", label: "Rekening Bank", icon: "🏦" },
  { value: "e_wallet", label: "E-Wallet", icon: "📱" },
];

export const spendableAccountTypeLabels: Record<
  SpendableAccountType,
  string
> = {
  cash: "Tunai",
  bank_account: "Rekening Bank",
  e_wallet: "E-Wallet",
};

export const spendableAccountTypes = spendableAccountTypeOptions.map(
  (option) => option.value,
);
