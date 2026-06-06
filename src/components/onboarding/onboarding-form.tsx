"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeOnboarding,
  type OnboardingActionState,
} from "@/app/onboarding/actions";
import {
  accountPresets,
  accountTypeOptions,
  onboardingBudgetCategories,
  type OnboardingBudgetCategory,
} from "@/constants/onboarding";
import type { AccountType } from "@/types/account";

type AccountDraft = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: string;
};

type BudgetDraft = Record<
  OnboardingBudgetCategory,
  { enabled: boolean; amount: string }
>;

const stepContent = [
  {
    title: "Tambahkan akun uang kamu",
    subtitle:
      "Pisahkan rekening, e-wallet, cash, dan akun investasi supaya saldo lebih akurat.",
  },
  {
    title: "Isi saldo awal",
    subtitle:
      "Saldo awal membantu UangKu menghitung sisa uang dan cashflow kamu dengan benar.",
  },
  {
    title: "Buat budget awal",
    subtitle: "Boleh diisi sekarang atau nanti dari Settings.",
  },
];

const initialActionState: OnboardingActionState = {
  error: null,
};

function createDraft(
  name = "",
  type: AccountType = "bank_account",
  id = crypto.randomUUID(),
): AccountDraft {
  return {
    id,
    name,
    type,
    initialBalance: "",
  };
}

function createBudgetDraft(): BudgetDraft {
  return Object.fromEntries(
    onboardingBudgetCategories.map((category) => [
      category,
      { enabled: false, amount: "" },
    ]),
  ) as BudgetDraft;
}

