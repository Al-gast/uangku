"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeOnboarding,
  type OnboardingActionState,
} from "@/app/onboarding/actions";
import { ThemedSelect } from "@/components/ui/themed-select";
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
    title: "Di mana uang kamu disimpan?",
    subtitle:
      "Tambahkan rekening, e-wallet, atau cash yang kamu pakai sehari-hari. Bisa ditambah lagi nanti kok.",
  },
  {
    title: "Berapa saldo kamu sekarang?",
    subtitle:
      "Isi kira-kira aja, nggak harus persis. Ini jadi titik awal pencatatan kamu.",
  },
  {
    title: "Mau atur budget bulanan?",
    subtitle:
      "Budget membantu kamu tahu kapan pengeluaran mulai kebanyakan. Aktifkan kategori yang paling penting buat kamu.",
  },
];

const stepLabels = ["Akun", "Saldo", "Budget"];

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
        className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan & Mulai 🎉"}
      </button>
      <button
        type="submit"
        name="budget_mode"
        value="skip"
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-control border border-border bg-surface px-5 font-bold text-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        Nanti aja deh
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
        return "Tambahin satu akun dulu ya, biar UangKu bisa mulai catat.";
      }

      if (accounts.some((account) => !account.name.trim())) {
        return "Ada akun yang belum dikasih nama nih.";
      }
    }

    if (
      step === 1 &&
      accounts.some((account) => !isNumericInput(account.initialBalance))
    ) {
      return "Hmm, saldo ini perlu berupa angka ya.";
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

      <div className="mb-7" aria-label={`Langkah ${step + 1} dari 3`}>
        <div className="flex gap-2">
          {stepContent.map((item, index) => (
            <span
              key={item.title}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                index <= step ? "bg-accent" : "bg-surface-muted"
              }`}
            />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 text-center text-[0.68rem] font-semibold text-muted">
          {stepLabels.map((label, index) => (
            <span
              key={label}
              className={index === step ? "text-accent-strong" : undefined}
            >
              {label}
            </span>
          ))}
        </div>
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
              Pilih yang kamu pakai
            </p>
            <div className="flex flex-wrap gap-2">
              {accountPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => addPreset(preset.name, preset.type)}
                  className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent active:scale-[0.98]"
                >
                  <span aria-hidden="true">{preset.icon}</span> {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {accounts.length === 0 && (
              <div className="rounded-card border border-dashed border-accent/50 bg-accent-soft/50 p-6 text-center">
                <p className="font-bold text-foreground">Belum ada akun</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Tap tombol di bawah atau pilih dari daftar populer.
                </p>
              </div>
            )}
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="rounded-card border border-border bg-surface p-4 shadow-card transition-colors focus-within:border-accent/60"
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
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted">
                    Nama akun
                  </span>
                  <input
                    value={account.name}
                    onChange={(event) =>
                      updateAccount(account.id, { name: event.target.value })
                    }
                    placeholder="Contoh: BCA utama"
                    maxLength={100}
                    className="min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
                  />
                </label>
                <div className="mt-3">
                  <ThemedSelect
                    label={
                      <span className="text-xs text-muted">Jenis akun</span>
                    }
                    value={account.type}
                    onChange={(type) =>
                      updateAccount(account.id, {
                        type: type as AccountType,
                      })
                    }
                    options={accountTypeOptions}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAccounts((current) => [...current, createDraft()])}
            className="flex min-h-12 w-full items-center justify-center rounded-control border border-dashed border-accent bg-accent-soft px-4 font-bold text-accent-strong transition active:scale-[0.98]"
          >
            + Tambah akun
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
              <span className="flex items-center justify-between gap-3">
                <span className="font-bold">{account.name}</span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.68rem] font-bold text-accent-strong">
                  {accountTypeOptions.find(
                    (option) => option.value === account.type,
                  )?.label ?? account.type}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted">
                Kosongkan kalau belum tahu atau saldonya 0
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
                <button
                  type="button"
                  onClick={() =>
                    setBudgets((current) => ({
                      ...current,
                      [category]: {
                        ...current[category],
                        enabled: !current[category].enabled,
                      },
                    }))
                  }
                  aria-pressed={budget.enabled}
                  className={`flex min-h-14 w-full items-center justify-between gap-4 rounded-control border p-3 text-left transition active:scale-[0.99] ${
                    budget.enabled
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span>
                    <span className="block font-bold">{category}</span>
                    <span
                      className={`mt-1 block text-xs ${
                        budget.enabled ? "text-accent-strong" : "text-muted"
                      }`}
                    >
                      per bulan
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                      budget.enabled
                        ? "border-accent bg-accent"
                        : "border-border bg-surface-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                        budget.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </button>
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
            className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.98]"
          >
            {step === 0 ? "Lanjut ke Saldo →" : "Lanjut ke Budget →"}
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
            ← Kembali
          </button>
        )}
      </div>
    </form>
  );
}
