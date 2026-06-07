"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type Ref } from "react";
import { useFormStatus } from "react-dom";
import {
  createAsset,
  deleteAsset,
  updateAsset,
  type PortfolioActionState,
} from "@/app/(app)/portfolio/actions";
import { MarketPriceSection } from "@/components/portfolio/market-price-section";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { portfolioAssetTypeMeta } from "@/constants/portfolio";
import type {
  PortfolioAssetItem,
  PortfolioAssetType,
} from "@/lib/portfolio/types";

const initialState: PortfolioActionState = { error: null };
const inputClassName =
  "min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft";
const unitDefaults: Partial<Record<PortfolioAssetType, string>> = {
  crypto: "BTC",
  gold: "gram",
  stock: "lot",
};
const quantityHelpers: Partial<Record<PortfolioAssetType, string>> = {
  crypto: "Contoh: 0.001 BTC",
  gold: "Contoh: 2 gram",
  stock: "Contoh: 10 lot",
};

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
  inputRef,
  masked = false,
  onValueChange,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  required?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  masked?: boolean;
  onValueChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <div className="flex min-h-14 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
        <span className="mr-2 font-bold text-muted">Rp</span>
        <input
          ref={inputRef}
          name={name}
          type={masked ? "password" : "text"}
          inputMode="decimal"
          required={required}
          defaultValue={defaultValue ?? ""}
          onChange={(event) => onValueChange?.(event.target.value)}
          placeholder="0"
          autoComplete="off"
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
  const { privacyEnabled } = usePrivacy();
  const currentValueRef = useRef<HTMLInputElement>(null);
  const unitPriceRef = useRef<HTMLInputElement>(null);
  const [quantityValue, setQuantityValue] = useState(
    String(asset?.quantity ?? ""),
  );
  const [unitPriceValue, setUnitPriceValue] = useState(
    String(asset?.unitPrice ?? ""),
  );
  const showPlatform = type !== "other_asset";
  const showTotalCost = type === "rdpu" || type === "rdpt";
  const showUnitTracking =
    type === "crypto" ||
    type === "gold" ||
    type === "stock" ||
    type === "rdpu" ||
    type === "rdpt";
  const showUnitPrice =
    type === "crypto" ||
    type === "gold" ||
    type === "stock" ||
    ((type === "rdpu" || type === "rdpt") &&
      quantityValue.trim().length > 0);
  const showNotes = type === "other_asset";

  function calculateCurrentValue() {
    const quantity = Number(quantityValue.replace(",", "."));
    const unitPrice = Number(
      unitPriceValue
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    );
    const calculated = Math.round(quantity * unitPrice * 100) / 100;

    if (
      !currentValueRef.current ||
      !Number.isFinite(calculated) ||
      calculated < 0
    ) {
      return;
    }

    currentValueRef.current.value = String(calculated);
  }

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

        {showUnitTracking && (
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Jumlah unit (opsional)
              </span>
              <input
                name="quantity"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                defaultValue={asset?.quantity ?? ""}
                onChange={(event) => setQuantityValue(event.target.value)}
                placeholder="0"
                className={inputClassName}
              />
              {quantityHelpers[type] && (
                <span className="mt-2 block text-xs text-muted">
                  {quantityHelpers[type]}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">Satuan</span>
              <input
                name="unit"
                maxLength={20}
                defaultValue={asset?.unit ?? unitDefaults[type] ?? ""}
                placeholder="unit"
                className={inputClassName}
              />
            </label>
          </div>
        )}

        {showUnitPrice && (
          <div className="space-y-3">
            <MoneyField
              name="unit_price"
              label="Harga per unit (opsional)"
              defaultValue={asset?.unitPrice}
              inputRef={unitPriceRef}
              masked={privacyEnabled}
              onValueChange={setUnitPriceValue}
            />
            <button
              type="button"
              onClick={calculateCurrentValue}
              disabled={
                quantityValue.trim().length === 0 ||
                unitPriceValue.trim().length === 0
              }
              className="flex min-h-11 w-full items-center justify-center rounded-control border border-accent/30 bg-accent-soft px-4 text-sm font-bold text-accent transition hover:border-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hitung nilai saat ini
            </button>
          </div>
        )}

        {asset && (
          <MarketPriceSection
            asset={asset}
            onApplied={({ unitPrice, currentValue }) => {
              setUnitPriceValue(String(unitPrice));

              if (unitPriceRef.current) {
                unitPriceRef.current.value = String(unitPrice);
              }

              if (currentValueRef.current) {
                currentValueRef.current.value = String(currentValue);
              }
            }}
          />
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
          inputRef={currentValueRef}
          required
        />
        <p className="-mt-3 text-xs leading-5 text-muted">
          Nilai saat ini tetap bisa kamu ubah manual.
        </p>

        {showUnitTracking && (
          <p className="rounded-control border border-border bg-surface-muted p-3 text-xs leading-5 text-muted">
            Transaksi investasi belum otomatis mengubah jumlah unit.
          </p>
        )}

        <SubmitButton editing={editing} />
        <Link
          href="/portfolio"
          className="flex min-h-11 items-center justify-center font-bold text-muted"
        >
          Batal
        </Link>
      </form>

      {asset && (
        <ConfirmActionForm
          submitAction={deleteAsset}
          fields={[{ name: "asset_id", value: asset.id }]}
          buttonLabel="Hapus Aset"
          title="Hapus aset ini?"
          description="Aset yang punya histori transaksi investasi mungkin tidak bisa dihapus agar net worth tetap konsisten."
          confirmLabel="Hapus Aset"
          buttonClassName="min-h-12 w-full rounded-control border border-expense/30 bg-expense/10 font-bold text-expense transition active:scale-[0.98]"
        />
      )}
    </div>
  );
}
