# UangKu Dashboard — UX/UI Design Spec (MVP)

> **Fase**: Dashboard Cashflow Dasar
> **Target**: Mobile-first, max-width 480px (sesuai `AppShell`)
> **Viewport Ref**: padded content area ~440px usable, 28px bottom padding to bottom nav

---

## 1. Page Goal

Menjawab **satu pertanyaan utama** setiap kali user membuka app:

> *"Kondisi keuangan saya bulan ini gimana?"*

Dashboard MVP harus bisa menyampaikan:
- Sisa uang bulan ini (income − expense)
- Berapa total income dan expense bulan ini
- Saving rate: seberapa besar porsi yang tidak dikonsumsi
- Saldo akun-akun yang user miliki
- Transaksi terakhir yang sudah dicatat

Dashboard **bukan** halaman analisis mendalam. Itu adalah **snapshot kilat** — user buka, lihat angka, paham, lanjut hidup.

---

## 2. Mobile Layout (Top → Bottom)

```
┌──────────────────────────────────┐
│  PageIntro Header                │  ← Eyebrow + greeting
├──────────────────────────────────┤
│  🟢 Hero Card: Sisa Bulan Ini   │  ← Primary number, accent bg
│     + Income/Expense mini row    │
├──────────────────────────────────┤
│  [Saving Rate] [Cashflow ±]     │  ← Two half-width stat cards
├──────────────────────────────────┤
│  Saldo Akun                     │  ← Account balances section
│  ┌───────┐ ┌───────┐ ┌───────┐  │
│  │ BCA   │ │ Jago  │ │GoPay  │  │
│  │ Rp2jt │ │ Rp1jt │ │Rp150k │  │
│  └───────┘ └───────┘ └───────┘  │
├──────────────────────────────────┤
│  Transaksi Terakhir              │  ← Section header + "Lihat semua"
│  ┌──────────────────────────────┐│
│  │ Makan · BCA     -Rp25.000   ││
│  ├──────────────────────────────┤│
│  │ Gaji · BCA     +Rp4.700.000 ││
│  ├──────────────────────────────┤│
│  │ Transfer · BCA → GoPay      ││
│  └──────────────────────────────┘│
├──────────────────────────────────┤
│  PlaceholderCard: Portfolio      │  ← "Segera hadir" teaser
├──────────────────────────────────┤
│          (bottom spacing)        │
│  ══════ Bottom Navigation ══════ │
└──────────────────────────────────┘
```

### Scroll Order Logic

| Order | Section | Rationale |
|-------|---------|-----------|
| 1 | PageIntro (greeting) | Orientasi — user tahu di mana |
| 2 | Hero: Sisa Bulan Ini | Jawaban utama, paling penting |
| 3 | Saving Rate + Cashflow | Konteks tambahan hero |
| 4 | Saldo Akun | "Uang saya ada di mana?" |
| 5 | Transaksi Terakhir | "Apa yang baru saya catat?" |
| 6 | Portfolio placeholder | Hint fitur yang akan datang |

---

## 3. Above-the-Fold Hierarchy

Pada device umum (iPhone SE 375×667 sampai iPhone 15 390×844), **above the fold** harus menampilkan:

1. **PageIntro greeting** — compact, 2 lines max
2. **Hero Card** — fully visible, angka `Sisa Bulan Ini` terbaca jelas
3. **Saving Rate + Cashflow** — setidaknya partially visible

### Visual Weight Rule

```
Hero number  →  text-3xl font-bold (largest on page)
Income/Expense → text-base font-bold (supporting)
Saving Rate   → text-2xl font-bold (secondary KPI)
Account saldo → text-lg font-bold (tertiary)
Transaksi     → text-sm (browseable list)
```

---

## 4. Card Hierarchy

### 4a. Hero Card — "Sisa Bulan Ini"

