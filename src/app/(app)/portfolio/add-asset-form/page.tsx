import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AssetForm } from "@/components/portfolio/asset-form";
import { portfolioAssetTypeMeta } from "@/constants/portfolio";
import { isPortfolioAssetType } from "@/lib/portfolio/validation";

export const metadata: Metadata = {
  title: "Form Aset",
};

type AddAssetFormPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function AddAssetFormPage({
  searchParams,
}: AddAssetFormPageProps) {
  const { type } = await searchParams;

  if (!type || !isPortfolioAssetType(type)) {
    redirect("/portfolio/add-asset");
  }

  const meta = portfolioAssetTypeMeta[type];

  return (
    <>
      <Link
        href="/portfolio/add-asset"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Kembali
      </Link>
      <header className="mb-7">
        <p className="text-2xl">{meta.icon}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Tambah {meta.label}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {meta.description}
        </p>
      </header>
      <AssetForm type={type} />
    </>
  );
}
