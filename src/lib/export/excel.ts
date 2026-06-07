import "server-only";

import type {
  ExportBundle,
  ExportCell,
  ExportScope,
  ExportTable,
} from "@/lib/export/types";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createCell(value: ExportCell, styleId?: string) {
  const type = typeof value === "number" ? "Number" : "String";
  const normalized = value === null ? "" : String(value);
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";

  return `<Cell${style}><Data ss:Type="${type}">${escapeXml(normalized)}</Data></Cell>`;
}

function createWorksheet(table: ExportTable) {
  const header = table.columns
    .map((column) => createCell(column, "Header"))
    .join("");
  const rows = table.rows
    .map(
      (row) =>
        `<Row>${table.columns
          .map((column) => createCell(row[column] ?? ""))
          .join("")}</Row>`,
    )
    .join("");
  const columns = table.columns
    .map((column) => {
      const longestValue = Math.max(
        column.length,
        ...table.rows.map((row) => String(row[column] ?? "").length),
      );
      const width = Math.min(240, Math.max(80, longestValue * 7));

      return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
    })
    .join("");

  return [
    `<Worksheet ss:Name="${escapeXml(table.sheetName)}">`,
    "<Table>",
    columns,
    `<Row>${header}</Row>`,
    rows,
    "</Table>",
    "<WorksheetOptions xmlns=\"urn:schemas-microsoft-com:office:excel\">",
    "<FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal>",
    "<TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane>",
    "</WorksheetOptions>",
    "</Worksheet>",
  ].join("");
}

export function createExcelWorkbook(
  bundle: ExportBundle,
  scope: ExportScope,
) {
  const tables =
    scope === "transactions"
      ? [bundle.transactions]
      : [
          bundle.transactions,
          bundle.accounts,
          bundle.budgets,
          bundle.assets,
          bundle.liabilities,
        ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:o="urn:schemas-microsoft-com:office:office"',
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    "<DocumentProperties xmlns=\"urn:schemas-microsoft-com:office:office\">",
    "<Author>UangKu</Author>",
    "</DocumentProperties>",
    "<Styles>",
    '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/></Style>',
    '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/>',
    '<Interior ss:Color="#15966A" ss:Pattern="Solid"/></Style>',
    "</Styles>",
    tables.map(createWorksheet).join(""),
    "</Workbook>",
  ].join("");
}
