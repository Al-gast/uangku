"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCategoryForm } from "@/lib/categories/validation";
import { isSystemCategoryName } from "@/lib/categories/types";
import { createClient } from "@/lib/supabase/server";
import type {
  ManageableCategoryGroup,
  ManageableCategoryType,
} from "@/lib/categories/types";

export type CategoryActionState = {
  error: string | null;
};

type CategoryMutationRow = {
  id: string;
  name: string;
  group: ManageableCategoryGroup;
  transaction_type: ManageableCategoryType;
  is_default: boolean;
  is_active: boolean;
  is_system: boolean;
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

function revalidateCategoryConsumers() {
  revalidatePath("/settings");
  revalidatePath("/settings/categories");
  revalidatePath("/settings/budgets");
  revalidatePath("/settings/budgets/new");
  revalidatePath("/cashflow");
  revalidatePath("/cashflow/new");
  revalidatePath("/chat");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
}

function actionError(error: unknown, fallback: string): CategoryActionState {
  return {
    error: error instanceof Error ? error.message : fallback,
  };
}

function isSystemCategory(
  category: Pick<CategoryMutationRow, "name" | "is_system">,
) {
  return category.is_system || isSystemCategoryName(category.name);
}

async function getCategoryForMutation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categoryId: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,group,transaction_type,is_default,is_active,is_system")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .in("transaction_type", [
      "income",
      "expense",
      "transfer",
      "investment",
      "debt",
    ])
    .maybeSingle();

  if (error) {
    throw new Error("Kategori belum bisa diperiksa.");
  }

  if (!data) {
    throw new Error("Kategori tidak ditemukan.");
  }

  return data as CategoryMutationRow;
}

async function ensureUniqueCategoryName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string,
  transactionType: ManageableCategoryType,
  excludeId?: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name")
    .eq("user_id", userId)
    .eq("transaction_type", transactionType);

  if (error) {
    throw new Error("Nama kategori belum bisa diperiksa.");
  }

  const duplicate = (data ?? []).some(
    (category) =>
      category.id !== excludeId &&
      category.name.trim().toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    throw new Error("Nama kategori sudah dipakai untuk tipe ini.");
  }
}

async function getCategoryUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categoryId: string,
) {
  const [transactionResult, adminFeeResult, budgetResult] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("category_id", categoryId),
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("admin_fee_category_id", categoryId),
      supabase
        .from("budgets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("category_id", categoryId),
    ]);

  if (transactionResult.error || adminFeeResult.error || budgetResult.error) {
    throw new Error("Histori kategori belum bisa diperiksa.");
  }

  return {
    transactionCount: transactionResult.count ?? 0,
    adminFeeReferenceCount: adminFeeResult.count ?? 0,
    budgetCount: budgetResult.count ?? 0,
  };
}

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  try {
    const input = parseCategoryForm(formData);
    const { supabase, userId } = await getAuthenticatedContext();
    await ensureUniqueCategoryName(
      supabase,
      userId,
      input.name,
      input.transactionType,
    );

    const { error } = await supabase.from("categories").insert({
      user_id: userId,
      name: input.name,
      group: input.group,
      transaction_type: input.transactionType,
      aliases: input.aliases,
      is_default: false,
      is_active: true,
      is_system: false,
    });

    if (error) {
      throw new Error("Kategori belum berhasil dibuat.");
    }
  } catch (error) {
    return actionError(error, "Kategori belum berhasil dibuat.");
  }

  revalidateCategoryConsumers();
  redirect(
    `/settings/categories?success=${encodeURIComponent(
      "Kategori berhasil dibuat.",
    )}`,
  );
}

