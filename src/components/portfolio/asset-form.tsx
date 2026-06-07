"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAsset,
  deleteAsset,
  updateAsset,
  type PortfolioActionState,
} from "@/app/(app)/portfolio/actions";
import { portfolioAssetTypeMeta } from "@/constants/portfolio";
import type {
  PortfolioAssetItem,
  PortfolioAssetType,
} from "@/lib/portfolio/types";

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
          : "Simpan Aset"}
    </button>
  );
}

function MoneyField({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <div className="flex min-h-14 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
        <span className="mr-2 font-bold text-muted">Rp</span>
        <input
          name={name}
          inputMode="decimal"
          required={required}
          defaultValue={defaultValue ?? ""}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-right text-xl font-bold outline-none"
        />
      </div>
    </label>
  );
}

export function AssetForm({
  type,
  asset,
}: {
  type: PortfolioAssetType;
  asset?: PortfolioAssetItem;
}) {
  const editing = Boolean(asset);
  const meta = portfolioAssetTypeMeta[type];
  const [state, formAction] = useActionState(
    editing ? updateAsset : createAsset,
    initialState,
  );
  const showPlatform = type !== "other_asset";
  const showTotalCost = type === "rdpu" || type === "rdpt";
  const showQuantity = type === "gold" || type === "crypto";
  const showNotes = type === "other_asset";

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="type" value={type} />
        {asset && <input type="hidden" name="asset_id" value={asset.id} />}

        {state.error && (
          <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
            {state.error}
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-bold">Nama aset</span>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={asset?.name ?? ""}
            placeholder={meta.namePlaceholder}
            className={inputClassName}
          />
        </label>

        {showPlatform && (
          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Platform (opsional)
            </span>
            <input
              name="platform"
              maxLength={120}
              defaultValue={asset?.platform ?? ""}
              placeholder={meta.platformPlaceholder}
              className={inputClassName}
            />
          </label>
        )}

        {showTotalCost && (
          <MoneyField
            name="total_cost"
            label="Total modal (opsional)"
            defaultValue={asset?.totalCost}
          />
        )}

        {showQuantity && (
          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              {type === "gold" ? "Berat" : "Jumlah unit"} (opsional)
            </span>
            <div className="flex min-h-12 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
              <input
                name="quantity"
                inputMode="decimal"
                defaultValue={asset?.quantity ?? ""}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              {type === "gold" && (
                <span className="ml-2 text-sm font-semibold text-muted">
                  gram
                </span>
              )}
            </div>
          </label>
        )}

        {showNotes && (
          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Catatan (opsional)
            </span>
            <textarea
              name="notes"
              maxLength={1000}
              rows={4}
              defaultValue={asset?.notes ?? ""}
              className={`${inputClassName} py-3`}
            />
          </label>
        )}

        <MoneyField
          name="current_value"
          label="Nilai saat ini"
          defaultValue={asset?.currentValue}
          required
        />

        <SubmitButton editing={editing} />
        <Link
          href="/portfolio"
          className="flex min-h-11 items-center justify-center font-bold text-muted"
        >
          Batal
        </Link>
      </form>

      {asset && (
        <form
          action={deleteAsset}
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Yakin hapus ${asset.name}? Data ini tidak bisa dikembalikan.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="asset_id" value={asset.id} />
          <button className="min-h-12 w-full rounded-control border border-expense/30 bg-expense/10 font-bold text-expense transition active:scale-[0.98]">
            Hapus Aset
          </button>
        </form>
      )}
    </div>
  );
}
