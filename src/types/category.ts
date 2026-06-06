export type CategoryGroup =
  | "primer"
  | "sekunder"
  | "lifestyle"
  | "transport"
  | "tagihan"
  | "kesehatan"
  | "pendidikan"
  | "investasi"
  | "transfer"
  | "income"
  | "debt"
  | "other";

export type CategoryTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "debt";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  group: CategoryGroup;
  transaction_type: CategoryTransactionType;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