```
┌──────────────────────────────────────┐
│  SISA BULAN INI · Juni 2026          │  ← eyebrow, uppercase, xs
│                                      │
│  Rp2.850.000                         │  ← text-3xl, bold, white
│                                      │
│  ┌────────────┐  ┌────────────┐      │
│  │ ↑ Income   │  │ ↓ Expense  │      │
│  │ Rp4.700.000│  │ Rp1.850.000│      │
│  └────────────┘  └────────────┘      │
└──────────────────────────────────────┘
```

**Design tokens:**
- Background: `bg-accent` (tema warna user — emerald default)
- Text: `text-accent-foreground` (white)
- Income/Expense pills: `bg-white/15 backdrop-blur` rounded pills
- Income arrow `↑` in hijau muda, expense arrow `↓` in pink/merah muda
- `rounded-card` (1.5rem) + `shadow-lg`
- **No privacy mode yet** — tapi design harus siap diadaptasi (angka di-replace dengan `Rp••••••`)

**Calculation:**
```
sisaBulanIni = monthlyIncome - monthlyExpense
```
> Transfer **tidak** dihitung di income maupun expense.

**Sign behavior:**
- Positif: tampilkan normal, warna default (putih)
- Negatif: tampilkan dengan `-` prefix, optional subtle warning text `"Pengeluaran melebihi pemasukan bulan ini"`
- Zero: tampilkan `Rp0`

---

### 4b. Stat Cards Row — Saving Rate + Cashflow

Dua card side-by-side, half width masing-masing.

```
┌──────────────────┐ ┌──────────────────┐
│ Saving Rate      │ │ Cashflow         │
│ 60%              │ │ +Rp2.850.000     │
│ ■■■■■■□□□□       │ │ Juni 2026        │
└──────────────────┘ └──────────────────┘
```

**Saving Rate card:**
- Eyebrow: `SAVING RATE`
- Number: `60%` — `text-2xl font-bold`
- Progress bar: thin (4px), accent color fill, `bg-surface-muted` track
- Calculation: `(income - expense) / income * 100`
- Edge cases:
  - Income = 0 → show `--` instead of number, no progress bar, helper text: `"Belum ada pemasukan"`
  - Negative → show `0%`, bar empty

**Cashflow card:**
- Eyebrow: `CASHFLOW`
- Number: `+Rp2.850.000` atau `-Rp500.000`
- Positive = `text-income` color, Negative = `text-expense` color
- Subtitle: nama bulan + tahun

**Both cards:**
- `bg-surface` `rounded-card` `border-border` `shadow-card`
- `p-4` padding

---

### 4c. Account Balance Summary

```
┌──────────────────────────────────────┐
│  Saldo Akun                          │
│  ─────────────────────────────────── │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │🏦 BCA   │ │🏦 Jago  │ │💰 Cash │ │
│  │Rp2.5 jt │ │Rp1.2 jt │ │Rp100 rb│ │
│  └─────────┘ └─────────┘ └────────┘ │
│                                      │
│  Total  Rp3.950.000                  │
└──────────────────────────────────────┘
```

**Design:**
- Section title: `text-lg font-bold`
- Account chips: horizontal scroll (`overflow-x-auto`, `flex`, `gap-3`, snap)
- Each chip: `bg-surface` `rounded-card` `border` `p-4` `min-w-[140px]`
  - Account type icon (emoji or icon glyph)
  - Account name: `text-sm font-semibold` truncate
  - Balance: `text-base font-bold`
- Total row: below the chips, right-aligned, `text-sm text-muted` label + `text-base font-bold` number
- **Only show active accounts** with types: `cash`, `bank_account`, `e_wallet`
  - Investment/asset/liability accounts excluded — those belong on Portfolio
- If > 4 accounts, chips are horizontally scrollable with scroll-snap
- If 1–3 accounts, no scroll needed, chips flex-wrap or distribute evenly

**Account Type Icons:**

| Type | Display Label | Icon |
|------|---------------|------|
| `cash` | Cash | 💵 |
| `bank_account` | Bank | 🏦 |
| `e_wallet` | E-Wallet | 📱 |

---

### 4d. Recent Transactions

