import type { Metadata } from "next";
import Link from "next/link";
import { AssetForm } from "@/components/portfolio/asset-form";
import { portfolioAssetTypeMeta } from "@/constants/portfolio";
import { getPortfolioAsset } from "@/lib/portfolio/data";

export const metadata: Metadata = {
  title: "Edit Aset",
};

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await getPortfolioAsset(id);
  const meta = portfolioAssetTypeMeta[asset.type];

  return (
    <>
      <Link
        href="/portfolio"
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Kembali
      </Link>
      <header className="mb-7">
        <p className="text-2xl">{meta.icon}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Edit Aset
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{meta.label}</p>
      </header>
      <AssetForm type={asset.type} asset={asset} />
    </>
  );
}
