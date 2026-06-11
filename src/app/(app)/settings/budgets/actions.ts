"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getJakartaMonthRange } from "@/lib/date";
import { parseBudgetForm } from "@/lib/budgets/validation";
import { createClient } from "@/lib/supabase/server";

export type BudgetActionState = {
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

async function validateExpenseCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
  allowInactive = false,
) {
  let query = supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("transaction_type", "expense")
    .neq("is_system", true);

  query = allowInactive ? query : query.eq("is_active", true);

  const { data } = await query.maybeSingle();

  if (!data) {
    throw new Error("Kategori expense tidak ditemukan.");
  }
}

async function hasOverlappingBudget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
  excludeId?: string,
) {
  const month = getJakartaMonthRange();
  let query = supabase
    .from("budgets")
    .select("id")
    .eq("category_id", categoryId)
    .eq("period", "monthly")
    .eq("is_active", true)
    .lt("start_date", month.nextMonthDate)
    .or(`end_date.is.null,end_date.gte.${month.startDate}`)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query;
  return Boolean(data?.length);
}

function handleError(error: unknown): BudgetActionState {
  return {
    error:
      error instanceof Error
        ? error.message
        : "Budget belum berhasil disimpan. Coba lagi ya.",
  };
}

export async function createBudget(
  _previousState: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  try {
    const input = parseBudgetForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    await validateExpenseCategory(supabase, input.categoryId);

    if (await hasOverlappingBudget(supabase, input.categoryId)) {
      throw new Error(
        "Kategori ini sudah punya budget bulanan yang aktif.",
      );
    }

    const month = getJakartaMonthRange();
    const { error } = await supabase.from("budgets").insert({
      user_id: userId,
      category_id: input.categoryId,
      period: "monthly",
      amount: input.amount,
      start_date: month.startDate,
      end_date: null,
      is_active: true,
    });

    if (error) {
      throw new Error("Budget belum berhasil disimpan. Coba lagi ya.");
    }
  } catch (error) {
    return handleError(error);
  }

  revalidatePath("/settings/budgets");
  revalidatePath("/dashboard");
  redirect(
    `/settings/budgets?success=${encodeURIComponent(
      "Budget berhasil dibuat.",
    )}`,
  );
}

export async function updateBudget(
  _previousState: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const budgetId = String(formData.get("budget_id") ?? "");

  if (!budgetId) {
    return { error: "Budget tidak ditemukan." };
  }

  try {
    const input = parseBudgetForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data: currentBudget, error: currentBudgetError } = await supabase
      .from("budgets")
      .select("id,category_id")
      .eq("id", budgetId)
      .eq("user_id", userId)
      .maybeSingle();

    if (currentBudgetError) {
      throw new Error("Budget belum berhasil diperiksa.");
    }

    if (!currentBudget) {
      throw new Error("Budget tidak ditemukan.");
    }

    await validateExpenseCategory(
      supabase,
      input.categoryId,
      input.categoryId === currentBudget.category_id,
    );

    if (await hasOverlappingBudget(supabase, input.categoryId, budgetId)) {
      throw new Error(
        "Kategori ini sudah punya budget bulanan yang aktif.",
      );
    }

    const { error } = await supabase
      .from("budgets")
      .update({
        category_id: input.categoryId,
        amount: input.amount,
        period: "monthly",
      })
      .eq("id", budgetId);

    if (error) {
      throw new Error("Budget belum berhasil diperbarui. Coba lagi ya.");
    }
  } catch (error) {
    return handleError(error);
  }

  revalidatePath("/settings/budgets");
  revalidatePath("/dashboard");
  redirect(
    `/settings/budgets?success=${encodeURIComponent(
      "Budget berhasil diperbarui.",
    )}`,
  );
}

export async function deleteBudget(formData: FormData) {
  const budgetId = String(formData.get("budget_id") ?? "");

  if (!budgetId) {
    redirect(
      `/settings/budgets?error=${encodeURIComponent(
        "Budget tidak ditemukan.",
      )}`,
    );
  }

  const { supabase } = await getAuthenticatedContext();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId);

  if (error) {
    redirect(
      `/settings/budgets?error=${encodeURIComponent(
        "Budget belum berhasil dihapus.",
      )}`,
    );
  }

  revalidatePath("/settings/budgets");
  revalidatePath("/dashboard");
  redirect(
    `/settings/budgets?success=${encodeURIComponent(
      "Budget berhasil dihapus.",
    )}`,
  );
}
