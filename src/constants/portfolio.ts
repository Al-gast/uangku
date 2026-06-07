import type { PortfolioAssetType } from "@/lib/portfolio/types";

export const portfolioAssetTypeMeta: Record<
  PortfolioAssetType,
  {
    label: string;
    icon: string;
    description: string;
    namePlaceholder: string;
    platformPlaceholder?: string;
  }
> = {
  rdpu: {
    label: "Reksadana Pasar Uang (RDPU)",
    icon: "📈",
    description: "Catat reksadana pasar uang kamu.",
    namePlaceholder: "cth: RDPU BNI-AM",
    platformPlaceholder: "cth: Bibit",
  },
  rdpt: {
    label: "Reksadana Pend. Tetap (RDPT)",
    icon: "📈",
    description: "Catat reksadana pendapatan tetap kamu.",
    namePlaceholder: "cth: RDPT Sucorinvest",
    platformPlaceholder: "cth: Bibit",
  },
  gold: {
    label: "Emas",
    icon: "🪙",
    description: "Catat nilai emas yang kamu miliki.",
    namePlaceholder: "cth: Emas Antam 5gr",
    platformPlaceholder: "cth: Antam",
  },
  crypto: {
    label: "Crypto / Bitcoin",
    icon: "₿",
    description: "Catat aset crypto secara manual.",
    namePlaceholder: "cth: Bitcoin",
    platformPlaceholder: "cth: Pintu",
  },
  stock: {
    label: "Saham Indonesia",
    icon: "📊",
    description: "Catat total nilai saham kamu.",
    namePlaceholder: "cth: BBCA",
    platformPlaceholder: "cth: Stockbit",
  },
  other_asset: {
    label: "Aset lainnya",
    icon: "📦",
    description: "Catat aset lain yang punya nilai.",
    namePlaceholder: "cth: Motor Honda Vario",
  },
};
