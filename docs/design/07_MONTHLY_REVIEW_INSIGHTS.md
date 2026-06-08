# UangKu — Monthly Review & Recommendations MVP

> **Phase**: Monthly Review & Recommendations MVP
> **Proposed route**: `/insights`
> **Status**: Design/technical specification before implementation
> **Source of truth**: `docs/UangKu_PRD.md` + this document

---

## 1. Feature Goal

Monthly Review helps users answer:

```txt
Uang saya bulan ini ke mana, dan apa yang perlu saya perhatikan?
```

The feature should summarize monthly money movement and surface practical, rule-based recommendations. It is not an AI advisor in this phase.

Primary outcomes:

- User understands income, expense, net cashflow, and saving rate for the current month.
- User sees top spending categories.
- User sees budget risk and overbudget categories.
- User sees investment and debt activity without confusing neutral movement with consumptive expense.
- User receives short Indonesian recommendations that are explainable and deterministic.

---

## 2. Route

Proposed route:

```txt
/insights
```

Route should live inside the authenticated app shell:

```txt
src/app/(app)/insights/page.tsx
src/app/(app)/insights/loading.tsx
```

---

## 3. Entry Points

Recommended primary entry:

```txt
Dashboard card/link: "Lihat Rekap Bulanan"
```

Optional secondary entry:

```txt
Settings link: "Rekap & Insight"
```

Dashboard is the best primary entry because Monthly Review is a natural follow-up from current month summary cards and budget warning.

---

## 4. Data Scope

MVP scope:

- Current month only.
- Use existing Asia/Jakarta month boundary helper.
- Use transaction data for the authenticated user.
- Month selector is postponed.

Required month boundary:

```txt
start: first day of current month at Asia/Jakarta 00:00
end: first day of next month at Asia/Jakarta 00:00
```

Implementation should reuse the current helper:

```txt
src/lib/date.ts -> getJakartaMonthRange()
```

Future extension:

- Month selector can pass explicit month/year and reuse the same calculation functions.

---

## 5. Calculation Rules

### 5.1 Income

Count only:

```txt
transactions.type = "income"
```

Formula:

```txt
monthly_income = sum(amount where type = income)
```

Do not count:

- transfer destination inflow
- investment sell proceeds
- debt principal movement

### 5.2 Expense

Count normal expense:

```txt
transactions.type = "expense"
```

Include admin/fee amounts from neutral movement transactions:

```txt
transfer.admin_fee_amount
investment_buy.admin_fee_amount
investment_sell.admin_fee_amount
debt_payment.admin_fee_amount
```

Formula:

```txt
monthly_expense =
  sum(amount where type = expense)
  + sum(admin_fee_amount where type in (
      transfer,
      investment_buy,
      investment_sell,
      debt_payment
    ))
```

### 5.3 Excluded From Expense

These are neutral principal/movement amounts and must not count as consumptive expense:

```txt
transfer.amount
investment_buy.amount
investment_sell.amount
debt_payment.amount
```

Reason:

- Transfer moves cash between accounts.
- Investment buy moves cash into asset value.
- Investment sell moves asset value into cash.
- Debt payment principal reduces liability while reducing cash, keeping net worth consistent.

### 5.4 Net Cashflow

Formula:

```txt
net_cashflow = monthly_income - monthly_expense
```

### 5.5 Saving Rate

Formula:

```txt
if monthly_income > 0:
  saving_rate = (monthly_income - monthly_expense) / monthly_income * 100

if monthly_income = 0:
  saving_rate = null
```

Display:

```txt
income > 0: "42%"
income = 0: "--"
```

### 5.6 Top Expense Categories

Show max 5 categories.

Include:

- Normal expense by `category_id`.
- Admin fee by `admin_fee_category_id`, usually `Biaya Admin`.

Exclude:

- transfer amount
- investment buy amount
- investment sell amount
- debt payment principal

Aggregation:

```txt
category_spending[transaction.category_id] += amount
  only when type = expense

category_spending[transaction.admin_fee_category_id] += admin_fee_amount
  when admin_fee_amount > 0 and admin_fee_category_id is not null
```

Sort:

```txt
spent desc
category_name asc as stable tie-breaker
limit 5
```

### 5.7 Budget Health

Reuse existing budget progress calculation rules:

- Budget progress counts expense transactions with matching category in the current month.
- Admin fee counts under `admin_fee_category_id`.
- Transfer, investment, and debt principal do not affect budget.

Status:

```txt
normal: progress < 80
warning: progress >= 80 and progress <= 100
overbudget: progress > 100
```

