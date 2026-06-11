import type {
  InsightRecommendation,
  TopExpenseCategory,
} from "@/lib/insights/types";
import type { ManualTransactionType } from "@/lib/cashflow/types";

type CashflowDrilldownInput = {
  monthKey: string;
  type?: ManualTransactionType;
  categoryId?: string;
};

export function buildCashflowDrilldownHref({
  monthKey,
  type,
  categoryId,
}: CashflowDrilldownInput) {
  const params = new URLSearchParams({ month: monthKey });

  if (type) {
    params.set("type", type);
  }

  if (categoryId) {
    params.set("category", categoryId);
  }

  return `/cashflow?${params.toString()}`;
}

export function addRecommendationActions(
  recommendations: InsightRecommendation[],
  {
    monthKey,
    topExpenseCategories,
  }: {
    monthKey: string;
    topExpenseCategories: TopExpenseCategory[];
  },
) {
  const foodCategory = topExpenseCategories.find((category) =>
    ["makan", "jajan", "kopi", "restoran", "food"].some((keyword) =>
      category.categoryName.toLowerCase().includes(keyword),
    ),
  );
  const adminFeeCategory = topExpenseCategories.find(
    (category) => category.categoryName.toLowerCase() === "biaya admin",
  );

  return recommendations.map((recommendation) => {
    if (
      recommendation.id === "overbudget" ||
      recommendation.id === "near-budget-limit" ||
      recommendation.id === "projected-overbudget"
    ) {
      return {
        ...recommendation,
        actionHref: "/settings/budgets",
        actionLabel: "Lihat budget",
      };
    }

    if (
      recommendation.id === "positive-investment-activity" ||
      recommendation.id === "investment-sell-activity"
    ) {
      return {
        ...recommendation,
        actionHref: "/portfolio",
        actionLabel: "Lihat portfolio",
      };
    }

    if (recommendation.id === "projected-negative-cashflow") {
      return {
        ...recommendation,
        actionHref: buildCashflowDrilldownHref({ monthKey }),
        actionLabel: "Lihat cashflow",
      };
    }

    if (
      recommendation.id === "debt-progress" ||
      recommendation.id === "debt-fee" ||
      recommendation.id === "heavy-debt-burden" ||
      recommendation.id === "watch-debt-burden"
    ) {
      return {
        ...recommendation,
        actionHref: buildCashflowDrilldownHref({
          monthKey,
          type: "debt_payment",
        }),
        actionLabel: "Lihat pembayaran",
      };
    }

    if (recommendation.id === "high-food-spending" && foodCategory) {
      return {
        ...recommendation,
        actionHref: buildCashflowDrilldownHref({
          monthKey,
          categoryId: foodCategory.categoryId,
        }),
        actionLabel: "Lihat transaksi",
      };
    }

    if (recommendation.id === "high-admin-fee" && adminFeeCategory) {
      return {
        ...recommendation,
        actionHref: buildCashflowDrilldownHref({
          monthKey,
          categoryId: adminFeeCategory.categoryId,
        }),
        actionLabel: "Lihat biaya admin",
      };
    }

    return {
      ...recommendation,
      actionHref: buildCashflowDrilldownHref({ monthKey }),
      actionLabel: "Lihat cashflow",
    };
  });
}
