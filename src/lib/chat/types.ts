import type { AccountType } from "@/types/account";
import type { PortfolioAssetType } from "@/lib/portfolio/types";

export type ChatTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell"
  | "debt_payment";

export type ChatCategoryType =
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "debt";

export type ChatAccount = {
  id: string;
  name: string;
  type: AccountType;
  currentBalance: number;
};

export type ChatCategory = {
  id: string;
  name: string;
  transactionType: ChatCategoryType;
  aliases?: string[];
};

export type ChatAsset = {
  id: string;
  name: string;
  type: PortfolioAssetType;
  currentValue: number;
};

export type ChatLiability = {
  id: string;
  name: string;
  remainingAmount: number;
};

export type ChatTransactionDraft = {
  type: ChatTransactionType;
  amount: number;
  adminFeeAmount: number;
  categoryId: string;
  accountId: string;
  transferToAccountId: string | null;
  assetId: string | null;
  liabilityId: string | null;
  merchant: string | null;
  notes: string | null;
  transactionDate: string;
  confidence: number;
};

export type ChatParseFailureReason =
  | "no_amount"
  | "amount_only"
  | "zero_amount"
  | "negative_amount"
  | "amount_too_large"
  | "negative_admin_fee"
  | "admin_fee_too_large"
  | "admin_fee_exceeds_amount"
  | "admin_fee_not_supported"
  | "unknown_category"
  | "account_not_found"
  | "asset_not_found"
  | "liability_not_found"
  | "transfer_accounts_missing"
  | "same_transfer_account"
  | "unsupported";

export type ChatParseResult =
  | {
      success: true;
      draft: ChatTransactionDraft;
    }
  | {
      success: false;
      reason: ChatParseFailureReason;
      suggestions: string[];
    };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tone?: "default" | "error" | "success";
};

export type ChatSaveResult = {
  success: boolean;
  message?: string;
  error?: string;
};
