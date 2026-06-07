import "server-only";

import type {
  ExportBundle,
  ExportCell,
  ExportRow,
  ExportScope,
  ExportTable,
} from "@/lib/export/types";

function sanitizeSpreadsheetCell(value: ExportCell): ExportCell {
  if (typeof value !== "string") {
    return value;
  }

  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function encodeCell(value: ExportCell) {
  const sanitized = sanitizeSpreadsheetCell(value);
  const text = sanitized === null ? "" : String(sanitized);

  return `"${text.replaceAll('"', '""')}"`;
}

function tableToCsv(table: ExportTable) {
  const lines = [
    table.columns.map(encodeCell).join(","),
    ...table.rows.map((row) =>
      table.columns.map((column) => encodeCell(row[column] ?? "")).join(","),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

function combineTables(bundle: ExportBundle): ExportTable {
  const tables = [
    bundle.transactions,
    bundle.accounts,
    bundle.budgets,
    bundle.assets,
    bundle.liabilities,
  ];
  const columns = [
    "Jenis Data",
    ...Array.from(new Set(tables.flatMap((table) => table.columns))),
  ];
  const rows: ExportRow[] = tables.flatMap((table) =>
    table.rows.map((row) => ({
      "Jenis Data": table.dataLabel,
      ...row,
    })),
  );

  return {
    sheetName: "Semua Data",
    dataLabel: "Semua Data",
    columns,
    rows,
  };
}

export function createCsv(bundle: ExportBundle, scope: ExportScope) {
  return tableToCsv(
    scope === "transactions" ? bundle.transactions : combineTables(bundle),
  );
}
