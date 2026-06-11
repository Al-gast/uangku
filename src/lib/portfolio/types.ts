import type { AccountType } from "@/types/account";

export const portfolioAssetTypes = [
  "rdpu",
  "rdpt",
  "gold",
  "crypto",
  "stock",
  "other_asset",
] as const;

export const portfolioIncludedAccountTypes = [
  "cash",
  "bank_account",
  "e_wallet",
] as const;

export type PortfolioAssetType = (typeof portfolioAssetTypes)[number];
export type LiquidAccountType =
  (typeof portfolioIncludedAccountTypes)[number] & AccountType;

export type PortfolioAccountItem = {
  id: string;
  name: string;
  type: LiquidAccountType;
  currentBalance: number;
  updatedAt: string | null;
};

export type PortfolioAssetItem = {
  id: string;
  name: string;
  type: PortfolioAssetType;
  platform: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  unitPriceUpdatedAt: string | null;
  totalCost: number | null;
  currentValue: number;
  notes: string | null;
  updatedAt: string | null;
};

export type PortfolioLiabilityItem = {
  id: string;
  name: string;
  amount: number;
  remainingAmount: number;
  dueDate: string | null;
  reminderEnabled: boolean;
  notes: string | null;
  updatedAt: string | null;
};

export type AllocationKey =
  | "cash"
  | "reksadana"
  | "gold"
  | "crypto"
  | "stock"
  | "other";

export type AllocationSlice = {
  key: AllocationKey;
  label: string;
  value: number;
  percentage: number;
  color: string;
};

export type PortfolioRecommendationSeverity =
  | "danger"
  | "warning"
  | "info"
  | "good";

export type PortfolioRecommendation = {
  id: string;
  severity: PortfolioRecommendationSeverity;
  title: string;
  body: string;
  privacyBody?: string;
  actionHref?: string;
  actionLabel?: string;
};

export type PortfolioTotals = {
  totalAccountBalances: number;
  totalAssetValues: number;
  totalAsset: number;
  totalLiability: number;
  netWorth: number;
};

export type PortfolioData = PortfolioTotals & {
  accounts: PortfolioAccountItem[];
  assets: PortfolioAssetItem[];
  liabilities: PortfolioLiabilityItem[];
  allocation: AllocationSlice[];
  error: string | null;
};

export type PortfolioSummary = PortfolioTotals & {
  assetCount: number;
  liabilityCount: number;
  error: string | null;
};