export async function updateCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("category_id") ?? "");

  if (!categoryId) {
    return { error: "Kategori tidak ditemukan." };
  }

  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const category = await getCategoryForMutation(
      supabase,
      userId,
      categoryId,
    );

    if (isSystemCategory(category)) {
      throw new Error(
        "Kategori ini dipakai sistem, jadi tidak bisa diubah.",
      );
    }

    const input = parseCategoryForm(formData);

    if (input.transactionType !== category.transaction_type) {
      throw new Error("Tipe kategori tidak bisa diubah.");
    }

    await ensureUniqueCategoryName(
      supabase,
      userId,
      input.name,
      category.transaction_type,
      categoryId,
    );

    const { error } = await supabase
      .from("categories")
      .update({
        name: input.name,
        group: input.group,
        aliases: input.aliases,
      })
      .eq("id", categoryId)
      .eq("user_id", userId)
      .in("transaction_type", [
        "income",
        "expense",
        "transfer",
        "investment",
        "debt",
      ]);

    if (error) {
      throw new Error("Kategori belum berhasil diperbarui.");
    }
  } catch (error) {
    return actionError(error, "Kategori belum berhasil diperbarui.");
  }

  revalidateCategoryConsumers();
  redirect(
    `/settings/categories?success=${encodeURIComponent(
      "Kategori berhasil diperbarui.",
    )}`,
  );
}

export async function setCategoryActive(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!categoryId) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori tidak ditemukan.",
      )}`,
    );
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const category = await getCategoryForMutation(supabase, userId, categoryId);

  if (isSystemCategory(category)) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori ini dipakai sistem, jadi tidak bisa dinonaktifkan atau dihapus.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .eq("user_id", userId)
    .in("transaction_type", [
      "income",
      "expense",
      "transfer",
      "investment",
      "debt",
    ]);

  if (error) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        isActive
          ? "Kategori belum berhasil diaktifkan."
          : "Kategori belum berhasil dinonaktifkan.",
      )}`,
    );
  }

  revalidateCategoryConsumers();
  redirect(
    `/settings/categories?success=${encodeURIComponent(
      isActive
        ? "Kategori berhasil diaktifkan."
        : "Kategori berhasil dinonaktifkan.",
    )}`,
  );
}

export async function restoreDefaultCategories() {
  const { supabase, userId } = await getAuthenticatedContext();
  const { error: setupError } = await supabase.rpc(
    "ensure_default_categories",
  );

  if (setupError) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        setupError.code === "PGRST202" || setupError.code === "42883"
          ? "Migration kategori belum diterapkan di Supabase."
          : "Kategori bawaan belum bisa dipulihkan.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("categories")
    .update({ is_active: true })
    .eq("user_id", userId)
    .eq("is_default", true);

  if (error) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori bawaan belum berhasil dipulihkan.",
      )}`,
    );
  }

  revalidateCategoryConsumers();
  redirect(
    `/settings/categories?success=${encodeURIComponent(
      "Kategori bawaan berhasil dipulihkan.",
    )}`,
  );
}

export async function deleteCategory(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");

  if (!categoryId) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori tidak ditemukan.",
      )}`,
    );
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const category = await getCategoryForMutation(supabase, userId, categoryId);

  if (isSystemCategory(category)) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori ini dipakai sistem, jadi tidak bisa dinonaktifkan atau dihapus.",
      )}`,
    );
  }

  if (category.is_default) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori bawaan tidak bisa dihapus. Kamu bisa menonaktifkannya agar tidak muncul di pilihan baru.",
      )}`,
    );
  }

  const usage = await getCategoryUsage(supabase, userId, categoryId);
  const hasHistory =
    usage.transactionCount > 0 ||
    usage.adminFeeReferenceCount > 0 ||
    usage.budgetCount > 0;

  if (hasHistory) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori ini sudah punya histori, jadi tidak bisa dihapus. Kamu bisa menonaktifkannya agar tidak muncul di pilihan baru.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId)
    .in("transaction_type", [
      "income",
      "expense",
      "transfer",
      "investment",
      "debt",
    ]);

  if (error) {
    redirect(
      `/settings/categories?error=${encodeURIComponent(
        "Kategori belum berhasil dihapus.",
      )}`,
    );
  }

  revalidateCategoryConsumers();
  redirect(
    `/settings/categories?success=${encodeURIComponent(
      "Kategori berhasil dihapus.",
    )}`,
  );
}
