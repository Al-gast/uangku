import "server-only";

import type { SupportedCryptoId } from "@/lib/prices/assets";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const PRICE_CACHE_SECONDS = 15 * 60;

type CoinGeckoPriceResponse = Record<
  string,
  {
    idr?: number;
    last_updated_at?: number;
  }
>;

export type LatestMarketPrice = {
  unitPrice: number;
  updatedAt: string;
};

export async function getLatestCryptoPrice(
  coinId: SupportedCryptoId,
): Promise<LatestMarketPrice> {
  const url = new URL(COINGECKO_API_URL);
  url.searchParams.set("ids", coinId);
  url.searchParams.set("vs_currencies", "idr");
  url.searchParams.set("include_last_updated_at", "true");
  url.searchParams.set("precision", "full");

  const apiKey = process.env.COINGECKO_API_KEY?.trim();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "x-cg-demo-api-key": apiKey } : {}),
    },
    next: { revalidate: PRICE_CACHE_SECONDS },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error("CoinGecko price request failed.");
  }

  const data = (await response.json()) as CoinGeckoPriceResponse;
  const price = data[coinId]?.idr;
  const updatedAt = data[coinId]?.last_updated_at;

  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error("CoinGecko returned an invalid price.");
  }

  return {
    unitPrice: price,
    updatedAt:
      typeof updatedAt === "number" && Number.isFinite(updatedAt)
        ? new Date(updatedAt * 1_000).toISOString()
        : new Date().toISOString(),
  };
}
