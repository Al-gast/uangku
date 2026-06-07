import type { Metadata } from "next";
import { AssetAllocation } from "@/components/portfolio/asset-allocation";
import { AssetList } from "@/components/portfolio/asset-list";
import { PortfolioHeroCard } from "@/components/portfolio/hero-card";
import { LiabilityList } from "@/components/portfolio/liability-list";
import { PortfolioError } from "@/components/portfolio/portfolio-error";
import { PageIntro } from "@/components/ui/page-intro";
import { getPortfolioData } from "@/lib/portfolio/data";

export const metadata: Metadata = {
  title: "Portfolio",
};

type PortfolioPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const [{ success, error }, data] = await Promise.all([
    searchParams,
    getPortfolioData(),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Kekayaan"
        title="Portfolio"
        description="Pantau aset, hutang, dan net worth kamu."
      />

      {success && (
        <p className="rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
          {success}
        </p>
      )}
      {error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {error}
        </p>
      )}

      {data.error ? (
        <PortfolioError />
      ) : (
        <>
          <PortfolioHeroCard
            netWorth={data.netWorth}
            totalAsset={data.totalAsset}
            totalLiability={data.totalLiability}
          />
          <AssetAllocation
            allocation={data.allocation}
            totalAsset={data.totalAsset}
          />
          <AssetList accounts={data.accounts} assets={data.assets} />
          <LiabilityList
            liabilities={data.liabilities}
            totalLiability={data.totalLiability}
          />
        </>
      )}
    </div>
  );
}
