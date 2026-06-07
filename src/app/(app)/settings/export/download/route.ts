import type { NextRequest } from "next/server";
import { createCsv } from "@/lib/export/csv";
import { getExportData, ExportDataError } from "@/lib/export/data";
import { createExcelWorkbook } from "@/lib/export/excel";
import type { ExportFormat, ExportScope } from "@/lib/export/types";

export const runtime = "nodejs";

function getExportOptions(request: NextRequest): {
  format: ExportFormat;
  scope: ExportScope;
} | null {
  const format = request.nextUrl.searchParams.get("format");
  const scope = request.nextUrl.searchParams.get("scope");

  if (
    (format !== "csv" && format !== "excel") ||
    (scope !== "transactions" && scope !== "all")
  ) {
    return null;
  }

  return { format, scope };
}

export async function GET(request: NextRequest) {
  const options = getExportOptions(request);

  if (!options) {
    return new Response("Pilihan export tidak valid.", { status: 400 });
  }

  try {
    const data = await getExportData();
    const date = new Date().toISOString().slice(0, 10);
    const scopeName =
      options.scope === "transactions" ? "transaksi" : "semua-data";
    const extension = options.format === "csv" ? "csv" : "xls";
    const filename = `uangku-${scopeName}-${date}.${extension}`;
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    });

    if (options.format === "csv") {
      headers.set("Content-Type", "text/csv; charset=utf-8");
      return new Response(createCsv(data, options.scope), { headers });
    }

    headers.set(
      "Content-Type",
      "application/vnd.ms-excel; charset=utf-8",
    );
    const workbook = createExcelWorkbook(data, options.scope);

    return new Response(workbook, { headers });
  } catch (error) {
    if (error instanceof ExportDataError && error.code === "UNAUTHORIZED") {
      return new Response("Silakan masuk kembali untuk melakukan export.", {
        status: 401,
      });
    }

    return new Response("Data belum berhasil diexport. Coba lagi nanti.", {
      status: 500,
    });
  }
}