Insights page should show warning and overbudget categories first.

### 5.8 Investment Activity

Calculate separately from expense:

```txt
investment_buy_total = sum(amount where type = investment_buy)
investment_sell_total = sum(amount where type = investment_sell)
net_investment_flow = investment_buy_total - investment_sell_total
investment_fees = sum(admin_fee_amount where type in (
  investment_buy,
  investment_sell
))
```

Notes:

- Buy and sell amounts are movement/activity, not income/expense.
- Fees are counted as expense through the shared admin fee mechanism.

### 5.9 Debt Activity

Calculate separately from expense:

```txt
debt_principal_paid = sum(amount where type = debt_payment)
debt_fee_total = sum(admin_fee_amount where type = debt_payment)
```

Notes:

- Principal paid is liability reduction, not consumptive expense.
- Fee/bunga is expense through the shared admin fee mechanism.

---

## 6. Recommendation Rules

Recommendations must be deterministic and explainable. No AI, no paid API, no opaque scoring.

Recommended output shape:

```ts
type InsightSeverity = "good" | "info" | "warning" | "danger";

type InsightRecommendation = {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  privacyBody?: string;
};
```

Ordering:

```txt
danger first
warning second
info third
good last
stable order inside same severity
```

### 6.1 No Income Recorded

Condition:

```txt
monthly_income = 0
and has_monthly_transactions = true
```

Severity:

```txt
warning
```

Copy:

```txt
Title: "Belum ada pemasukan tercatat"
Body: "Bulan ini belum ada pemasukan yang tercatat. Kalau ada gaji atau pemasukan lain, catat agar rekap bulan ini lebih akurat."
```

Privacy mode:

```txt
Same copy is safe because no exact amount is shown.
```

### 6.2 Low Saving Rate

Condition:

```txt
monthly_income > 0
and saving_rate < 10
```

Severity:

```txt
warning
```

Copy:

```txt
Title: "Saving rate masih rendah"
Body: "Sisa cashflow bulan ini masih tipis. Coba cek kategori pengeluaran terbesar sebelum tambah pengeluaran baru."
```

Privacy mode:

```txt
Title: "Saving rate perlu dipantau"
Body: "Cashflow bulan ini masih perlu dijaga. Coba cek kategori pengeluaran terbesar."
```

### 6.3 Healthy Saving Rate

Condition:

```txt
monthly_income > 0
and saving_rate >= 20
and monthly_expense > 0
```

Severity:

```txt
good
```

Copy:

```txt
Title: "Cashflow bulan ini sehat"
Body: "Saving rate kamu cukup aman bulan ini. Pertahankan ritme pengeluaran dan alokasi tabungan/investasi."
```

Privacy mode:

```txt
Title: "Cashflow bulan ini sehat"
Body: "Pola pengeluaran bulan ini terlihat cukup aman."
```

### 6.4 Overbudget

Condition:

```txt
any budget.progress_percent > 100
```

Severity:

```txt
danger
```

Copy:

```txt
Title: "Ada budget yang sudah lewat"
Body: "{category_name} sudah melewati budget bulan ini. Pertimbangkan tahan pengeluaran di kategori ini dulu."
```

If multiple:

```txt
Body: "{count} kategori sudah melewati budget bulan ini. Mulai dari kategori dengan progress tertinggi."
```

Privacy mode:

```txt
Body: "Ada kategori yang sudah melewati budget bulan ini. Cek detail budget saat kondisi aman."
```

### 6.5 Near Budget Limit

Condition:

```txt
any budget.progress_percent >= 80
and budget.progress_percent <= 100
```

Severity:

```txt
warning
```

Copy:

```txt
Title: "Budget hampir habis"
Body: "{category_name} sudah mendekati batas budget. Pantau pengeluaran kategori ini sampai akhir bulan."
```

Privacy mode:

```txt
Body: "Ada budget yang hampir habis. Pantau kategori ini sampai akhir bulan."
```

### 6.6 High Food/Jajan Spending

Condition:

```txt
top expense category name includes one of:
- makan
- jajan
- kopi
- restoran
- food
and category_spending / monthly_expense >= 0.30
and monthly_expense > 0
```

Severity:

```txt
info
```

Copy:

```txt
Title: "Pengeluaran makan/jajan cukup dominan"
Body: "Kategori makan atau jajan cukup besar bulan ini. Kalau mau hemat cepat, kategori ini biasanya paling mudah dipantau."
```

Privacy mode:

```txt
Same copy is safe because no exact amount is shown.
```

