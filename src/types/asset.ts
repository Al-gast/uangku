export type AssetType =
  | "cash"
  | "rdpu"
  | "rdpt"
  | "gold"
  | "crypto"
  | "stock"
  | "other_asset"
  | "liability";

export type Asset = {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  type: AssetType;
  platform: string | null;
  currency: "IDR";
  quantity: number | null;
  unit: string | null;
  total_cost: number | null;
  current_value: number;
  auto_price_enabled: boolean;
  last_price: number | null;
  last_price_updated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AssetSnapshot = {
  id: string;
  user_id: string;
  asset_id: string;
  value: number;
  quantity: number | null;
  price: number | null;
  snapshot_date: string;
  created_at: string;
};
