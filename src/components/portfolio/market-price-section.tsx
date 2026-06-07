"use client";

import { useState, useTransition } from "react";
import {
  applyMarketPrice,
  previewMarketPrice,
  type MarketPricePreview,
} from "@/app/(app)/portfolio/actions";
import { MoneyText } from "@/components/ui/money-text";
import { getSupportedCryptoId } from "@/lib/prices/assets";

type MarketPriceSectionProps = {
  asset: {
    id: string;
    name: string;
    type: string;
    unit: string | null;
    unitPriceUpdatedAt: string | null;
  };
  onApplied: (result: {
    unitPrice: number;
    currentValue: number;
  }) => void;
};

function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 8,
  }).format(value);
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function MarketPriceSection({
  asset,
  onApplied,
}: MarketPriceSectionProps) {
  const [preview, setPreview] = useState<MarketPricePreview | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(
    asset.unitPriceUpdatedAt,
  );
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!getSupportedCryptoId(asset)) {
    return null;
  }

  function handlePreview() {
    setError(null);
    setIsApplying(false);
    startTransition(async () => {
      const result = await previewMarketPrice(asset.id);
      setPreview(result.preview);
      setError(result.error);
    });
  }

  function handleApply() {
    setError(null);
    setIsApplying(true);
    startTransition(async () => {
      const result = await applyMarketPrice(asset.id);

      if (!result.preview) {
        setError(result.error);
        setIsApplying(false);
        return;
      }

      onApplied({
        unitPrice: result.preview.unitPrice,
        currentValue: result.preview.calculatedValue,
      });
      setLastUpdatedAt(result.preview.updatedAt);
      setPreview(null);
      setIsApplying(false);
    });
  }

  const difference = preview
    ? preview.calculatedValue - preview.currentValue
    : 0;

  return (
    <section className="space-y-3 rounded-card border border-border bg-surface-muted p-4">
      <div>
        <h2 className="text-sm font-bold">Harga pasar</h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Ambil harga BTC atau ETH terbaru dan periksa nilainya sebelum
          diterapkan.
        </p>
        {lastUpdatedAt && (
          <p className="mt-1 text-xs text-muted">
            Terakhir update: {formatUpdatedAt(lastUpdatedAt)}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-3 text-xs leading-5 text-expense">
          {error}
        </p>
      )}

      {!preview && (
        <button
          type="button"
          onClick={handlePreview}
          disabled={pending}
          className="flex min-h-11 w-full items-center justify-center rounded-control border border-accent/30 bg-accent-soft px-4 text-sm font-bold text-accent transition hover:border-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && !isApplying ? "Mengambil harga..." : "Update Harga"}
        </button>
      )}

      {preview && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground">
            Harga terbaru ditemukan
          </p>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted">Harga terbaru</dt>
              <dd className="mt-1 font-bold">
                <MoneyText value={preview.unitPrice} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Jumlah unit</dt>
              <dd className="mt-1 font-bold">
                {formatQuantity(preview.quantity)} {asset.unit ?? ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Nilai baru</dt>
              <dd className="mt-1 font-bold">
                <MoneyText value={preview.calculatedValue} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Nilai saat ini</dt>
              <dd className="mt-1 font-bold">
                <MoneyText value={preview.currentValue} />
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Selisih</dt>
              <dd className="mt-1 font-bold">
                <MoneyText
                  value={Math.abs(difference)}
                  sign={difference > 0 ? "+" : difference < 0 ? "-" : ""}
                />
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted">
            Data harga: {formatUpdatedAt(preview.updatedAt)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={pending}
              className="min-h-11 rounded-control border border-border bg-surface px-4 text-sm font-bold text-muted disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={pending}
              className="min-h-11 rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {pending && isApplying ? "Menerapkan..." : "Pakai Harga Ini"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
