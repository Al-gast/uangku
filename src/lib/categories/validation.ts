import type {
  ManageableCategoryGroup,
  ManageableCategoryType,
} from "@/lib/categories/types";
import { isProtectedCategoryName } from "@/lib/categories/types";

export type CategoryFormInput = {
  name: string;
  transactionType: ManageableCategoryType;
  group: ManageableCategoryGroup;
};

const categoryTypes = new Set<ManageableCategoryType>([
  "income",
  "expense",
]);

const categoryGroups = new Set<ManageableCategoryGroup>([
  "primer",
  "sekunder",
  "lifestyle",
  "transport",
  "tagihan",
  "kesehatan",
  "pendidikan",
  "investasi",
  "transfer",
  "income",
  "debt",
  "other",
]);

export function parseCategoryForm(formData: FormData): CategoryFormInput {
  const name = String(formData.get("name") ?? "").trim();
  const transactionType = String(
    formData.get("transaction_type") ?? "",
  ) as ManageableCategoryType;
  const group = String(formData.get("group") ?? "") as ManageableCategoryGroup;

  if (!name) {
    throw new Error("Nama kategori wajib diisi.");
  }

  if (name.length > 80) {
    throw new Error("Nama kategori maksimal 80 karakter.");
  }

  if (!categoryTypes.has(transactionType)) {
    throw new Error("Pilih tipe kategori.");
  }

  if (!categoryGroups.has(group)) {
    throw new Error("Pilih grup kategori.");
  }

  if (isProtectedCategoryName(name)) {
    throw new Error(
      "Nama kategori ini dipakai sistem. Gunakan nama lain agar tidak ambigu.",
    );
  }

  return {
    name,
    transactionType,
    group,
  };
}
