"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createLiability,
  deleteLiability,
  updateLiability,
  type PortfolioActionState,
} from "@/app/(app)/portfolio/actions";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import type { PortfolioLiabilityItem } from "@/lib/portfolio/types";

const initialState: PortfolioActionState = { error: null };
const inputClassName =
  "min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Menyimpan..."
        : editing
          ? "Simpan Perubahan"
          : "Simpan Hutang"}
    </button>
  );
}

function MoneyField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <div className="flex min-h-14 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
        <span className="mr-2 font-bold text-muted">Rp</span>
        <input
          name={name}
          inputMode="decimal"
          required
          defaultValue={defaultValue ?? ""}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-right text-xl font-bold outline-none"
        />
      </div>
    </label>
  );
}

export function LiabilityForm({
  liability,
}: {
  liability?: PortfolioLiabilityItem;
}) {
  const editing = Boolean(liability);
  const [state, formAction] = useActionState(
    editing ? updateLiability : createLiability,
    initialState,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        {liability && (
          <input
            type="hidden"
            name="liability_id"
            value={liability.id}
          />
        )}

        {state.error && (
          <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
            {state.error}
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-bold">Nama hutang</span>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={liability?.name ?? ""}
            placeholder="cth: Hutang ke Andi"
            className={inputClassName}
          />
        </label>

        <MoneyField
          name="amount"
          label="Total hutang awal"
          defaultValue={liability?.amount}
        />
        <MoneyField
          name="remaining_amount"
          label="Sisa hutang"
          defaultValue={liability?.remainingAmount}
        />

        <label className="block">
          <span className="mb-2 block text-sm font-bold">
            Tanggal jatuh tempo (opsional)
          </span>
          <input
            name="due_date"
            type="date"
            defaultValue={liability?.dueDate ?? ""}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">
            Catatan (opsional)
          </span>
          <textarea
            name="notes"
            maxLength={1000}
            rows={4}
            defaultValue={liability?.notes ?? ""}
            className={`${inputClassName} py-3`}
          />
        </label>

        <SubmitButton editing={editing} />
        <Link
          href="/portfolio"
          className="flex min-h-11 items-center justify-center font-bold text-muted"
        >
          Batal
        </Link>
      </form>

      {liability && (
        <ConfirmActionForm
          submitAction={deleteLiability}
          fields={[{ name: "liability_id", value: liability.id }]}
          buttonLabel="Hapus Hutang"
          title="Hapus hutang ini?"
          description="Data ini tidak bisa dikembalikan setelah dihapus."
          confirmLabel="Hapus Hutang"
          buttonClassName="min-h-12 w-full rounded-control border border-expense/30 bg-expense/10 font-bold text-expense transition active:scale-[0.98]"
        />
      )}
    </div>
  );
}
