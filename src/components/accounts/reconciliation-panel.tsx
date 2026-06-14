"use client";

import { useMemo, useState } from "react";
import { MoneyText } from "@/components/ui/money-text";
import { ThemedNumberInput } from "@/components/ui/themed-number-input";

function parseCurrencyInput(value: string) {
  const rawValue = value.trim();

  if (!rawValue) {
    return null;
  }

  const normalized = rawValue
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
}

export function ReconciliationPanel({
  currentBalance,
}: {
  currentBalance: number;
}) {
  const [realBalanceInput, setRealBalanceInput] = useState("");
  const realBalance = useMemo(
    () => parseCurrencyInput(realBalanceInput),
    [realBalanceInput],
  );
  const difference =
    realBalance === null ? null : realBalance - currentBalance;
  const absoluteDifference = Math.abs(difference ?? 0);
  const hasDifference = difference !== null && difference !== 0;
  const statusClassName =
    difference === null
      ? "text-muted"
      : difference === 0
        ? "text-income"
        : "text-expense";
  const statusCopy =
    difference === null
      ? "Isi saldo asli untuk melihat selisih."
      : difference === 0
        ? "Saldo UangKu sudah cocok dengan saldo asli."
        : difference > 0
          ? "Saldo asli lebih besar. Cek pemasukan atau transfer masuk yang belum dicatat."
          : "Saldo UangKu lebih besar. Cek pengeluaran atau transfer keluar yang belum dicatat.";

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Cek saldo asli</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Bandingkan saldo account asli dengan saldo di UangKu.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
            hasDifference
              ? "bg-expense/10 text-expense"
              : "bg-income/10 text-income"
          }`}
        >
          {hasDifference ? "Selisih" : "Cek"}
        </span>
      </div>

      <ThemedNumberInput
        label="Saldo asli saat ini"
        value={realBalanceInput}
        onChange={setRealBalanceInput}
        placeholder="0"
        prefix="Rp"
        textSize="lg"
      />

      <div className="mt-4 rounded-control bg-surface-muted p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted">Selisih</span>
          {difference === null ? (
            <span className="font-bold text-muted">-</span>
          ) : (
            <MoneyText
              value={absoluteDifference}
              sign={difference > 0 ? "+" : difference < 0 ? "-" : ""}
              className={`font-extrabold ${statusClassName}`}
            />
          )}
        </div>
        <p className={`mt-2 text-xs leading-5 ${statusClassName}`}>
          {statusCopy}
        </p>
      </div>
    </section>
  );
}
