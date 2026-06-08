import type { Metadata } from "next";
import Link from "next/link";
import { ActivityCard } from "@/components/insights/activity-card";
import { BudgetHealthCard } from "@/components/insights/budget-health-card";
import { MonthlySummaryCard } from "@/components/insights/monthly-summary-card";
import { RecommendationCard } from "@/components/insights/recommendation-card";
import { TopExpenseCard } from "@/components/insights/top-expense-card";
import { PageIntro } from "@/components/ui/page-intro";
import { getMonthlyReviewData } from "@/lib/insights/data";

export const metadata: Metadata = {
  title: "Rekap Bulanan",
};

export default async function InsightsPage() {
  const data = await getMonthlyReviewData();

  return (
    <>
      <PageIntro
        eyebrow={data.monthLabel}
        title="Rekap Bulanan"
        description="Lihat ke mana uangmu bulan ini dan apa yang perlu diperhatikan."
      />

      {data.error ? (
        <div className="mb-5 rounded-card border border-expense/20 bg-expense/10 p-4 text-sm text-expense">
          {data.error}
        </div>
      ) : null}

      {!data.hasMonthlyTransactions ? (
        <EmptyInsightsState />
      ) : (
        <div className="space-y-6">
          <MonthlySummaryCard
            monthLabel={data.monthLabel}
            income={data.monthlyIncome}
            expense={data.monthlyExpense}
            netCashflow={data.netCashflow}
            savingRate={data.savingRate}
          />

          <TopExpenseCard categories={data.topExpenseCategories} />

          <BudgetHealthCard budgets={data.budgetHealth} />

          <ActivityCard
            investment={data.investmentActivity}
            debt={data.debtActivity}
          />

          <RecommendationCard recommendations={data.recommendations} />
        </div>
      )}
    </>
  );
}

function EmptyInsightsState() {
  return (
    <section className="rounded-card border border-dashed border-accent/30 bg-surface p-6 text-center shadow-card">
      <h2 className="text-lg font-bold">Belum ada data bulan ini.</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
        Catat transaksi pertama lewat form cashflow atau chat agar rekap bulanan
        bisa dihitung.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/cashflow/new"
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground"
        >
          Catat transaksi
        </Link>
        <Link
          href="/chat"
          className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-5 text-sm font-bold"
        >
          Buka Chat
        </Link>
      </div>
    </section>
  );
}
