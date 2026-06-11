import type {
  AdminFeeBreakdownItem,
  BudgetHealthItem,
  DebtActivity,
  InsightRecommendation,
  InsightSeverity,
  InvestmentActivity,
  MonthlyProjection,
  TopExpenseCategory,
} from "@/lib/insights/types";
import { formatIdr } from "../format";

type RecommendationInput = {
  hasMonthlyTransactions: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
  savingRate: number | null;
  adminFeeTotal: number;
  adminFeeBreakdown: AdminFeeBreakdownItem[];
  topExpenseCategories: TopExpenseCategory[];
  budgetHealth: BudgetHealthItem[];
  investmentActivity: InvestmentActivity;
  debtActivity: DebtActivity;
  projection: MonthlyProjection;
};

const FOOD_KEYWORDS = ["makan", "jajan", "kopi", "restoran", "food"];
const SAVING_RATE_TARGET = 20;

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  danger: 0,
  warning: 1,
  info: 2,
  good: 3,
};

export function buildInsightRecommendations({
  hasMonthlyTransactions,
  monthlyIncome,
  monthlyExpense,
  savingRate,
  adminFeeTotal,
  adminFeeBreakdown,
  topExpenseCategories,
  budgetHealth,
  investmentActivity,
  debtActivity,
  projection,
}: RecommendationInput): InsightRecommendation[] {
  const recommendations: InsightRecommendation[] = [];

  if (monthlyIncome === 0 && hasMonthlyTransactions) {
    recommendations.push({
      id: "no-income-recorded",
      severity: "warning",
      title: "Belum ada pemasukan tercatat",
      body: "Bulan ini belum ada pemasukan yang tercatat. Kalau ada gaji atau pemasukan lain, catat agar rekap bulan ini lebih akurat.",
    });
  }

  if (
    monthlyIncome > 0 &&
    savingRate !== null &&
    savingRate < SAVING_RATE_TARGET
  ) {
    const reductionToTarget = Math.max(
      0,
      monthlyExpense -
        monthlyIncome * (1 - SAVING_RATE_TARGET / 100),
    );

    recommendations.push({
      id: "low-saving-rate",
      severity: "warning",
      title: "Saving rate di bawah target",
      body:
        reductionToTarget > 0
          ? `Kurangi pengeluaran sekitar ${formatIdr(
              reductionToTarget,
            )} agar saving rate bulan ini kembali ke target ${SAVING_RATE_TARGET}%. Mulai dari kategori pengeluaran terbesar.`
          : "Jaga pengeluaran berikutnya agar saving rate tidak kembali turun.",
      privacyBody:
        "Cashflow bulan ini perlu dijaga. Mulai dari kategori pengeluaran terbesar agar saving rate membaik.",
    });
  }

  if (
    monthlyIncome > 0 &&
    savingRate !== null &&
    savingRate >= SAVING_RATE_TARGET &&
    monthlyExpense > 0
  ) {
    recommendations.push({
      id: "healthy-saving-rate",
      severity: "good",
      title: "Cashflow bulan ini sehat",
      body: "Saving rate kamu cukup aman bulan ini. Pertahankan ritme pengeluaran dan alokasi tabungan/investasi.",
      privacyBody: "Pola pengeluaran bulan ini terlihat cukup aman.",
    });
  }

  const overbudgetItems = budgetHealth.filter(
    (budget) => budget.status === "overbudget",
  );
  if (overbudgetItems.length > 0) {
    const highestOverbudget = overbudgetItems.reduce((highest, budget) =>
      Math.abs(budget.remaining) > Math.abs(highest.remaining)
        ? budget
        : highest,
    );

    recommendations.push({
      id: "overbudget",
      severity: "danger",
      title: "Ada budget yang sudah lewat",
      body:
        overbudgetItems.length === 1
          ? `${overbudgetItems[0].categoryName} sudah melebihi budget sebesar ${formatIdr(
              Math.abs(overbudgetItems[0].remaining),
            )}. Tahan pengeluaran tambahan di kategori ini sampai bulan berikutnya.`
          : `${overbudgetItems.length} kategori sudah melewati budget. Kelebihan terbesar ada di ${highestOverbudget.categoryName}, sebesar ${formatIdr(
              Math.abs(highestOverbudget.remaining),
            )}.`,
      privacyBody:
        "Ada kategori yang sudah melewati budget bulan ini. Cek detail budget saat kondisi aman.",
    });
  }

  const nearBudgetItems = budgetHealth.filter(
    (budget) => budget.status === "warning",
  );
  if (nearBudgetItems.length > 0) {
    const budget = nearBudgetItems[0];
    const remainingDays = projection.available
      ? Math.max(1, projection.totalDays - projection.elapsedDays)
      : null;
    const dailyAllowance =
      remainingDays && budget.remaining > 0
        ? budget.remaining / remainingDays
        : null;

    recommendations.push({
      id: "near-budget-limit",
      severity: "warning",
      title: "Budget hampir habis",
      body:
        dailyAllowance !== null
          ? `${budget.categoryName} tersisa ${formatIdr(
              budget.remaining,
            )} untuk ${remainingDays} hari tersisa. Jaga pengeluaran sekitar ${formatIdr(
              dailyAllowance,
            )} per hari agar tidak melewati budget.`
          : `${budget.categoryName} tersisa ${formatIdr(
              Math.max(0, budget.remaining),
            )}. Pantau pengeluaran kategori ini sampai akhir periode.`,
      privacyBody:
        "Ada budget yang hampir habis. Pantau kategori ini sampai akhir bulan.",
    });
  }

  const foodCategory = topExpenseCategories.find((category) =>
    FOOD_KEYWORDS.some((keyword) =>
      category.categoryName.toLowerCase().includes(keyword),
    ),
  );
  if (
    foodCategory &&
    monthlyExpense > 0 &&
    foodCategory.spent / monthlyExpense >= 0.3
  ) {
    recommendations.push({
      id: "high-food-spending",
      severity: "info",
      title: "Pengeluaran makan/jajan cukup dominan",
      body: `${foodCategory.categoryName} sudah menyerap ${Math.round(
        foodCategory.sharePercent,
      )}% pengeluaran bulan ini (${formatIdr(
        foodCategory.spent,
      )}). Jadikan kategori ini prioritas pertama untuk dikurangi.`,
    });
  }

  if (
    adminFeeTotal >= 50_000 ||
    (monthlyExpense > 0 && adminFeeTotal / monthlyExpense >= 0.05)
  ) {
    const largestFeeSource = adminFeeBreakdown[0];

    recommendations.push({
      id: "high-admin-fee",
      severity: "info",
      title: "Biaya admin mulai terasa",
      body: largestFeeSource
        ? `Biaya admin bulan ini mencapai ${formatIdr(
            adminFeeTotal,
          )}. Sumber terbesar berasal dari ${largestFeeSource.label}, sebesar ${formatIdr(
            largestFeeSource.amount,
          )} (${Math.round(largestFeeSource.sharePercent)}%).`
        : `Biaya admin bulan ini mencapai ${formatIdr(
            adminFeeTotal,
          )}. Periksa transaksi berbiaya yang bisa dikurangi.`,
      privacyBody:
        "Ada biaya admin yang cukup terlihat bulan ini. Cek pola transaksi saat kondisi aman.",
    });
  }

  if (investmentActivity.buyTotal > 0 && investmentActivity.netFlow > 0) {
    recommendations.push({
      id: "positive-investment-activity",
      severity: "good",
      title: "Ada alokasi ke investasi",
      body: "Bulan ini kamu menambah alokasi investasi. Pastikan tetap sesuai tujuan dan dana darurat.",
    });
  }

  if (investmentActivity.sellTotal > investmentActivity.buyTotal) {
    recommendations.push({
      id: "investment-sell-activity",
      severity: "info",
      title: "Ada penarikan investasi",
      body: "Bulan ini nilai penarikan investasi lebih besar dari top up. Pastikan alasannya memang sesuai rencana.",
    });
  }

  if (debtActivity.principalPaid > 0) {
    recommendations.push({
      id: "debt-progress",
      severity: "good",
      title: "Hutang berkurang bulan ini",
      body: "Kamu sudah membayar pokok hutang bulan ini. Ini membantu net worth tetap lebih sehat.",
    });
  }

  if (debtActivity.status === "heavy") {
    recommendations.push({
      id: "heavy-debt-burden",
      severity: "danger",
      title: "Beban cicilan berat",
      body: `Pembayaran cicilan sudah mengambil ${Math.round(
        debtActivity.paymentToIncomeRatio ?? 0,
      )}% pemasukan bulan ini (${formatIdr(
        debtActivity.totalPaid,
      )}). Hindari cicilan baru sampai rasio kembali di bawah 30%.`,
      privacyBody:
        "Beban cicilan bulan ini terlihat berat. Pertimbangkan tahan cicilan baru dulu.",
    });
  } else if (debtActivity.status === "watch") {
    recommendations.push({
      id: "watch-debt-burden",
      severity: "warning",
      title: "Beban cicilan perlu dipantau",
      body: `Pembayaran cicilan sudah mencapai ${Math.round(
        debtActivity.paymentToIncomeRatio ?? 0,
      )}% pemasukan bulan ini. Gunakan batas 30% sebagai alarm sebelum menambah cicilan baru.`,
      privacyBody:
        "Beban cicilan bulan ini perlu dipantau sebelum menambah kewajiban baru.",
    });
  }

  if (debtActivity.feeTotal > 0) {
    recommendations.push({
      id: "debt-fee",
      severity: "info",
      title: "Ada biaya atau bunga hutang",
      body: "Biaya atau bunga hutang tetap dihitung sebagai pengeluaran. Pantau agar tidak membesar dari bulan ke bulan.",
    });
  }

  if (projection.available && projection.projectedNetCashflow < 0) {
    const reductionNeeded = Math.abs(projection.projectedNetCashflow);

    recommendations.push({
      id: "projected-negative-cashflow",
      severity: "danger",
      title: "Cashflow berpotensi negatif",
      body: `Jika pola saat ini berlanjut, cashflow akhir bulan berpotensi minus ${formatIdr(
        reductionNeeded,
      )}. Kurangi proyeksi pengeluaran setidaknya sebesar nominal tersebut.`,
      privacyBody:
        "Pola pengeluaran saat ini berpotensi membuat cashflow akhir bulan negatif.",
    });
  }

  if (projection.available && projection.budgetRisks.length > 0) {
    const highestRisk = projection.budgetRisks[0];

    recommendations.push({
      id: "projected-overbudget",
      severity: "warning",
      title: "Budget berpotensi terlewati",
      body:
        projection.budgetRisks.length === 1
          ? `${highestRisk.categoryName} diproyeksikan melebihi budget sekitar ${formatIdr(
              highestRisk.projectedOverrun,
            )}. Kurangi laju pengeluaran kategori ini mulai sekarang.`
          : `${projection.budgetRisks.length} kategori berpotensi melewati budget. Risiko terbesar ada di ${highestRisk.categoryName}, sekitar ${formatIdr(
              highestRisk.projectedOverrun,
            )} di atas batas.`,
      privacyBody:
        "Ada budget yang berpotensi terlewati sebelum akhir bulan.",
    });
  }

  return recommendations.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}
