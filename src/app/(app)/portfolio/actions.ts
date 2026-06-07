"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseAssetForm,
  parseLiabilityForm,
} from "@/lib/portfolio/validation";
import { getSupportedCryptoId } from "@/lib/prices/assets";
import { getLatestCryptoPrice } from "@/lib/prices/coingecko";
import { createClient } from "@/lib/supabase/server";

export type PortfolioActionState = {
  error: string | null;
};

export type MarketPricePreview = {
  unitPrice: number;
  quantity: number;
  calculatedValue: number;
  currentValue: number;
  updatedAt: string;
};

export type MarketPriceActionResult = {
  error: string | null;
  preview: MarketPricePreview | null;
};

const MAX_ASSET_VALUE = 999_999_999_999_999;

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

function calculateMarketValue(quantity: number, unitPrice: number) {
  const calculatedValue =
    Math.round(quantity * unitPrice * 100) / 100;

  if (
    !Number.isFinite(calculatedValue) ||
    calculatedValue < 0 ||
    calculatedValue > MAX_ASSET_VALUE
  ) {
    throw new Error("Nilai hasil perhitungan terlalu besar.");
  }

  return calculatedValue;
}

async function getRefreshableAsset(assetId: string) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("assets")
    .select("id,name,type,unit,quantity,current_value")
    .eq("id", assetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Aset tidak ditemukan.");
  }

  const coinId = getSupportedCryptoId(data);
  const quantity =
    data.quantity === null ? null : Number(data.quantity);

  if (!coinId) {
    throw new Error("Harga otomatis belum tersedia untuk aset ini.");
  }

  if (
    quantity === null ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "Isi jumlah unit lebih dari 0 sebelum mengambil harga.",
    );
  }

  return {
    supabase,
    userId,
    asset: {
      id: data.id,
      coinId,
      quantity,
      currentValue: Number(data.current_value),
    },
  };
}

export async function previewMarketPrice(
  assetId: string,
): Promise<MarketPriceActionResult> {
  try {
    const { asset } = await getRefreshableAsset(assetId);
    const latestPrice = await getLatestCryptoPrice(asset.coinId);

    return {
      error: null,
      preview: {
        unitPrice: latestPrice.unitPrice,
        quantity: asset.quantity,
        calculatedValue: calculateMarketValue(
          asset.quantity,
          latestPrice.unitPrice,
        ),
        currentValue: asset.currentValue,
        updatedAt: latestPrice.updatedAt,
      },
    };
  } catch {
    return {
      error: "Harga belum bisa diambil. Kamu tetap bisa isi manual.",
      preview: null,
    };
  }
}

export async function applyMarketPrice(
  assetId: string,
): Promise<MarketPriceActionResult> {
  try {
    const { supabase, userId, asset } =
      await getRefreshableAsset(assetId);
    const latestPrice = await getLatestCryptoPrice(asset.coinId);
    const calculatedValue = calculateMarketValue(
      asset.quantity,
      latestPrice.unitPrice,
    );
    const { error } = await supabase
      .from("assets")
      .update({
        last_price: latestPrice.unitPrice,
        last_price_updated_at: latestPrice.updatedAt,
        current_value: calculatedValue,
      })
      .eq("id", asset.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Harga aset belum berhasil diperbarui.");
    }

    revalidatePortfolio();

    return {
      error: null,
      preview: {
        unitPrice: latestPrice.unitPrice,
        quantity: asset.quantity,
        calculatedValue,
        currentValue: calculatedValue,
        updatedAt: latestPrice.updatedAt,
      },
    };
  } catch {
    return {
      error: "Harga belum bisa diterapkan. Kamu tetap bisa isi manual.",
      preview: null,
    };
  }
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
      last_price: input.unitPrice,
      last_price_updated_at:
        input.unitPrice === null ? null : new Date().toISOString(),
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
      .select("id,last_price,last_price_updated_at")
      .eq("id", assetId)
      .eq("user_id", userId)
      .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
      .maybeSingle();

    if (!existing) {
      throw new Error("Aset tidak ditemukan.");
    }

    const existingUnitPrice =
      existing.last_price === null ? null : Number(existing.last_price);
    const unitPriceChanged = existingUnitPrice !== input.unitPrice;
    const { error } = await supabase
      .from("assets")
      .update({
        name: input.name,
        type: input.type,
        platform: input.platform,
        quantity: input.quantity,
        unit: input.unit,
        last_price: input.unitPrice,
        last_price_updated_at:
          input.unitPrice === null
            ? null
            : unitPriceChanged
              ? new Date().toISOString()
              : existing.last_price_updated_at,
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

  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("asset_id", assetId)
    .limit(1);

  if (transactionError) {
    redirect(
      `/portfolio?error=${encodeURIComponent(
        "Histori aset belum bisa diperiksa.",
      )}`,
    );
  }

  if (transactions?.length) {
    redirect(
      `/portfolio?error=${encodeURIComponent(
        "Aset ini sudah punya histori transaksi investasi, jadi tidak bisa dihapus. Kamu bisa mengubah nilainya menjadi Rp0 atau biarkan sebagai histori.",
      )}`,
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