```
┌──────────────────────────────────────┐
│  Transaksi Terakhir         Lihat →  │
│  ─────────────────────────────────── │
│  ┌──────────────────────────────────┐│
│  │🔴 Makan                -Rp25.000││
│  │   BCA · Hari ini                 ││
│  ├──────────────────────────────────┤│
│  │🟢 Gaji            +Rp4.700.000  ││
│  │   BCA · 1 Jun 2026              ││
│  ├──────────────────────────────────┤│
│  │🔵 Transfer            Rp100.000 ││
│  │   BCA → GoPay · 1 Jun 2026      ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**Design decisions — simplified from Cashflow page:**
- Dashboard shows **max 5 most recent** transactions
- **Compact row format** (not full card like Cashflow page) — saves vertical space
- Each row:
  - Left: type color dot (8px circle) + category/merchant name
  - Right: signed amount with type color
  - Subtitle line: account name · relative/short date
- No edit/delete actions on dashboard — those live on Cashflow page
- "Lihat semua" → navigates to `/cashflow`
- Dividers between rows: thin `border-border` `border-t`

**Row layout:**
```
┌─────────────────────────────────────┐
│ ● Makan                  -Rp25.000 │
│   BCA · Hari ini                    │
└─────────────────────────────────────┘
```

**Type dot colors:**
- Income: `bg-income` (#15805c)
- Expense: `bg-expense` (#dd654b)
- Transfer: `bg-transfer` (#3979c9)

---

### 4e. Portfolio Placeholder

Reuse existing `PlaceholderCard` component:

```tsx
<PlaceholderCard
  icon="portfolio"
  title="Portfolio kamu sedang disiapkan"
  description="Ringkasan aset, net worth, dan asset allocation akan hadir di fase berikutnya."
  label="Segera hadir"
/>
```

---

## 5. Example Dashboard with Sample Numbers

### Scenario: User dengan data normal

```
Akun:
  BCA        → Rp2.500.000
  Jago       → Rp1.200.000
  GoPay      → Rp150.000
  Cash       → Rp100.000

Transaksi bulan Juni 2026:
  Income:
    Gaji     → Rp4.700.000 (BCA, 1 Jun)
    Freelance → Rp800.000 (BCA, 3 Jun)
  Expense:
    Makan    → Rp450.000 (total beberapa transaksi)
    Kopi     → Rp120.000
    Transport → Rp250.000
    Tagihan  → Rp830.000
  Transfer:
    BCA → GoPay → Rp200.000 (5 Jun)

Kalkulasi:
  Total Income  = Rp5.500.000
  Total Expense = Rp1.650.000
  Sisa Bulan Ini = Rp3.850.000
  Saving Rate   = (5.500.000 - 1.650.000) / 5.500.000 × 100 = 70%
  Cashflow      = +Rp3.850.000
```

### Dashboard display:

```
Juni 2026

Halo, selamat datang 👋

SISA BULAN INI · Juni 2026
Rp3.850.000

  ↑ Pemasukan        ↓ Pengeluaran
  Rp5.500.000        Rp1.650.000

┌─Saving Rate────┐ ┌─Cashflow───────┐
│ 70%            │ │ +Rp3.850.000   │
│ ■■■■■■■□□□     │ │ Juni 2026      │
└────────────────┘ └────────────────┘

Saldo Akun
[BCA Rp2.5jt] [Jago Rp1.2jt] [GoPay Rp150rb] [Cash Rp100rb]
Total  Rp3.950.000

Transaksi Terakhir                      Lihat →
● Kopi · GoPay · Hari ini              -Rp18.000
● Makan · BCA · Hari ini               -Rp25.000
● Transfer · BCA → GoPay · 5 Jun       Rp200.000
● Tagihan listrik · BCA · 4 Jun        -Rp320.000
● Freelance · BCA · 3 Jun              +Rp800.000

