import type { Metadata } from "next";
import Link from "next/link";
import { restoreDefaultCategories } from "@/app/(app)/settings/categories/actions";
import { CategoryForm } from "@/components/settings/category-form";
import { CategoryList } from "@/components/settings/category-list";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { getSettingsCategories } from "@/lib/categories/data";

export const metadata: Metadata = {
  title: "Kategori",
};

type CategoriesPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const [{ success, error: queryError }, result] = await Promise.all([
    searchParams,
    getSettingsCategories(),
  ]);

  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Settings
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Master Kategori
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Kategori
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Kelola kategori, tipe sistem, dan alias chat untuk cashflow, budget,
          laporan, dan input cepat.
        </p>
      </header>

      {success && (
        <p className="mb-5 rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
          {success}
        </p>
      )}
      {(queryError || result.error) && (
        <p className="mb-5 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {queryError || result.error}
        </p>
      )}

      <section className="mb-6 rounded-card border border-accent/25 bg-accent-soft p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-accent-strong">
              Pulihkan kategori bawaan
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Aktifkan kembali kategori default tanpa menghapus kategori custom.
            </p>
          </div>
          <ConfirmActionForm
            submitAction={restoreDefaultCategories}
            fields={[]}
            buttonLabel="Pulihkan"
            title="Pulihkan kategori bawaan?"
            description="Kategori default yang pernah dinonaktifkan akan aktif lagi. Kategori custom dan histori transaksi tidak akan dihapus."
            confirmLabel="Pulihkan"
            buttonClassName="min-h-11 shrink-0 rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
            confirmButtonClassName="min-h-11 rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
          />
        </div>
      </section>

      <section className="mb-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-bold">Tambah kategori</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Buat kategori custom untuk pemasukan, pengeluaran, transfer,
          investasi, atau hutang.
        </p>
        <div className="mt-4">
          <CategoryForm />
        </div>
      </section>

      <CategoryList categories={result.categories} />
    </>
  );
}