function isNumericInput(value: string) {
  if (!value.trim()) {
    return true;
  }

  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number.isFinite(Number(normalized));
}

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-3">
      <button
        type="submit"
        name="budget_mode"
        value="save"
        disabled={pending}
        className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Selesai dan buka Dashboard"}
      </button>
      <button
        type="submit"
        name="budget_mode"
        value="skip"
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-control border border-border bg-surface px-5 font-bold text-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        Lewati budget
      </button>
    </div>
  );
}

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState<AccountDraft[]>([
    createDraft("", "bank_account", "initial-account"),
  ]);
  const [budgets, setBudgets] = useState<BudgetDraft>(createBudgetDraft);
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionState, formAction] = useActionState(
    completeOnboarding,
    initialActionState,
  );

  const accountsPayload = useMemo(
    () =>
      JSON.stringify(
        accounts.map((account) => ({
          name: account.name,
          type: account.type,
          initial_balance: account.initialBalance,
        })),
      ),
    [accounts],
  );

  const budgetsPayload = useMemo(
    () =>
      JSON.stringify(
        onboardingBudgetCategories.flatMap((category) =>
          budgets[category].enabled
            ? [{ category, amount: budgets[category].amount }]
            : [],
        ),
      ),
    [budgets],
  );

  function updateAccount(id: string, changes: Partial<AccountDraft>) {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id ? { ...account, ...changes } : account,
      ),
    );
  }

  function addPreset(name: string, type: AccountType) {
    setAccounts((current) => {
      const emptyIndex = current.findIndex(
        (account) => !account.name.trim() && !account.initialBalance,
      );

      if (emptyIndex >= 0) {
        return current.map((account, index) =>
          index === emptyIndex ? { ...account, name, type } : account,
        );
      }

      return [...current, createDraft(name, type)];
    });
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (accounts.length === 0) {
        return "Tambahkan minimal satu akun.";
      }

      if (accounts.some((account) => !account.name.trim())) {
        return "Nama setiap akun wajib diisi.";
      }
    }

    if (
      step === 1 &&
      accounts.some((account) => !isNumericInput(account.initialBalance))
    ) {
      return "Saldo awal harus berupa angka.";
    }

    return null;
  }

  function goNext() {
    const error = validateCurrentStep();
    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError(null);
    setStep((current) => Math.min(current + 1, 2));
  }

  const content = stepContent[step];

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="accounts_payload" value={accountsPayload} />
      <input type="hidden" name="budgets_payload" value={budgetsPayload} />

      <div className="mb-7 flex gap-2" aria-label={`Langkah ${step + 1} dari 3`}>
        {stepContent.map((item, index) => (
          <span
            key={item.title}
            className={`h-1.5 flex-1 rounded-full ${
              index <= step ? "bg-accent" : "bg-surface-muted"
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        Langkah {step + 1} dari 3
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
        {content.title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">{content.subtitle}</p>

      {(localError || actionState.error) && (
        <p className="mt-5 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {localError || actionState.error}
        </p>
      )}

      {step === 0 && (
        <div className="mt-7 space-y-5">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
              Pilihan cepat
            </p>
            <div className="flex flex-wrap gap-2">
              {accountPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => addPreset(preset.name, preset.type)}
                  className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="rounded-card border border-border bg-surface p-4 shadow-card"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold">Akun {index + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setAccounts((current) =>
                        current.filter((item) => item.id !== account.id),
                      )
                    }
                    className="text-xs font-bold text-expense"
                  >
                    Hapus
                  </button>
                </div>
                <input
                  value={account.name}
                  onChange={(event) =>
                    updateAccount(account.id, { name: event.target.value })
                  }
                  placeholder="Nama akun, misalnya BCA"
                  maxLength={100}
                  className="min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
                />
                <select
                  value={account.type}
                  onChange={(event) =>
                    updateAccount(account.id, {
                      type: event.target.value as AccountType,
                    })
                  }
                  className="mt-3 min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
                >
                  {accountTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAccounts((current) => [...current, createDraft()])}
            className="flex min-h-12 w-full items-center justify-center rounded-control border border-dashed border-accent bg-accent-soft px-4 font-bold text-accent-strong"
          >
            + Tambah akun lain
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-7 space-y-3">
          {accounts.map((account) => (
            <label
              key={account.id}
              className="block rounded-card border border-border bg-surface p-4 shadow-card"
            >
              <span className="font-bold">{account.name}</span>
              <span className="mt-1 block text-xs text-muted">
                Kosongkan jika saldonya Rp0
              </span>
              <div className="mt-3 flex min-h-12 items-center rounded-control border border-border bg-background px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                <span className="mr-2 text-sm font-bold text-muted">Rp</span>
                <input
                  value={account.initialBalance}
                  onChange={(event) =>
                    updateAccount(account.id, {
                      initialBalance: event.target.value,
                    })
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-right text-lg font-bold outline-none"
                />
              </div>
            </label>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="mt-7 space-y-3">
          {onboardingBudgetCategories.map((category) => {
            const budget = budgets[category];

            return (
              <div
                key={category}
                className="rounded-card border border-border bg-surface p-4 shadow-card"
              >
                <label className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block font-bold">{category}</span>
                    <span className="mt-1 block text-xs text-muted">
                      Budget bulanan
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={budget.enabled}
                    onChange={(event) =>
                      setBudgets((current) => ({
                        ...current,
                        [category]: {
                          ...current[category],
                          enabled: event.target.checked,
                        },
                      }))
                    }
                    className="size-5 accent-[var(--accent)]"
                  />
                </label>
                {budget.enabled && (
                  <div className="mt-3 flex min-h-12 items-center rounded-control border border-border bg-background px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                    <span className="mr-2 text-sm font-bold text-muted">Rp</span>
                    <input
                      value={budget.amount}
                      onChange={(event) =>
                        setBudgets((current) => ({
                          ...current,
                          [category]: {
                            ...current[category],
                            amount: event.target.value,
                          },
                        }))
                      }
                      inputMode="numeric"
                      placeholder="0"
                      className="min-w-0 flex-1 bg-transparent text-right text-lg font-bold outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        {step < 2 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong"
          >
            Lanjut
          </button>
        ) : (
          <SubmitButtons />
        )}
        {step > 0 && (
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              setStep((current) => Math.max(current - 1, 0));
            }}
            className="mt-3 flex min-h-11 w-full items-center justify-center font-bold text-muted"
          >
            Kembali
          </button>
        )}
      </div>
    </form>
  );
}