[Portfolio kamu sedang disiapkan - Segera hadir]
```

---

## 6. Indonesian Microcopy

### PageIntro Header

```
Eyebrow:  "Juni 2026"
Title:    "Halo, selamat datang 👋"
Desc:     (omitted on dashboard — hero card replaces it)
```

> **Decision**: Pada Dashboard, `PageIntro` hanya menampilkan bulan + greeting. Tidak perlu deskripsi karena hero card langsung menyampaikan value.

> **Alt option**: Jika user's name tersedia dari Supabase profile, gunakan `"Halo, Ata 👋"`. Fallback ke `"Halo, selamat datang 👋"`.

### Hero Card Copy

| Element | Copy |
|---------|------|
| Eyebrow | `SISA BULAN INI · Juni 2026` |
| Income label | `↑ Pemasukan` |
| Expense label | `↓ Pengeluaran` |
| Deficit warning | `Pengeluaran melebihi pemasukan bulan ini` |

### Stat Cards

| Element | Copy |
|---------|------|
| Saving Rate eyebrow | `SAVING RATE` |
| Saving Rate zero income | `Belum ada pemasukan` |
| Cashflow eyebrow | `CASHFLOW` |
| Cashflow subtitle | `Juni 2026` |

### Account Section

| Element | Copy |
|---------|------|
| Section title | `Saldo Akun` |
| Total label | `Total` |
| No accounts | `Belum ada akun` |

### Recent Transactions

| Element | Copy |
|---------|------|
| Section title | `Transaksi Terakhir` |
| View all CTA | `Lihat semua` |
| Empty state | (see section 7) |

### Date Display

| Context | Format | Example |
|---------|--------|---------|
| Today | `Hari ini` | — |
| Yesterday | `Kemarin` | — |
| This year | `d MMM` | `5 Jun` |
| Older | `d MMM yyyy` | `5 Jun 2025` |

---

## 7. Empty State

Ketika user belum punya transaksi sama sekali di bulan ini.

### Full Dashboard Empty

```
┌──────────────────────────────────────┐
│  Juni 2026                           │
│  Halo, selamat datang 👋             │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────────┐│
│  │  bg-accent, border-dashed       ││
│  │                                  ││
│  │        📊                        ││
│  │                                  ││
│  │  Belum ada transaksi bulan ini   ││
│  │                                  ││
│  │  Mulai catat pemasukan atau      ││
│  │  pengeluaran pertama kamu.       ││
│  │                                  ││
│  │  [ + Catat Transaksi ]           ││
│  │                                  ││
│  └──────────────────────────────────┘│
│                                      │
│  Saldo Akun                          │
│  [BCA Rp2jt] [Jago Rp1jt] ...       │
│                                      │
│  [Portfolio placeholder]             │
└──────────────────────────────────────┘
```

**Design:**
- Hero card tetap ada tapi dalam versi empty:
  - Background: `bg-accent` tapi dengan `border-dashed border-accent-foreground/30`
  - Icon: `📊` atau illustration placeholder (emoji sufficient untuk MVP)
  - Title: `"Belum ada transaksi bulan ini"` — `text-xl font-bold`
  - Description: `"Mulai catat pemasukan atau pengeluaran pertama kamu."` — `text-sm opacity-80`
  - CTA Button: `"+ Catat Transaksi"` → navigates to `/cashflow/new`
    - Style: `bg-white/20 hover:bg-white/30 rounded-control font-bold text-sm`
- Stat cards (Saving Rate + Cashflow) → **hidden** when no transactions
- Account balance section → **still shown** (user has accounts from onboarding)
- Recent transactions section → **hidden** (no data = hide section entirely, don't show empty list)

### Per-Section Empty States

| Section | When Empty | Behavior |
|---------|-----------|----------|
| Hero card | No transactions this month | Show empty hero variant |
| Stat cards | No transactions this month | Hidden entirely |
| Account balances | No active accounts | Show: `"Belum ada akun. Tambahkan di Settings."` |
| Recent transactions | No transactions ever | Hidden entirely |

---

## 8. Loading State

Dashboard is a **Server Component** page — data is fetched server-side. Loading state is handled by Next.js `loading.tsx`.

### Skeleton Layout

```
┌──────────────────────────────────────┐
│  ████████ ████                       │  ← eyebrow skeleton
│  ████████████████████                │  ← title skeleton
├──────────────────────────────────────┤
│  ┌──────────────────────────────────┐│
│  │ ████████████ ████████            ││  ← hero skeleton
│  │                                  ││
│  │ ██████████████████████████       ││
│  │                                  ││
│  │ ████████████  ████████████       ││
│  └──────────────────────────────────┘│
│  ┌────────────┐ ┌───────────────┐   │
│  │ ██████████ │ │ ████████████  │   │
│  │ ████████   │ │ ██████████    │   │
│  └────────────┘ └───────────────┘   │
│  ██████████                         │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ ██████ │ │ ██████ │ │ ██████ │   │
│  │ ██████ │ │ ██████ │ │ ██████ │   │
│  └────────┘ └────────┘ └────────┘   │
└──────────────────────────────────────┘
```

**Implementation:**
- File: `src/app/(app)/dashboard/loading.tsx`
- Skeleton blocks: `bg-surface-muted animate-pulse rounded-card`
- Hero skeleton: `bg-accent/30 animate-pulse rounded-card h-[180px]`
- Match exact dimensions of real cards to avoid layout shift
- Stat card skeletons: two side-by-side `h-[100px]`
- Account chips: three skeleton pills `h-[80px] w-[140px]`
- Transaction rows: three bars `h-[56px]`

**Animation:**
- `animate-pulse` (Tailwind built-in)
- Stagger not needed for MVP — simple pulse is clean enough

---

## 9. Error State

### Data Fetch Error

When Supabase queries fail:

```
┌──────────────────────────────────────┐
│  Juni 2026                           │
│  Halo, selamat datang 👋             │
├──────────────────────────────────────┤
│  ┌──────────────────────────────────┐│
│  │  ⚠️                              ││
│  │  Data belum bisa dimuat          ││
│  │                                  ││
│  │  Ada masalah saat mengambil      ││
│  │  data keuangan kamu. Coba        ││
│  │  refresh halaman ini.            ││
│  │                                  ││
│  │  [ ↻ Refresh ]                   ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**Design:**
- Card: `bg-surface rounded-card border border-expense/30 p-6 text-center`
- Icon: `⚠️` emoji, large (text-3xl)
- Title: `"Data belum bisa dimuat"` — `text-lg font-bold`
- Description: `"Ada masalah saat mengambil data keuangan kamu. Coba refresh halaman ini."` — `text-sm text-muted`
- CTA: `"Refresh"` button — triggers page reload or Next.js `router.refresh()`
- **Partial error handling**: If only one query fails (e.g., transactions succeed but accounts fail), show the sections that work and inline error for the failed section

