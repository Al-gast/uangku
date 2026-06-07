export type BudgetInput = {
  categoryId: string;
  amount: number;
};

function parseAmount(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal budget harus lebih dari 0.");
  }

  if (amount > 999_999_999_999_999) {
    throw new Error("Nominal budget terlalu besar.");
  }

  return amount;
}

export function parseBudgetForm(formData: FormData): BudgetInput {
  const categoryId = String(formData.get("category_id") ?? "");

  if (!categoryId) {
    throw new Error("Pilih kategori budget.");
  }

  return {
    categoryId,
    amount: parseAmount(formData.get("amount")),
  };
}
