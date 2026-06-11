import {
  portfolioAssetTypes,
  type PortfolioAssetType,
} from "./types";
import {
  parseIdrInput,
  parseLocaleDecimalInput,
} from "../number";

const MAX_AMOUNT = 999_999_999_999_999;

export type AssetInput = {
  name: string;
  type: PortfolioAssetType;
  platform: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalCost: number | null;
  currentValue: number;
  notes: string | null;
};

export type LiabilityInput = {
  name: string;
  amount: number;
  remainingAmount: number;
  dueDate: string | null;
  reminderEnabled: boolean;
  notes: string | null;
};

export function isPortfolioAssetType(
  value: string,
): value is PortfolioAssetType {
  return portfolioAssetTypes.includes(value as PortfolioAssetType);
}

function parseNumber(
  value: FormDataEntryValue | null,
  options: { required: boolean; allowZero: boolean },
) {
  const raw = String(value ?? "").trim();

  if (!raw && !options.required) {
    return null;
  }

  const parsed = parseIdrInput(raw);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    (!options.allowZero && parsed === 0)
  ) {
    return Number.NaN;
  }

  if (parsed > MAX_AMOUNT) {
    throw new Error("Nominal terlalu besar.");
  }

  return parsed;
}

function parseDecimalNumber(
  value: FormDataEntryValue | null,
  options: { required: boolean; allowZero: boolean },
) {
  const raw = String(value ?? "").trim();

  if (!raw && !options.required) {
    return null;
  }

  const parsed = parseLocaleDecimalInput(raw);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    (!options.allowZero && parsed === 0)
  ) {
    return Number.NaN;
  }

  if (parsed > MAX_AMOUNT) {
    throw new Error("Nominal terlalu besar.");
  }

  return parsed;
}

function parseQuantity(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = parseLocaleDecimalInput(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return Number.NaN;
  }

  return parsed;
}

function optionalText(value: FormDataEntryValue | null, maxLength: number) {
  const text = String(value ?? "").trim();

  if (text.length > maxLength) {
    throw new Error("Teks yang dimasukkan terlalu panjang.");
  }

  return text || null;
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseAssetForm(formData: FormData): AssetInput {
  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!isPortfolioAssetType(type)) {
    throw new Error("Jenis aset tidak valid.");
  }

  if (!name) {
    throw new Error("Nama aset harus diisi.");
  }

  if (name.length > 120) {
    throw new Error("Nama aset maksimal 120 karakter.");
  }

  const currentValue = parseNumber(formData.get("current_value"), {
    required: true,
    allowZero: true,
  });

  if (currentValue === null || Number.isNaN(currentValue)) {
    throw new Error("Nilai aset harus berupa angka 0 atau lebih.");
  }

  const totalCost = parseNumber(formData.get("total_cost"), {
    required: false,
    allowZero: true,
  });
  const quantity = parseQuantity(formData.get("quantity"));
  const unit = optionalText(formData.get("unit"), 20);
  const unitPrice = parseDecimalNumber(formData.get("unit_price"), {
    required: false,
    allowZero: true,
  });

  if (
    (totalCost !== null && Number.isNaN(totalCost)) ||
    (quantity !== null && Number.isNaN(quantity)) ||
    (unitPrice !== null && Number.isNaN(unitPrice))
  ) {
    throw new Error(
      "Jumlah unit, harga per unit, atau modal aset belum valid.",
    );
  }

  return {
    name,
    type,
    platform: optionalText(formData.get("platform"), 120),
    quantity,
    unit,
    unitPrice,
    totalCost,
    currentValue,
    notes: optionalText(formData.get("notes"), 1000),
  };
}

export function parseLiabilityForm(formData: FormData): LiabilityInput {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Nama hutang harus diisi.");
  }

  if (name.length > 120) {
    throw new Error("Nama hutang maksimal 120 karakter.");
  }

  const amount = parseNumber(formData.get("amount"), {
    required: true,
    allowZero: false,
  });

  if (amount === null || Number.isNaN(amount)) {
    throw new Error("Nominal hutang harus lebih dari 0.");
  }

  const remainingAmount = parseNumber(formData.get("remaining_amount"), {
    required: true,
    allowZero: true,
  });

  if (remainingAmount === null || Number.isNaN(remainingAmount)) {
    throw new Error("Sisa hutang harus berupa angka 0 atau lebih.");
  }

  if (remainingAmount > amount) {
    throw new Error(
      "Sisa hutang tidak boleh lebih dari total hutang awal.",
    );
  }

  const dueDate = String(formData.get("due_date") ?? "").trim();

  if (dueDate && !isValidDateInput(dueDate)) {
    throw new Error("Tanggal jatuh tempo belum valid.");
  }

  const reminderEnabled = formData.get("reminder_enabled") === "true";

  if (reminderEnabled && !dueDate) {
    throw new Error(
      "Isi tanggal jatuh tempo sebelum mengaktifkan pengingat.",
    );
  }

  return {
    name,
    amount,
    remainingAmount,
    dueDate: dueDate || null,
    reminderEnabled,
    notes: optionalText(formData.get("notes"), 1000),
  };
}
