import type { ReactNode } from "react";
import {
  deleteCategory,
  setCategoryActive,
} from "@/app/(app)/settings/categories/actions";
import { CategoryForm } from "@/components/settings/category-form";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import {
  categoryGroupLabels,
  categoryTypeLabels,
  type ManageableCategoryType,
  type SettingsCategoryItem,
} from "@/lib/categories/types";

const categorySections: Array<{
  type: ManageableCategoryType;
  title: string;
}> = [
  { type: "expense", title: "Pengeluaran" },
  { type: "income", title: "Pemasukan" },
  { type: "transfer", title: "Transfer" },
  { type: "investment", title: "Investasi" },
  { type: "debt", title: "Hutang" },
];

export function CategoryList({
  categories,
}: {
  categories: SettingsCategoryItem[];
}) {
  if (categories.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-accent/40 bg-surface p-7 text-center shadow-card">
        <h2 className="font-bold">Belum ada kategori.</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tambahkan kategori pemasukan atau pengeluaran yang sesuai kebiasaanmu.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {categorySections.map((section) => {
        const sectionCategories = categories.filter(
          (category) => category.transactionType === section.type,
        );

        return (
          <section key={section.type}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <span className="text-xs font-semibold text-muted">
                {sectionCategories.length} kategori
              </span>
            </div>

            {sectionCategories.length === 0 ? (
              <div className="rounded-card border border-border bg-surface p-5 text-sm text-muted shadow-card">
                Belum ada kategori {section.title.toLowerCase()}.
              </div>
            ) : (
              <div className="space-y-3">
                {sectionCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CategoryCard({
  category,
}: {
  category: SettingsCategoryItem;
}) {
  const hasHistory =
    category.transactionCount > 0 ||
    category.budgetCount > 0 ||
    category.adminFeeReferenceCount > 0;

  return (
    <article
      className={`rounded-card border bg-surface p-5 shadow-card ${
        category.isActive ? "border-border" : "border-border opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{categoryTypeLabels[category.transactionType]}</Badge>
            <Badge>{categoryGroupLabels[category.group]}</Badge>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                category.isActive
                  ? "bg-income/10 text-income"
                  : "bg-surface-muted text-muted"
              }`}
            >
              {category.isActive ? "Aktif" : "Nonaktif"}
            </span>
            {category.isSystem && (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-bold text-accent-strong">
                Sistem
              </span>
            )}
            {category.isDefault && !category.isSystem && (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[0.65rem] font-bold text-muted">
                Bawaan
              </span>
            )}
          </div>
          <h3 className="mt-3 truncate font-bold">{category.name}</h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {category.transactionCount} transaksi · {category.budgetCount}{" "}
            budget
            {category.adminFeeReferenceCount > 0
              ? ` · ${category.adminFeeReferenceCount} biaya admin`
              : ""}
          </p>
          {category.aliases.length > 0 && (
            <p className="mt-2 break-words text-xs leading-5 text-muted">
              Alias: {category.aliases.join(", ")}
            </p>
          )}
        </div>
      </div>

      {category.isSystem ? (
        <p className="mt-4 rounded-control bg-surface-muted p-3 text-xs leading-5 text-muted">
          Kategori ini dipakai sistem, jadi tidak bisa diubah, dinonaktifkan,
          atau dihapus.
        </p>
      ) : (
        <>
          <details className="mt-4 rounded-card border border-border bg-background p-4">
            <summary className="cursor-pointer text-sm font-bold text-accent-strong">
              Edit kategori
            </summary>
            <div className="mt-4">
              <CategoryForm category={category} />
            </div>
          </details>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-4 border-t border-border pt-3">
            <form action={setCategoryActive}>
              <input type="hidden" name="category_id" value={category.id} />
              <input
                type="hidden"
                name="is_active"
                value={category.isActive ? "false" : "true"}
              />
              <button
                type="submit"
                className="text-sm font-bold text-muted"
              >
                {category.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </form>
            {!category.isDefault && (
              <ConfirmActionForm
                submitAction={deleteCategory}
                fields={[{ name: "category_id", value: category.id }]}
                buttonLabel="Hapus"
                title="Hapus kategori ini?"
                description="Kategori hanya bisa dihapus jika belum punya transaksi, budget, atau histori biaya admin. Kalau sudah punya histori, nonaktifkan saja agar data lama tetap aman."
                confirmLabel="Hapus Kategori"
              />
            )}
          </div>

          {(hasHistory || category.isDefault) && (
            <p className="mt-3 rounded-control bg-surface-muted p-3 text-xs leading-5 text-muted">
              {category.isDefault
                ? "Kategori bawaan tidak bisa dihapus, tapi bisa dinonaktifkan jika tidak dipakai."
                : "Kategori ini sudah punya histori, jadi tidak bisa dihapus. Kamu bisa menonaktifkannya agar tidak muncul di pilihan baru."}
            </p>
          )}
        </>
      )}
    </article>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-bold text-accent-strong">
      {children}
    </span>
  );
}
