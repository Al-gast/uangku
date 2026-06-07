import { spendableAccountTypes } from "@/constants/accounts";
import type { SpendableAccountType } from "@/lib/accounts/types";

export type AccountFormInput = {
  name: string;
  type: SpendableAccountType;
  initialBalance: number;
};

function parseAmount(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return 0;
  }

  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error("Saldo awal harus berupa angka.");
  }

  if (Math.abs(amount) > 999_999_999_999_999) {
    throw new Error("Saldo awal terlalu besar.");
  }

  return amount;
}

export function parseAccountName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Nama akun wajib diisi.");
  }

  if (name.length > 100) {
    throw new Error("Nama akun maksimal 100 karakter.");
  }

  return name;
}

export function parseAccountType(formData: FormData) {
  const type = String(formData.get("type") ?? "") as SpendableAccountType;

  if (!spendableAccountTypes.includes(type)) {
    throw new Error("Pilih jenis akun yang valid.");
  }

  return type;
}

export function parseAccountForm(
  formData: FormData,
  mode: "create" | "update",
): AccountFormInput {
  return {
    name: parseAccountName(formData),
    type: parseAccountType(formData),
    initialBalance:
      mode === "create" ? parseAmount(formData.get("initial_balance")) : 0,
  };
}
