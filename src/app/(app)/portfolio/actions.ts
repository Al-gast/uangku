"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseAssetForm,
  parseLiabilityForm,
} from "@/lib/portfolio/validation";
import { createClient } from "@/lib/supabase/server";

export type PortfolioActionState = {
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

function actionError(
  error: unknown,
  fallback: string,
): PortfolioActionState {
  return {
    error: error instanceof Error ? error.message : fallback,
  };
}

function revalidatePortfolio() {
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

export async function createAsset(
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  try {
    const input = parseAssetForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    const { error } = await supabase.from("assets").insert({
      user_id: userId,
      account_id: null,
      name: input.name,
      type: input.type,
      platform: input.platform,
      currency: "IDR",
      quantity: input.quantity,
      unit: input.unit,
      total_cost: input.totalCost,
      current_value: input.currentValue,
      auto_price_enabled: false,
      notes: input.notes,
    });

    if (error) {
      throw new Error(
        "Aset belum berhasil disimpan. Coba periksa datanya lagi.",
      );
    }
  } catch (error) {
    return actionError(
      error,
      "Aset belum berhasil disimpan. Coba periksa datanya lagi.",
    );
  }

  revalidatePortfolio();
  redirect(
    `/portfolio?success=${encodeURIComponent("Aset berhasil ditambahkan.")}`,
  );
}

export async function updateAsset(
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const assetId = String(formData.get("asset_id") ?? "");

  if (!assetId) {
    return { error: "Aset tidak ditemukan." };
  }

  try {
    const input = parseAssetForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data: existing } = await supabase
      .from("assets")
      .select("id")
      .eq("id", assetId)
      .eq("user_id", userId)
      .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
      .maybeSingle();

    if (!existing) {
      throw new Error("Aset tidak ditemukan.");
    }

    const { error } = await supabase
      .from("assets")
      .update({
        name: input.name,
        type: input.type,
        platform: input.platform,
        quantity: input.quantity,
        unit: input.unit,
        total_cost: input.totalCost,
        current_value: input.currentValue,
        notes: input.notes,
      })
      .eq("id", assetId)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Aset belum berhasil diperbarui.");
    }
  } catch (error) {
    return actionError(error, "Aset belum berhasil diperbarui.");
  }

  revalidatePortfolio();
  redirect(
    `/portfolio?success=${encodeURIComponent("Aset berhasil diperbarui.")}`,
  );
}

export async function deleteAsset(formData: FormData) {
  const assetId = String(formData.get("asset_id") ?? "");

  if (!assetId) {
    redirect(
      `/portfolio?error=${encodeURIComponent("Aset tidak ditemukan.")}`,
    );
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const { data: existing } = await supabase
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .eq("user_id", userId)
    .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
    .maybeSingle();

  if (!existing) {
    redirect(
      `/portfolio?error=${encodeURIComponent("Aset tidak ditemukan.")}`,
    );
  }

  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("user_id", userId);

  if (error) {
    redirect(
      `/portfolio?error=${encodeURIComponent(
        "Aset belum berhasil dihapus.",
      )}`,
    );
  }

  revalidatePortfolio();
  redirect(
    `/portfolio?success=${encodeURIComponent("Aset berhasil dihapus.")}`,
  );
}

export async function createLiability(
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  try {
    const input = parseLiabilityForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    const { error } = await supabase.from("liabilities").insert({
      user_id: userId,
      name: input.name,
      amount: input.amount,
      remaining_amount: input.remainingAmount,
      due_date: input.dueDate,
      reminder_enabled: false,
      notes: input.notes,
    });

    if (error) {
      throw new Error("Hutang belum berhasil disimpan.");
    }
  } catch (error) {
    return actionError(error, "Hutang belum berhasil disimpan.");
  }

  revalidatePortfolio();
  redirect(
    `/portfolio?success=${encodeURIComponent("Hutang berhasil dicatat.")}`,
  );
}

export async function updateLiability(
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const liabilityId = String(formData.get("liability_id") ?? "");

  if (!liabilityId) {
    return { error: "Hutang tidak ditemukan." };
  }

  try {
    const input = parseLiabilityForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data: existing } = await supabase
      .from("liabilities")
      .select("id")
      .eq("id", liabilityId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      throw new Error("Hutang tidak ditemukan.");
    }

    const { error } = await supabase
      .from("liabilities")
      .update({
        name: input.name,
        amount: input.amount,
        remaining_amount: input.remainingAmount,
        due_date: input.dueDate,
        notes: input.notes,
      })
      .eq("id", liabilityId)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Hutang belum berhasil diperbarui.");
    }
  } catch (error) {
    return actionError(error, "Hutang belum berhasil diperbarui.");
  }

  revalidatePortfolio();
  redirect(
    `/portfolio?success=${encodeURIComponent("Hutang berhasil diperbarui.")}`,
  );
}

export async function deleteLiability(formData: FormData) {
  const liabilityId = String(formData.get("liability_id") ?? "");

  if (!liabilityId) {
    redirect(
      `/portfolio?error=${encodeURIComponent("Hutang tidak ditemukan.")}`,
    );
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const { data: existing } = await supabase
    .from("liabilities")
    .select("id")
    .eq("id", liabilityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    redirect(
      `/portfolio?error=${encodeURIComponent("Hutang tidak ditemukan.")}`,
    );
  }

  const { error } = await supabase
    .from("liabilities")
    .delete()
    .eq("id", liabilityId)
    .eq("user_id", userId);

  if (error) {
    redirect(
      `/portfolio?error=${encodeURIComponent(
        "Hutang belum berhasil dihapus.",
      )}`,
    );
  }

  revalidatePortfolio();
  redirect(
    `/portfolio?success=${encodeURIComponent("Hutang berhasil dihapus.")}`,
  );
}
