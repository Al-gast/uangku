export type AccountType =
  | "cash"
  | "bank_account"
  | "e_wallet"
  | "investment_account"
  | "asset_account"
  | "liability";

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  currency: "IDR";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
