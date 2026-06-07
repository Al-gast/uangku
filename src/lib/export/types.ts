export type ExportCell = string | number | boolean | null;

export type ExportRow = Record<string, ExportCell>;

export type ExportTable = {
  sheetName: string;
  dataLabel: string;
  columns: string[];
  rows: ExportRow[];
};

export type ExportBundle = {
  transactions: ExportTable;
  accounts: ExportTable;
  budgets: ExportTable;
  assets: ExportTable;
  liabilities: ExportTable;
};

export type ExportScope = "transactions" | "all";
export type ExportFormat = "csv" | "excel";
