import type {
  ManageableCategoryGroup,
  ManageableCategoryType,
} from "@/lib/categories/types";
import { isSystemCategoryName } from "@/lib/categories/types";

export type CategoryFormInput = {
  name: string;
  transactionType: ManageableCategoryType;
  group: ManageableCategoryGroup;
  aliases: string[];
};

const categoryTypes = new Set<ManageableCategoryType>([
  "income",
  "expense",
  "transfer",
  "investment",
  "debt",
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

function parseAliases(value: FormDataEntryValue | null) {
  const aliases = String(value ?? "")
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
  const uniqueAliases = Array.from(
    new Map(
      aliases.map((alias) => [alias.toLocaleLowerCase("id-ID"), alias]),
    ).values(),
  );

  if (uniqueAliases.length > 20) {
    throw new Error("Alias maksimal 20 item.");
  }

  for (const alias of uniqueAliases) {
    if (alias.length > 60) {
      throw new Error("Setiap alias maksimal 60 karakter.");
    }
  }

  return uniqueAliases;
}

export function parseCategoryForm(formData: FormData): CategoryFormInput {
  const name = String(formData.get("name") ?? "").trim();
  const transactionType = String(
    formData.get("transaction_type") ?? "",
  ) as ManageableCategoryType;
  const group = String(formData.get("group") ?? "") as ManageableCategoryGroup;
  const aliases = parseAliases(formData.get("aliases"));

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

  if (isSystemCategoryName(name)) {
    throw new Error(
      "Nama kategori ini dipakai sistem. Gunakan nama lain agar tidak ambigu.",
    );
  }

  return {
    name,
    transactionType,
    group,
    aliases,
  };
}