### 6.7 High Admin Fee

Condition:

```txt
admin_fee_total >= 50000
or (
  monthly_expense > 0
  and admin_fee_total / monthly_expense >= 0.05
)
```

Severity:

```txt
info
```

Copy:

```txt
Title: "Biaya admin mulai terasa"
Body: "Biaya admin bulan ini cukup terlihat. Coba cek pola transfer, investasi, atau pembayaran hutang yang sering kena biaya."
```

Privacy mode:

```txt
Title: "Biaya admin perlu dipantau"
Body: "Ada biaya admin yang cukup terlihat bulan ini. Cek pola transaksi saat kondisi aman."
```

### 6.8 Positive Investment Activity

Condition:

```txt
investment_buy_total > 0
and net_investment_flow > 0
```

Severity:

```txt
good
```

Copy:

```txt
Title: "Ada alokasi ke investasi"
Body: "Bulan ini kamu menambah alokasi investasi. Pastikan tetap sesuai tujuan dan dana darurat."
```

Privacy mode:

```txt
Same copy is safe because no exact amount is shown.
```

### 6.9 Investment Sell Activity

Condition:

```txt
investment_sell_total > investment_buy_total
```

Severity:

```txt
info
```

Copy:

```txt
Title: "Ada penarikan investasi"
Body: "Bulan ini nilai penarikan investasi lebih besar dari top up. Pastikan alasannya memang sesuai rencana."
```

Privacy mode:

```txt
Same copy is safe because no exact amount is shown.
```

### 6.10 Debt Progress

Condition:

```txt
debt_principal_paid > 0
```

Severity:

```txt
good
```

Copy:

```txt
Title: "Hutang berkurang bulan ini"
Body: "Kamu sudah membayar pokok hutang bulan ini. Ini membantu net worth tetap lebih sehat."
```

Privacy mode:

```txt
Same copy is safe because no exact amount is shown.
```

### 6.11 Debt Fee/Bunga

Condition:

```txt
debt_fee_total > 0
```

Severity:

```txt
info
```

Copy:

```txt
Title: "Ada biaya atau bunga hutang"
Body: "Biaya atau bunga hutang tetap dihitung sebagai pengeluaran. Pantau agar tidak membesar dari bulan ke bulan."
```

Privacy mode:

```txt
Same copy is safe because no exact amount is shown.
```

---

## 7. Privacy Mode Behavior

Privacy Mode must protect financial condition, not only raw rupiah values.

Mask:

- income amount
- expense amount
- net cashflow
- top category spending amount
- budget spent, budget amount, remaining amount
- investment buy/sell/net flow
- debt principal paid
- debt fee/bunga
- admin fee total
- saving rate percentage
- budget progress percentage if current privacy behavior treats budget progress as sensitive

Display examples:

```txt
Rp••••••
••%
--
```

Recommendation behavior:

- Avoid exact values in Privacy Mode.
- Avoid exact percentages.
- Use qualitative copy.

Example:

```txt
Normal:
"Saving rate kamu 7%. Coba cek kategori pengeluaran terbesar."

Privacy:
"Cashflow bulan ini masih perlu dijaga. Coba cek kategori pengeluaran terbesar."
```

---

## 8. UI Layout

Mobile-first order:

```txt
1. PageIntro
2. Monthly summary card
3. Top expense categories
4. Budget health
5. Investment & debt activity
6. Recommendation cards
7. Empty state
```

### 8.1 PageIntro

Copy:

```txt
Eyebrow: Rekap Bulanan
Title: Insight
Description: Lihat ringkasan bulan ini dan hal yang perlu kamu perhatikan.
```

### 8.2 Monthly Summary Card

Show:

- income
- expense
- net cashflow
- saving rate
- month label

Style:

- Use existing `rounded-card`, `bg-surface`, `border-border`, `shadow-card`.
- Highlight net cashflow with income/expense color depending positive/negative.

### 8.3 Top Expense Categories

Show max 5 rows:

```txt
Category name
Amount
Percentage of monthly expense
Small progress bar
```

Progress bar should cap visually at 100%.

### 8.4 Budget Health

Show:

- overbudget items first
- warning items second
- normal healthy summary if no warning/overbudget

Copy examples:

```txt
"2 budget perlu perhatian"
"Semua budget masih aman"
```

### 8.5 Investment & Debt Activity

Use one compact card or two small cards:

Investment:

```txt
Top up investasi
Tarik investasi
Net flow investasi
Biaya investasi
```

Debt:

```txt
Pokok hutang dibayar
Biaya/bunga hutang
```

### 8.6 Recommendation Cards

Each recommendation:

```txt
severity badge
title
body
optional CTA
```

Severity styling:

```txt
good: income/accent soft
info: accent/transfer soft
warning: warning/orange soft
danger: expense soft
```

---

## 9. Empty State

If no transactions exist in the current month:

```txt
Title: "Belum ada data bulan ini."
Body: "Catat transaksi dulu agar UangKu bisa membuat rekap bulanan."
```

CTA options:

```txt
Primary: "Catat Transaksi" -> /cashflow/new
Secondary: "Input via Chat" -> /chat
```

Do not show recommendation cards when there is no monthly data.

---

## 10. Component Proposal

Route:

```txt
src/app/(app)/insights/page.tsx
src/app/(app)/insights/loading.tsx
```

Data layer:

```txt
src/lib/insights/data.ts
src/lib/insights/types.ts
src/lib/insights/recommendations.ts
```

Components:

```txt
src/components/insights/monthly-summary-card.tsx
src/components/insights/top-expense-card.tsx
src/components/insights/budget-health-card.tsx
src/components/insights/activity-card.tsx
src/components/insights/recommendation-card.tsx
```

Suggested type model:

```ts
export type MonthlyReviewData = {
  monthLabel: string;
  hasTransactions: boolean;
  income: number;
  expense: number;
  netCashflow: number;
  savingRate: number | null;
  topExpenseCategories: TopExpenseCategory[];
  budgetHealth: BudgetHealthItem[];
  investmentActivity: InvestmentActivity;
  debtActivity: DebtActivity;
  recommendations: InsightRecommendation[];
  error: string | null;
};
```

---

## 11. What To Implement Now

MVP implementation scope:

- Current month only.
- Rule-based recommendations only.
- Reuse existing transaction, budget, account, asset, and liability data.
- Reuse Asia/Jakarta month boundary helper.
- Reuse existing privacy mode behavior and money masking components.
- No new database schema if avoidable.
- No changes to financial RPC behavior.

---

## 12. What To Postpone

Postpone:

- AI-generated advice.
- Month selector.
- Comparison with previous month.
- Charts.
- Notifications.
- PDF report.
- Email report.
- Realtime recommendations.
- Paid APIs.

---

## 13. Testing Checklist

### Data Calculation

- Income counts only `income`.
- Expense counts `expense.amount`.
- Expense includes admin fees from transfer, investment buy, investment sell, and debt payment.
- Transfer amount is excluded from expense.
- Investment buy amount is excluded from expense.
- Investment sell amount is excluded from income and expense.
- Debt payment principal is excluded from expense.
- Net cashflow equals income minus expense.
- Saving rate is null/displayed as `--` when income is zero.
- Top expense categories include `Biaya Admin` when admin fees exist.
- Top expense categories exclude neutral movement principal.

### Budget

- Budget warning appears at `>= 80` and `<= 100`.
- Overbudget appears at `> 100`.
- Admin fee affects `Biaya Admin` budget if that budget exists.
- Transfer/investment/debt principal does not affect budget.

### Recommendations

- Low saving rate recommendation appears when saving rate is below threshold.
- Overbudget recommendation appears for overbudget category.
- Near budget recommendation appears for category at 80-100%.
- Food/jajan recommendation appears when food/jajan is dominant.
- Admin fee recommendation appears when admin fee is high.
- Investment activity recommendation appears when buy activity exists.
- Debt progress recommendation appears when debt principal was paid.
- No income recommendation appears when there are transactions but no income.

### Privacy Mode

- Financial amounts are masked.
- Sensitive percentages are masked.
- Recommendation copy avoids exact values.

### UI

- `/insights` loads inside authenticated app shell.
- Empty state appears when no current-month transactions exist.
- CTA links go to `/cashflow/new` and `/chat`.
- Mobile layout does not feel crowded.

---

## 14. Implementation Notes

- Prefer server-side data aggregation in `src/lib/insights/data.ts`.
- Keep recommendation generation pure in `src/lib/insights/recommendations.ts`.
- Avoid client-side filtering of large transaction lists.
- Select only columns needed:

```txt
transactions:
type, amount, admin_fee_amount, category_id, admin_fee_category_id, transaction_date

categories:
id, name

budgets:
id, category_id, amount, start_date, end_date, period, is_active
```

- Use existing budget progress helper if available. If not, keep calculation identical to `src/lib/budgets/data.ts`.
- Keep all auth/RLS behavior unchanged.