### Partial Error per Section

```
┌──────────────────────────────────────┐
│  Saldo Akun                          │
│  ┌──────────────────────────────────┐│
│  │ Saldo akun belum bisa dimuat.   ││
│  │ [Coba lagi]                      ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

- Inline within the section
- `text-sm text-muted` + `text-expense` for error accent
- "Coba lagi" link reloads page

---

## 10. Recent Transaction Card Design (Detail)

### Row Anatomy

```
┌─────────────────────────────────────────┐
│  ●  Makan                    -Rp25.000  │
│     BCA · Hari ini                      │
├─────────────────────────────────────────┤
│  ●  Gaji                +Rp4.700.000   │
│     BCA · 1 Jun 2026                    │
└─────────────────────────────────────────┘
```

### Detailed Specs

```
Row container:
  padding: py-3.5 px-0
  border-bottom: border-t border-border (between items)
  First row: no top border

Left column:
  Flex row, items-start, gap-3

  Type dot:
    w-2.5 h-2.5 rounded-full mt-1.5
    Income: bg-income
    Expense: bg-expense
    Transfer: bg-transfer

  Content:
    Line 1: category name or merchant (whichever exists)
      text-sm font-semibold text-foreground
      truncate with max-width
    Line 2: account info + date
      text-xs text-muted
      Format: "{accountName} · {relativeDate}"
      Transfer: "{sourceAccount} → {destAccount} · {relativeDate}"

