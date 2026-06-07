import type { AccountType } from "@/types/account";
import type { PortfolioAssetType } from "@/lib/portfolio/types";

export type ChatTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell";

export type ChatCategoryType =
  | "income"
  | "expense"
  | "transfer"
  | "investment";

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
};

export type ChatAsset = {
  id: string;
  name: string;
  type: PortfolioAssetType;
  currentValue: number;
};

export type ChatTransactionDraft = {
  type: ChatTransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  transferToAccountId: string | null;
  assetId: string | null;
  transactionDate: string;
  confidence: number;
};

export type ChatParseFailureReason =
  | "no_amount"
  | "amount_only"
  | "zero_amount"
  | "negative_amount"
  | "amount_too_large"
  | "unknown_category"
  | "account_not_found"
  | "asset_not_found"
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
