"use server";

import { redirect } from "next/navigation";
import {
  onboardingBudgetCategories,
  type OnboardingBudgetCategory,
} from "@/constants/onboarding";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/types/account";

export type OnboardingActionState = {
  error: string | null;
};

const accountTypes = new Set<AccountType>([
  "cash",
  "bank_account",
  "e_wallet",
  "investment_account",
  "asset_account",
  "liability",
]);

const budgetCategories = new Set<string>(onboardingBudgetCategories);

type AccountInput = {
  name: string;
  type: AccountType;
  initial_balance: number;
};

type BudgetInput = {
  category: OnboardingBudgetCategory;
  amount: number;
};

function parseJsonArray(value: FormDataEntryValue | null): unknown[] {
  if (typeof value !== "string") {
    return [];
  }

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Payload harus berupa daftar.");
  }

  return parsed;
}

function parseAmount(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const normalized =
    typeof value === "number"
      ? value
      : Number(
          String(value)
            .trim()
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", "."),
        );

  if (!Number.isFinite(normalized)) {
    throw new Error("Nominal harus berupa angka.");
  }

  if (Math.abs(normalized) > 999_999_999_999_999) {
    throw new Error("Nominal terlalu besar.");
  }

  return normalized;
}

function validateAccounts(rawAccounts: unknown[]): AccountInput[] {
  if (rawAccounts.length === 0) {
    throw new Error("Tambahkan minimal satu akun.");
  }

  if (rawAccounts.length > 20) {
    throw new Error("Maksimal 20 akun saat onboarding.");
  }

  return rawAccounts.map((rawAccount) => {
    if (!rawAccount || typeof rawAccount !== "object") {
      throw new Error("Data akun tidak valid.");
    }

    const account = rawAccount as Record<string, unknown>;
    const name = String(account.name ?? "").trim();
    const type = String(account.type ?? "") as AccountType;

    if (!name) {
      throw new Error("Nama setiap akun wajib diisi.");
    }

    if (name.length > 100) {
      throw new Error("Nama akun maksimal 100 karakter.");
    }

    if (!accountTypes.has(type)) {
      throw new Error("Pilih tipe akun yang valid.");
    }

    return {
      name,
      type,
      initial_balance: parseAmount(account.initial_balance),
    };
  });
}

function validateBudgets(rawBudgets: unknown[]): BudgetInput[] {
  if (rawBudgets.length > onboardingBudgetCategories.length) {
    throw new Error("Terlalu banyak budget onboarding.");
  }

  return rawBudgets.map((rawBudget) => {
    if (!rawBudget || typeof rawBudget !== "object") {
      throw new Error("Data budget tidak valid.");
    }

    const budget = rawBudget as Record<string, unknown>;
    const category = String(budget.category ?? "");
    const amount = parseAmount(budget.amount);

    if (!budgetCategories.has(category)) {
      throw new Error("Pilih kategori budget yang tersedia.");
    }

    if (amount <= 0) {
      throw new Error("Nominal budget harus lebih dari 0.");
    }

    return {
      category: category as OnboardingBudgetCategory,
      amount,
    };
  });
}

async function requireAuthenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return supabase;
}

export async function completeOnboarding(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  try {
    const accounts = validateAccounts(
      parseJsonArray(formData.get("accounts_payload")),
    );
    const budgets =
      formData.get("budget_mode") === "skip"
        ? []
        : validateBudgets(
            parseJsonArray(formData.get("budgets_payload")),
          );

    const supabase = await requireAuthenticatedClient();
    const { error } = await supabase.rpc("complete_onboarding", {
      p_accounts: accounts,
      p_budgets: budgets,
    });

    if (error) {
      if (error.code === "PGRST202" || error.code === "42883") {
        return {
          error:
            "Migration onboarding belum diterapkan di Supabase. Jalankan file migration Phase 3 terlebih dahulu.",
        };
      }

      return {
        error: "Onboarding belum berhasil disimpan. Coba lagi ya.",
      };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Data onboarding belum valid.",
    };
  }

  redirect("/dashboard");
}

export async function skipOnboarding() {
  const supabase = await requireAuthenticatedClient();
  const { error } = await supabase.rpc("skip_onboarding");

  if (error) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        "Onboarding belum bisa dilewati. Pastikan migration Phase 3 sudah diterapkan.",
      )}`,
    );
  }

  redirect("/dashboard");
}