Right column:
  Amount, right-aligned, no wrap
    text-sm font-bold tabular-nums
    Income: text-income, prefix "+"
    Expense: text-expense, prefix "-"
    Transfer: text-transfer, no prefix sign
```

### Interaction

- **Tap** on a row → navigate to `/cashflow` (not individual edit — dashboard is view-only)
- Subtle hover: `hover:bg-surface-muted` transition
- No swipe actions on dashboard

### Wrapper Card

```
Entire "Transaksi Terakhir" section:
  bg-surface rounded-card border-border shadow-card p-5

Header row:
  flex justify-between items-center mb-1
  Title: text-lg font-bold
  CTA: text-sm font-semibold text-accent-strong
       "Lihat semua" with arrow icon →
```

---

## 11. Account Balance Summary Design (Detail)

### Container

```
Section (not inside a card — flat section):
  mb-6

Section title:
  text-lg font-bold mb-3

Chips container:
  flex gap-3 overflow-x-auto pb-2
  scroll-snap-type: x mandatory
  -webkit-overflow-scrolling: touch
  scrollbar: hidden (scrollbar-hide)

  // Fade hint on right edge when scrollable (optional polish)
```

### Individual Account Chip

```
┌─────────────────┐
│  🏦             │
│  BCA            │
│  Rp2.500.000    │
└─────────────────┘

Chip:
  min-w-[140px] flex-shrink-0
  bg-surface rounded-card border border-border p-4
  shadow-card (subtle)
  scroll-snap-align: start

  Icon row:
    text-xl mb-2
    Emoji based on account type

  Name:
    text-xs font-semibold text-muted
    truncate single-line

  Balance:
    text-base font-bold text-foreground
    tabular-nums
    Negative balance: text-expense
```

### Total Row

```
Below chips:
  flex justify-between items-center mt-3 px-1

  Label:
    text-sm text-muted
    "Total"

  Amount:
    text-base font-bold text-foreground
    tabular-nums
```

### Account Ordering

1. `cash` first
2. `bank_account` alphabetical
3. `e_wallet` alphabetical

---

## 12. Visual Polish Notes

### Typography Scale (Dashboard-specific)

| Element | Class | Size |
|---------|-------|------|
| Hero amount | `text-3xl font-bold tracking-tight` | 30px |
| Stat card number | `text-2xl font-bold` | 24px |
| Section title | `text-lg font-bold` | 18px |
| Account balance | `text-base font-bold tabular-nums` | 16px |
| Transaction amount | `text-sm font-bold tabular-nums` | 14px |
| Supporting text | `text-sm text-muted` | 14px |
| Eyebrow label | `text-xs font-bold uppercase tracking-wider` | 12px |

### Color Semantics (Immutable across themes)

| Semantic | Token | Hex |
|----------|-------|-----|
| Income | `--income` | `#15805c` |
| Expense | `--expense` | `#dd654b` |
| Transfer | `--transfer` | `#3979c9` |
| Accent (varies) | `--accent` | Theme-dependent |

### Spacing Rhythm

- Section gaps: `mb-6` (24px) between major sections
- Card internal padding: `p-5` (20px) standard, `p-6` (24px) hero
- Card border radius: `rounded-card` (1.5rem = 24px)
- Account chip gap: `gap-3` (12px)
- Transaction row padding: `py-3.5` (14px vertical)

### Shadows & Depth

- Hero card: `shadow-lg` (elevated, primary attention)
- Stat cards: `shadow-card` (standard)
- Account chips: `shadow-card` (subtle)
- Transaction section card: `shadow-card`
- Bottom nav: existing shadow from `BottomNavigation` component

### Micro-interactions

| Element | Interaction |
|---------|------------|
| "Lihat semua" link | `hover:underline`, icon slide right 2px |
| Account chips | `active:scale-[0.97]` press feedback |
| CTA buttons | `active:scale-[0.96]` consistent with existing patterns |
| Transaction rows | `hover:bg-surface-muted` subtle highlight |
| Hero income/expense pills | No hover (info-only) |

### Dark Mode Considerations

