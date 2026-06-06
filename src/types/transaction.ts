export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell"
  | "asset_update"
  | "debt";

export type TransactionSource = "manual" | "chat" | "ocr" | "email";

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  account_id: string;
  transfer_to_account_id: string | null;
  asset_id: string | null;
  transaction_date: string;
  merchant: string | null;
  notes: string | null;
  tags: string[];
  source: TransactionSource;
  created_at: string;
  updated_at: string;
};
