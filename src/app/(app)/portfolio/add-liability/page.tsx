import type { Metadata } from "next";
import Link from "next/link";
import { LiabilityForm } from "@/components/portfolio/liability-form";

export const metadata: Metadata = {
  title: "Tambah Hutang",
};

export default function AddLiabilityPage() {
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
          Tambah Hutang
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Catat hutang atau kewajiban baru.
        </p>
      </header>
      <LiabilityForm />
    </>
  );
}
