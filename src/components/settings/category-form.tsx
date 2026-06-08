"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createCategory,
  updateCategory,
  type CategoryActionState,
} from "@/app/(app)/settings/categories/actions";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  categoryGroupOptions,
  categoryTypeLabels,
  type ManageableCategoryGroup,
  type ManageableCategoryType,
  type SettingsCategoryItem,
} from "@/lib/categories/types";

const initialState: CategoryActionState = { error: null };

const categoryTypeOptions: Array<{
  value: ManageableCategoryType;
  label: string;
}> = [
  { value: "expense", label: categoryTypeLabels.expense },
  { value: "income", label: categoryTypeLabels.income },
];

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Menyimpan..."
        : isEditing
          ? "Simpan kategori"
          : "+ Tambah Kategori"}
    </button>
  );
}

export function CategoryForm({
  category,
}: {
  category?: SettingsCategoryItem;
}) {
  const isEditing = Boolean(category);
  const action = isEditing ? updateCategory : createCategory;
  const [state, formAction] = useActionState(action, initialState);
  const [transactionType, setTransactionType] =
    useState<ManageableCategoryType>(
      category?.transactionType ?? "expense",
    );
  const [group, setGroup] = useState<ManageableCategoryGroup>(
    category?.group ?? "primer",
  );

  function changeType(nextType: string) {
    const typedNextType = nextType as ManageableCategoryType;
    setTransactionType(typedNextType);
    setGroup(typedNextType === "income" ? "income" : "primer");
  }

  return (
    <form action={formAction} className="space-y-4">
      {category && (
        <input type="hidden" name="category_id" value={category.id} />
      )}
      {isEditing && (
        <input
          type="hidden"
          name="transaction_type"
          value={transactionType}
        />
      )}

      {state.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {state.error}
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Nama kategori</span>
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={category?.name ?? ""}
          placeholder="Contoh: Obat, Bonus"
          className="min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </label>

      {isEditing ? (
        <div>
          <span className="mb-2 block text-sm font-bold">Tipe</span>
          <div className="flex min-h-12 items-center rounded-control border border-border bg-surface-muted px-4 text-sm font-bold text-muted">
            {categoryTypeLabels[transactionType]}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            Tipe kategori tidak bisa diubah setelah dibuat.
          </p>
        </div>
      ) : (
        <ThemedSelect
          label="Tipe"
          name="transaction_type"
          required
          value={transactionType}
          onChange={changeType}
          options={categoryTypeOptions}
        />
      )}

      <ThemedSelect
        label="Grup"
        name="group"
        required
        value={group}
        onChange={(nextGroup) =>
          setGroup(nextGroup as ManageableCategoryGroup)
        }
        options={categoryGroupOptions}
        helperText="Grup membantu merapikan kategori di laporan."
      />

      <SubmitButton isEditing={isEditing} />
    </form>
  );
}
