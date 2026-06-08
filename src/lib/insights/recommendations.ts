import type {
  BudgetHealthItem,
  DebtActivity,
  InsightRecommendation,
  InsightSeverity,
  InvestmentActivity,
  TopExpenseCategory,
} from "@/lib/insights/types";

type RecommendationInput = {
  hasMonthlyTransactions: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
  savingRate: number | null;
  adminFeeTotal: number;
  topExpenseCategories: TopExpenseCategory[];
  budgetHealth: BudgetHealthItem[];
  investmentActivity: InvestmentActivity;
  debtActivity: DebtActivity;
};

const FOOD_KEYWORDS = ["makan", "jajan", "kopi", "restoran", "food"];

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
  topExpenseCategories,
  budgetHealth,
  investmentActivity,
  debtActivity,
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

  if (monthlyIncome > 0 && savingRate !== null && savingRate < 10) {
    recommendations.push({
      id: "low-saving-rate",
      severity: "warning",
      title: "Saving rate masih rendah",
      body: "Sisa cashflow bulan ini masih tipis. Coba cek kategori pengeluaran terbesar sebelum tambah pengeluaran baru.",
      privacyBody:
        "Cashflow bulan ini masih perlu dijaga. Coba cek kategori pengeluaran terbesar.",
    });
  }

  if (monthlyIncome > 0 && savingRate !== null && savingRate >= 20 && monthlyExpense > 0) {
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
    recommendations.push({
      id: "overbudget",
      severity: "danger",
      title: "Ada budget yang sudah lewat",
      body:
        overbudgetItems.length === 1
          ? `${overbudgetItems[0].categoryName} sudah melewati budget bulan ini. Pertimbangkan tahan pengeluaran di kategori ini dulu.`
          : `${overbudgetItems.length} kategori sudah melewati budget bulan ini. Mulai dari kategori dengan progress tertinggi.`,
      privacyBody:
        "Ada kategori yang sudah melewati budget bulan ini. Cek detail budget saat kondisi aman.",
    });
  }

  const nearBudgetItems = budgetHealth.filter(
    (budget) => budget.status === "warning",
  );
  if (nearBudgetItems.length > 0) {
    recommendations.push({
      id: "near-budget-limit",
      severity: "warning",
      title: "Budget hampir habis",
      body: `${nearBudgetItems[0].categoryName} sudah mendekati batas budget. Pantau pengeluaran kategori ini sampai akhir bulan.`,
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
      body: "Kategori makan atau jajan cukup besar bulan ini. Kalau mau hemat cepat, kategori ini biasanya paling mudah dipantau.",
    });
  }

  if (
    adminFeeTotal >= 50_000 ||
    (monthlyExpense > 0 && adminFeeTotal / monthlyExpense >= 0.05)
  ) {
    recommendations.push({
      id: "high-admin-fee",
      severity: "info",
      title: "Biaya admin mulai terasa",
      body: "Biaya admin bulan ini cukup terlihat. Coba cek pola transfer, investasi, atau pembayaran hutang yang sering kena biaya.",
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

  if (debtActivity.feeTotal > 0) {
    recommendations.push({
      id: "debt-fee",
      severity: "info",
      title: "Ada biaya atau bunga hutang",
      body: "Biaya atau bunga hutang tetap dihitung sebagai pengeluaran. Pantau agar tidak membesar dari bulan ke bulan.",
    });
  }

  return recommendations.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}