- Hero card: `bg-accent` works in both modes (accent colors are vibrant enough)
- Surface cards: `bg-surface` (#161f1b dark) with `border-border` (#2a3832)
- Skeleton pulse: `bg-surface-muted` (#1d2924) is subtle enough
- Income/expense colors are tested for contrast in both modes already

### Number Formatting

- All Rupiah amounts: `formatIdr()` utility (existing)
- Use `tabular-nums` CSS font-feature for aligned number columns
- Large numbers: full format (Rp4.700.000), no abbreviation
- Account chips (tight space): abbreviation OK if needed (Rp2.5jt) — **but for MVP, use full format and let text truncate naturally**

---

## 13. What to Implement Now

### Priority 1: Data Layer

1. **New data function**: `getDashboardSummary()` in `src/lib/dashboard/data.ts`
   - Query monthly income total: `SUM(amount) WHERE type='income' AND month=current`
   - Query monthly expense total: `SUM(amount) WHERE type='expense' AND month=current`
   - Calculate `sisaBulanIni`, `savingRate`, `cashflow`
   - Transfers explicitly excluded from both sums
   - Return typed result

2. **Account balances query**: `getDashboardAccounts()`
   - Fetch active accounts: `cash`, `bank_account`, `e_wallet` types only
   - Order: cash → bank → e-wallet, then alphabetical
   - Include `current_balance`

3. **Recent transactions query**: `getDashboardRecentTransactions()`
   - Reuse `mapTransactionRows` from existing cashflow data layer
   - Limit 5, ordered by `transaction_date DESC, created_at DESC`
   - Filter: `type IN ('income', 'expense', 'transfer')`

### Priority 2: Dashboard Page

4. **Replace** current placeholder `dashboard/page.tsx` with full implementation
5. **Create** `dashboard/loading.tsx` with skeleton UI

### Priority 3: Components

6. **DashboardHeroCard** — hero card with sisa bulan ini + income/expense
7. **DashboardStatCards** — saving rate + cashflow row
8. **DashboardAccountSummary** — horizontal scroll account chips
9. **DashboardRecentTransactions** — compact transaction list (different from Cashflow's `TransactionList`)
10. **DashboardEmptyHero** — empty state variant of hero card

### Priority 4: Polish

11. Add month/year header to `PageIntro` (dynamic)
12. User greeting with profile name (if available, fallback to generic)
13. Date formatting helper: relative dates (Hari ini, Kemarin, etc.)

---

## 14. What to Postpone

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| Privacy Mode (Rp••••••) | Requires global context + toggle infra | Privacy & Security phase |
| Net Worth card on dashboard | Needs Portfolio phase data (assets, liabilities) | Portfolio phase |
| Budget warning card | Needs budget management implementation first | Budget phase |
| Top spending category | Nice insight, but not critical for MVP snapshot | Analytics phase |
| Cashflow chart (bar/line) | Heavy component, needs charting library | Dashboard v2 |
| Period selector (month picker) | MVP shows current month only | Dashboard v2 |
| Pull-to-refresh | PWA native feel, needs service worker polish | PWA polish phase |
| Animated number counters | Delightful but not essential | Dashboard v2 |
| Comparison with last month | Needs 2+ months of data to be meaningful | Analytics phase |
| Quick action buttons (+ Income, + Expense) | Cashflow page already has this, dashboard = view-only | Dashboard v2 |

---

## Appendix: Component File Structure

```
src/
├── app/(app)/dashboard/
│   ├── page.tsx              ← Main dashboard page (server component)
│   └── loading.tsx           ← Skeleton loading state
├── components/dashboard/
│   ├── hero-card.tsx          ← Sisa bulan ini hero
│   ├── stat-cards.tsx         ← Saving rate + cashflow pair
│   ├── account-summary.tsx    ← Account chips horizontal scroll
│   ├── recent-transactions.tsx← Compact transaction list
│   └── empty-hero.tsx         ← Empty state hero variant
└── lib/dashboard/
    └── data.ts                ← Dashboard data queries
```
