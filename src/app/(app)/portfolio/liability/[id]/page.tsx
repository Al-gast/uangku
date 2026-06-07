import type { Metadata } from "next";
import Link from "next/link";
import { LiabilityForm } from "@/components/portfolio/liability-form";
import { getPortfolioLiability } from "@/lib/portfolio/data";

export const metadata: Metadata = {
  title: "Edit Hutang",
};

export default async function EditLiabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const liability = await getPortfolioLiability(id);

  return (
    <>
      <Link
        href="/portfolio"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Kembali
      </Link>
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-[-0.04em]">
          Edit Hutang
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Perbarui total atau sisa hutang kamu.
        </p>
      </header>
      <LiabilityForm liability={liability} />
    </>
  );
}
