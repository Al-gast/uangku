"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  accountMutationDateRanges,
  accountMutationTypeFilters,
} from "@/lib/accounts/types";
import type {
  AccountMutationDateRange,
  AccountMutationTypeFilter,
} from "@/lib/accounts/types";
import { createClient } from "@/lib/supabase/server";
import type { ReconciliationStatus } from "@/types/transaction";

const reconciliationStatuses: ReconciliationStatus[] = [
  "unchecked",
  "matched",
  "needs_review",
];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isReconciliationStatus(
  value: string,
): value is ReconciliationStatus {
  return reconciliationStatuses.includes(value as ReconciliationStatus);
}

function safeAccountRedirect(formData: FormData, accountId: string) {
  const fallback = `/accounts/${accountId}`;
  const redirectTo = String(formData.get("redirect_to") ?? "");

  if (!uuidPattern.test(accountId) || !redirectTo.startsWith("/accounts/")) {
    return fallback;
  }

  const url = new URL(redirectTo, "http://uangku.local");

  if (url.pathname !== fallback) {
    return fallback;
  }

  const params = new URLSearchParams();
  const range = url.searchParams.get("range");
  const type = url.searchParams.get("type");

  if (
    range &&
    accountMutationDateRanges.includes(range as AccountMutationDateRange)
  ) {
    params.set("range", String(range));
  }

  if (
    type &&
    accountMutationTypeFilters.includes(type as AccountMutationTypeFilter)
  ) {
    params.set("type", String(type));
  }

  const query = params.toString();

  return query ? `${fallback}?${query}` : fallback;
}

function redirectWithMessage(
  path: string,
  key: "success" | "error",
  message: string,
): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${key}=${encodeURIComponent(message)}`);
}

export async function setTransactionReconciliationStatus(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");
  const transactionId = String(formData.get("transaction_id") ?? "");
  const status = String(formData.get("reconciliation_status") ?? "");
  const redirectPath = safeAccountRedirect(formData, accountId);

  if (
    !uuidPattern.test(accountId) ||
    !uuidPattern.test(transactionId) ||
    !isReconciliationStatus(status)
  ) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Status rekonsiliasi belum bisa diperbarui.",
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: updated, error } = await supabase
    .from("transactions")
    .update({ reconciliation_status: status })
    .eq("id", transactionId)
    .eq("user_id", String(userId))
    .or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Status rekonsiliasi belum bisa diperbarui.",
    );
  }

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/cashflow");
  redirectWithMessage(
    redirectPath,
    "success",
    "Status rekonsiliasi diperbarui.",
  );
}
