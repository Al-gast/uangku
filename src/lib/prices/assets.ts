export type SupportedCryptoId = "bitcoin" | "ethereum";

type CryptoAssetIdentity = {
  type: string;
  name: string;
  unit: string | null;
};

export function getSupportedCryptoId(
  asset: CryptoAssetIdentity,
): SupportedCryptoId | null {
  if (asset.type !== "crypto") {
    return null;
  }

  const unit = asset.unit?.trim().toUpperCase();
  const name = asset.name.trim().toLowerCase();

  if (unit === "BTC" || /\b(bitcoin|btc)\b/.test(name)) {
    return "bitcoin";
  }

  if (unit === "ETH" || /\b(ethereum|eth)\b/.test(name)) {
    return "ethereum";
  }

  return null;
}
