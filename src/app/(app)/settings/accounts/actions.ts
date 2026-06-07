"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseAccountForm,
  parseAccountName,
  parseAccountType,
} from "@/lib/accounts/validation";
import { createClient } from "@/lib/supabase/server";
import type { SpendableAccountType } from "@/lib/accounts/types";

export type AccountActionState = {
  error: string | null;
};

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  return { supabase, userId: String(userId) };
}

function revalidateAccounts() {
  revalidatePath("/settings/accounts");
  revalidatePath("/cashflow");
  revalidatePath("/cashflow/new");
  revalidatePath("/chat");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
}

function actionError(
  error: unknown,
  fallback: string,
): AccountActionState {
  return {
    error: error instanceof Error ? error.message : fallback,
  };
}

export async function createAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const input = parseAccountForm(formData, "create");
    const { supabase, userId } = await getAuthenticatedContext();
    const { error } = await supabase.from("accounts").insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      initial_balance: input.initialBalance,
      current_balance: input.initialBalance,
      currency: "IDR",
      is_active: true,
    });

    if (error) {
      throw new Error("Akun belum berhasil dibuat.");
    }
  } catch (error) {
    return actionError(error, "Akun belum berhasil dibuat.");
  }

  revalidateAccounts();
  redirect(
    `/settings/accounts?success=${encodeURIComponent(
      "Akun berhasil dibuat.",
    )}`,
  );
}

export async function updateAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const accountId = String(formData.get("account_id") ?? "");

  if (!accountId) {
    return { error: "Akun tidak ditemukan." };
  }

  try {
    const name = parseAccountName(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id,type")
      .eq("id", accountId)
      .eq("user_id", userId)
      .in("type", ["cash", "bank_account", "e_wallet"])
      .maybeSingle();

    if (accountError) {
      throw new Error("Akun belum berhasil diperiksa.");
    }

    if (!account) {
      throw new Error("Akun tidak ditemukan.");
    }

    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
      .limit(1);

    if (transactionError) {
      throw new Error("Riwayat akun belum bisa diperiksa.");
    }

    const updates: {
      name: string;
      type?: SpendableAccountType;
    } = { name };

    if (!transactions?.length) {
      updates.type = parseAccountType(formData);
    }

    const { error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", accountId)
      .eq("user_id", userId)
      .in("type", ["cash", "bank_account", "e_wallet"]);

    if (error) {
      throw new Error("Akun belum berhasil diperbarui.");
    }
  } catch (error) {
    return actionError(error, "Akun belum berhasil diperbarui.");
  }

  revalidateAccounts();
  redirect(
    `/settings/accounts?success=${encodeURIComponent(
      "Akun berhasil diperbarui.",
    )}`,
  );
}

export async function setAccountActive(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!accountId) {
    redirect(
      `/settings/accounts?error=${encodeURIComponent("Akun tidak ditemukan.")}`,
    );
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", accountId)
    .eq("user_id", userId)
    .in("type", ["cash", "bank_account", "e_wallet"]);

  if (error) {
    redirect(
      `/settings/accounts?error=${encodeURIComponent(
        isActive
          ? "Akun belum berhasil diaktifkan."
          : "Akun belum berhasil dinonaktifkan.",
      )}`,
    );
  }

  revalidateAccounts();
  redirect(
    `/settings/accounts?success=${encodeURIComponent(
      isActive ? "Akun berhasil diaktifkan." : "Akun berhasil dinonaktifkan.",
    )}`,
  );
}

export async function deleteAccount(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");

  if (!accountId) {
    redirect(
      `/settings/accounts?error=${encodeURIComponent("Akun tidak ditemukan.")}`,
    );
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
    .limit(1);

  if (transactionError) {
    redirect(
      `/settings/accounts?error=${encodeURIComponent(
        "Riwayat akun belum bisa diperiksa.",
      )}`,
    );
  }

  if (transactions?.length) {
    redirect(
      `/settings/accounts?error=${encodeURIComponent(
        "Akun ini sudah punya transaksi, jadi tidak bisa dihapus. Kamu bisa menonaktifkannya agar tidak muncul di pilihan transaksi baru.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId)
    .in("type", ["cash", "bank_account", "e_wallet"]);

  if (error) {
    redirect(
      `/settings/accounts?error=${encodeURIComponent(
        "Akun belum berhasil dihapus.",
      )}`,
    );
  }

  revalidateAccounts();
  redirect(
    `/settings/accounts?success=${encodeURIComponent("Akun berhasil dihapus.")}`,
  );
}
