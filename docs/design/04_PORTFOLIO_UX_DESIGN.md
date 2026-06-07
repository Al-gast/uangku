# UangKu Portfolio — UX/UI Design Spec (MVP)

> **Fase**: Portfolio MVP
> **Target**: Mobile-first, max-width 480px (sesuai `AppShell`)
> **Prerequisite**: Manual cashflow, chat input, dashboard, dan budget sudah implemented
> **Data source**: Manual input — tidak ada auto-sync dengan bank/broker
> **DB tables**: `public.assets`, `public.liabilities`, `public.asset_snapshots` (sudah ada dari initial schema)

---

## 1. Page Goal

Menjawab **satu pertanyaan utama**:

> *"Total kekayaan bersih saya berapa, dan tersebar di mana?"*

Portfolio MVP harus menyampaikan:
- Net worth (total asset − total liability)
- Total asset dan total liability
- Alokasi asset — uang saya tersebar di mana
- Daftar asset yang dimiliki
- Daftar hutang/liability yang masih berjalan

### What Portfolio IS

- Snapshot kekayaan manual — user update sendiri
- Kalkulator net worth sederhana
- Ringkasan alokasi asset visual
- Tempat catat semua jenis asset (cash, investasi, aset lain)

### What Portfolio IS NOT

- Portfolio tracker real-time (belum ada API sync)
- Stock/crypto trading dashboard
- Profit/loss tracker (return calculation ditunda)
- Balance sheet audit tool

---

## 2. User Mental Model

User memikirkan portfolio seperti **melihat ringkasan kekayaan di satu layar**.

```
Mental model:
"Saya buka Portfolio, lihat net worth,
lihat sebaran uang saya,
cek apakah ada hutang yang perlu diperhatikan."
```

### Key insight — Dua persona pengguna:

| Persona | Behavior | What they look at first |
|---------|----------|------------------------|
| Minimalis | Hanya punya tabungan + sedikit hutang | Net worth number |
| Investor pemula | Punya RD, saham, emas, crypto | Asset allocation breakdown |

Dashboard sudah menampilkan saldo akun (cash/bank/e-wallet). Portfolio **memperluas itu** dengan menambahkan investment assets + liabilities, lalu menghitung net worth dari semuanya.

### Relationship with Dashboard

```
Dashboard menampilkan:    Account balances (cash, bank, e-wallet)
Portfolio menampilkan:    ALL assets + liabilities → net worth

Dashboard is "uang bulan ini"
Portfolio is "total kekayaan saya"
```

> [!IMPORTANT]
> Account balances (cash/bank/e-wallet) dari tabel `accounts` dimasukkan ke total asset pada kalkulasi net worth. User **tidak perlu** menduplikasi saldo rekening sebagai asset — portfolio otomatis menyertakan saldo akun aktif.

---

## 3. Mobile Layout (Top → Bottom)

```
┌──────────────────────────────────┐
│  PageIntro Header                │  ← Eyebrow + title
├──────────────────────────────────┤
│  🟢 Hero Card: Net Worth         │  ← Primary number, accent bg
│     + Total Asset / Liability    │
├──────────────────────────────────┤
│  Asset Allocation                │  ← Donut ring + legend
├──────────────────────────────────┤
│  Daftar Aset                     │  ← Section header + "Tambah"
│  ┌──────────────────────────────┐│
│  │ 🏦 Cash & Rekening          ││  ← Group: from accounts
│  │   BCA          Rp2.500.000  ││
│  │   GoPay          Rp150.000  ││
│  ├──────────────────────────────┤│
│  │ 📈 Reksadana                 ││  ← Group: RDPU + RDPT
│  │   RDPU Bibit   Rp5.000.000  ││
│  ├──────────────────────────────┤│
│  │ 🪙 Emas                     ││
│  │   Emas Antam   Rp3.200.000  ││
│  ├──────────────────────────────┤│
│  │ ₿ Crypto                    ││
│  │   Bitcoin        Rp800.000  ││
│  ├──────────────────────────────┤│
│  │ 📊 Saham                    ││
│  │   BBCA         Rp1.500.000  ││
│  └──────────────────────────────┘│
├──────────────────────────────────┤
│  Hutang & Kewajiban              │  ← Section header + "Tambah"
│  ┌──────────────────────────────┐│
│  │ Hutang ke Andi  Rp2.000.000 ││
│  │   Sisa Rp1.500.000 · 75%   ││
│  │   Jatuh tempo: 15 Jul 2026  ││
│  └──────────────────────────────┘│
├──────────────────────────────────┤
│          (bottom spacing)        │
│  ══════ Bottom Navigation ══════ │
└──────────────────────────────────┘
```

### Scroll Order Logic

| Order | Section | Rationale |
|-------|---------|-----------|
| 1 | PageIntro | Orientasi |
| 2 | Hero: Net Worth | Jawaban utama |
| 3 | Asset Allocation | "Uang saya tersebar di mana?" |
| 4 | Daftar Aset | Detail per asset |
| 5 | Hutang & Kewajiban | "Apa yang saya utang?" |

---

## 4. Hero Summary Card Layout

```
┌──────────────────────────────────────┐
│  NET WORTH                           │  ← eyebrow, uppercase, xs
│                                      │
│  Rp12.150.000                        │  ← text-3xl, bold, white
│                                      │
│  ┌────────────┐  ┌────────────┐      │
│  │ ↑ Aset     │  │ ↓ Hutang   │      │
│  │Rp13.650.000│  │ Rp1.500.000│      │
│  └────────────┘  └────────────┘      │
└──────────────────────────────────────┘
```

**Design tokens (consistent with Dashboard HeroCard):**
- Background: `bg-accent`
- Text: `text-accent-foreground` (white)
- Asset/Liability pills: `bg-white/15 backdrop-blur-sm rounded-2xl p-3`
- Asset arrow `↑` subtle green tint, Liability arrow `↓` subtle red tint
- `rounded-card` + `shadow-lg`

**Calculation:**
```
totalAccountBalances = SUM(accounts.current_balance)
                       WHERE is_active = true
                       AND type IN ('cash', 'bank_account', 'e_wallet')

totalAssetValues    = SUM(assets.current_value)
                       WHERE type != 'liability'

totalAsset          = totalAccountBalances + totalAssetValues

totalLiability      = SUM(liabilities.remaining_amount)

netWorth            = totalAsset - totalLiability
```

**Sign behavior:**
- Positive net worth: tampilkan normal, warna putih
- Negative net worth: tampilkan dengan `-` prefix, subtle warning: `"Hutang melebihi total aset"`
- Zero: tampilkan `Rp0`

**Eyebrow:**
```
"NET WORTH"
text-[0.68rem] font-bold uppercase tracking-[0.16em] opacity-80
```

---

## 5. Net Worth, Total Asset, Total Liability Display

### The Three Numbers

| Metric | Label | Color | Position |
|--------|-------|-------|----------|
| Net Worth | `NET WORTH` | `text-accent-foreground` (white) | Hero card, primary |
| Total Asset | `↑ Aset` | White on accent bg | Hero card, left pill |
| Total Liability | `↓ Hutang` | White on accent bg | Hero card, right pill |

### What Counts as "Asset"

| Source | Type | Included? | Notes |
|--------|------|-----------|-------|
| `accounts` table | `cash` | ✅ | Cash on hand |
| `accounts` table | `bank_account` | ✅ | Bank balances |
| `accounts` table | `e_wallet` | ✅ | GoPay, OVO, etc. |
| `accounts` table | `investment_account` | ❌ | Avoid double-count — value tracked via `assets` |
| `accounts` table | `asset_account` | ❌ | Same reason |
| `accounts` table | `liability` | ❌ | Tracked in `liabilities` table |
| `assets` table | `rdpu` | ✅ | Reksadana Pasar Uang |
| `assets` table | `rdpt` | ✅ | Reksadana Pendapatan Tetap |
| `assets` table | `gold` | ✅ | Emas |
| `assets` table | `crypto` | ✅ | Bitcoin, etc. |
| `assets` table | `stock` | ✅ | Saham Indonesia |
| `assets` table | `other_asset` | ✅ | Kendaraan, properti, etc. |
| `assets` table | `liability` type | ❌ | Legacy — use `liabilities` table instead |

### What Counts as "Liability"

| Source | Included? |
|--------|-----------|
| `liabilities` table → `remaining_amount` | ✅ |

---

## 6. Asset Allocation Section

### Visual: Donut Ring + Legend

```
┌──────────────────────────────────────┐
│  Alokasi Aset                        │
│                                      │
│       ┌─────────────┐                │
│      ╱  ╲     ╱  ╲   ╲              │
│     │  37%  │  27% │   │             │
│     │ Cash  │  RD   │   │            │
│      ╲  ╱     ╲  ╱   ╱              │
│       └─────────────┘                │
│                                      │
│  ● Cash & Rekening    37%  Rp5.1jt   │
│  ● Reksadana          27%  Rp3.7jt   │
│  ● Emas               18%  Rp2.5jt   │
│  ● Crypto              8%  Rp1.1jt   │
│  ● Saham               7%  Rp0.9jt   │
│  ● Aset Lain           3%  Rp0.4jt   │
└──────────────────────────────────────┘
```

### Container Design

```
Section wrapper:
  bg-surface rounded-card border border-border shadow-card p-5

Title: "Alokasi Aset"
  text-lg font-bold mb-4
```

### Donut Ring Specs

```
Size: 160×160px centered
Stroke width: 28px (thick, Bibit-style)
Inner area: empty (no number inside — net worth is already in hero)
Background ring: bg-surface-muted (2px, behind all segments)

Animation: segments draw in clockwise, 600ms total, ease-out
  (CSS: stroke-dashoffset transition)
```

### Allocation Colors

Curated palette that works in light + dark mode, distinct from transaction type colors:

| Category | Color Token | Hex (Light) | Hex (Dark — same) |
|----------|-------------|-------------|-----|
| Cash & Rekening | `--alloc-cash` | `#3bba8a` | same |
| Reksadana | `--alloc-rd` | `#5b8def` | same |
| Emas | `--alloc-gold` | `#e8b94a` | same |
| Crypto | `--alloc-crypto` | `#f0924e` | same |
| Saham | `--alloc-stock` | `#c75edb` | same |
| Aset Lain | `--alloc-other` | `#9caaa3` | same (muted) |

> [!NOTE]
> These colors are deliberately different from the `--income`/`--expense`/`--investment` semantic tokens. Asset allocation is its own visual context.

### Legend Rows

```
Each row:
  flex items-center justify-between py-2

  Left:
    ● color dot (size-2.5 rounded-full mr-2.5)
    Category name: text-sm font-semibold

  Right:
    Percentage: text-sm font-bold text-foreground
    Value: text-sm text-muted ml-2

  First row has a top border: border-t border-border mt-4 pt-4
  Subsequent rows: no top border
```

### Allocation Grouping

Assets are grouped into these **display categories** for the donut:

| Display Category | Includes |
|-----------------|----------|
| Cash & Rekening | accounts: `cash`, `bank_account`, `e_wallet` |
| Reksadana | assets: `rdpu`, `rdpt` |
| Emas | assets: `gold` |
| Crypto | assets: `crypto` |
| Saham | assets: `stock` |
| Aset Lain | assets: `other_asset` |

Categories with 0 value are **hidden** from both donut and legend.

### Small Slice Handling

If a category is < 3% of total assets, its donut segment becomes hard to see. Rule:
- Render all slices regardless of size (no "Other" bucket)
- Minimum visual arc: 2% of circumference (even if actual value is 0.5%)
- Legend always shows exact percentage

---

## 7. Asset List Card Design

### Section Header

```
┌──────────────────────────────────────┐
│  Daftar Aset              + Tambah   │
│  ─────────────────────────────────── │
```

```
header: flex justify-between items-center mb-3
  Title: "Daftar Aset" — text-lg font-bold
  CTA: "+ Tambah" — text-sm font-semibold text-accent-strong
       tap → navigate to /portfolio/add-asset
```

### Group + Item Layout

Assets are **grouped by type** and displayed as cards with item rows inside.

```
┌──────────────────────────────────────┐
│  🏦 Cash & Rekening                 │  ← group header
├──────────────────────────────────────┤
│  BCA                   Rp2.500.000  │  ← item row
│  Rekening                            │
├──────────────────────────────────────┤
│  GoPay                   Rp150.000  │
│  E-Wallet                            │
├──────────────────────────────────────┤
│  Cash                    Rp100.000  │
│  Cash                                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  📈 Reksadana                        │
├──────────────────────────────────────┤
│  RDPU Bibit            Rp5.000.000  │
│  Bibit                               │
├──────────────────────────────────────┤
│  RDPT BNI-AM           Rp2.000.000  │
│  Bareksa                             │
└──────────────────────────────────────┘
```

### Group Card Design

```
Container:
  bg-surface rounded-card border border-border shadow-card
  overflow-hidden
  mb-4 (gap between groups)

Group Header:
  px-5 py-3.5
  bg-surface-muted
  text-sm font-bold text-foreground
  flex items-center gap-2

  Icon: emoji, text-base

Group header labels:
  cash/bank/e-wallet → "🏦 Cash & Rekening"
  rdpu/rdpt          → "📈 Reksadana"
  gold               → "🪙 Emas"
  crypto             → "₿ Crypto"
  stock              → "📊 Saham"
  other_asset        → "📦 Aset Lain"
```

### Asset Item Row

```
┌──────────────────────────────────────┐
│  RDPU Bibit            Rp5.000.000  │
│  Bibit                           ›  │
└──────────────────────────────────────┘

Row:
  px-5 py-4
  border-t border-border
  flex items-start justify-between
  hover:bg-surface-muted transition cursor-pointer
  active:scale-[0.99]

  Left:
    Name: text-sm font-semibold text-foreground — truncate
    Subtitle: text-xs text-muted
      → accounts: account type label ("Rekening", "E-Wallet", "Cash")
      → assets: platform name (e.g., "Bibit", "Bareksa") or type label if no platform

  Right:
    Value: text-sm font-bold tabular-nums text-foreground — no-wrap
    Chevron: text-muted ›

  Tap → navigate to /portfolio/asset/{id} (edit page)
  Accounts (from cash/bank/e-wallet) → tap does nothing (balance managed in Cashflow)
```

### Account Items Are Read-Only

> [!IMPORTANT]
> Cash/bank/e-wallet rows sourced from `accounts` table are **display-only** in Portfolio. Tapping them does NOT navigate to an edit page. Their balances are managed automatically via cashflow transactions. A subtle lock icon or muted chevron distinguishes them from editable asset items.

```
Account row (read-only):
  Same layout, but:
    Chevron: hidden or replaced with lock icon 🔒 (text-xs text-muted)
    No hover state
    cursor-default
    Subtle: opacity-90 on the row? No — keep same visual weight
```

---

## 8. Liability Section Design

### Section Header

```
┌──────────────────────────────────────┐
│  Hutang & Kewajiban       + Tambah   │
│  ─────────────────────────────────── │
```

### Liability Card Layout

```
┌──────────────────────────────────────┐
│  Hutang ke Andi                      │  ← name
│                                      │
│  Sisa Rp1.500.000 dari Rp2.000.000  │  ← remaining / total
│  ┌──────────────────────────────────┐│
│  │ ████████████████░░░░░░           ││  ← progress bar (75%)
│  └──────────────────────────────────┘│
│                                      │
│  Jatuh tempo: 15 Jul 2026            │  ← due date (optional)
└──────────────────────────────────────┘
```

### Liability Card Specs

```
Container:
  bg-surface rounded-card border border-border shadow-card p-5
  mb-3 (gap between cards)
  cursor-pointer hover:bg-surface-muted
  active:scale-[0.99] transition

  Tap → navigate to /portfolio/liability/{id} (edit page)

Name:
  text-sm font-bold text-foreground

Remaining:
  mt-2 text-xs text-muted
  "Sisa {formatIdr(remaining)} dari {formatIdr(total)}"

Progress bar:
  mt-2
  height: 6px
  track: bg-surface-muted rounded-full
  fill: bg-debt rounded-full
  width: (remaining / amount) * 100%
  transition: width 300ms ease-out

Due date row (if exists):
  mt-3 text-xs text-muted
  "Jatuh tempo: {formatDate}"

  If due date is within 7 days:
    text-expense font-semibold
    "⚠️ Jatuh tempo: {date}"

  If past due:
    text-expense font-bold
    "⚠️ Lewat jatuh tempo!"

Notes (if exists):
  mt-2 text-xs text-muted italic
  truncate to 1 line
```

### Multiple Liabilities

```
┌─ Liability Card 1 ──────────────────┐
│  Hutang ke Andi        Rp1.500.000  │
│  ████████████░░░░░  75%              │
│  Jatuh tempo: 15 Jul 2026           │
└──────────────────────────────────────┘

┌─ Liability Card 2 ──────────────────┐
│  Cicilan laptop        Rp3.000.000  │
│  ██████████████████████░  95%        │
│  Jatuh tempo: 1 Des 2026            │
└──────────────────────────────────────┘
```

### Total Liability Row

After all liability cards:

```
flex justify-end items-center gap-2 mt-2
  Label: "Total hutang" — text-sm text-muted
  Value: formatIdr(totalRemaining) — text-base font-bold text-debt
```

---

## 9. Add Asset Flow

### Entry Point

"+ Tambah" button in the Daftar Aset section header → navigates to `/portfolio/add-asset`.

### Step 1: Choose Asset Type

```
┌──────────────────────────────────────┐
│  Tambah aset baru                    │
│  Pilih jenis aset yang ingin         │
│  kamu catat.                         │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────────┐│
│  │ 📈 Reksadana Pasar Uang (RDPU)  ││
│  ├──────────────────────────────────┤│
│  │ 📈 Reksadana Pend. Tetap (RDPT) ││
│  ├──────────────────────────────────┤│
│  │ 🪙 Emas                         ││
│  ├──────────────────────────────────┤│
│  │ ₿ Crypto / Bitcoin              ││
│  ├──────────────────────────────────┤│
│  │ 📊 Saham Indonesia              ││
│  ├──────────────────────────────────┤│
│  │ 📦 Aset lainnya                 ││
│  └──────────────────────────────────┘│
│                                      │
│  Batal                               │
└──────────────────────────────────────┘
```

> [!NOTE]
> Cash/bank/e-wallet **tidak** muncul di pilihan tambah aset — mereka sudah dikelola via onboarding + Settings. Portfolio hanya menambah asset types yang belum ada di accounts.

### Type Selection Row Design

```
Each type row:
  bg-surface rounded-card border border-border p-4
  flex items-center gap-3
  mb-2
  cursor-pointer hover:bg-surface-muted
  active:scale-[0.98] transition

  Icon: emoji text-lg
  Label: text-sm font-bold

  Tap → navigate to /portfolio/add-asset?type={type}
```

### Step 2: Asset Form (Type-Specific)

All asset forms share a common base with type-specific fields.

**Common Fields (all types):**

| Field | Label | Required | Input |
|-------|-------|----------|-------|
| Name | Nama aset | Yes | text, placeholder varies by type |
| Current Value | Nilai saat ini | Yes | Rp + numeric, same pattern as TransactionForm |

**Type-Specific Fields:**

| Type | Extra Fields |
|------|-------------|
| `rdpu` | Platform (text: "Bibit", "Bareksa", etc.), Total Modal (Rp) |
| `rdpt` | Platform (text), Total Modal (Rp) |
| `gold` | Platform (text: "Antam", "Pegadaian", etc.), Berat (number + gram) |
| `crypto` | Platform (text: "Indodax", "Pintu", etc.), Jumlah unit (number) |
| `stock` | Kode saham (text: "BBCA"), Platform (text: "Stockbit", "IPOT") |
| `other_asset` | Catatan (textarea) |

### Asset Form Layout

```
┌──────────────────────────────────────┐
│  ← Kembali                          │
│                                      │
│  📈 Tambah RDPU                     │
│  Catat reksadana pasar uang kamu.    │
├──────────────────────────────────────┤
│                                      │
│  Nama aset                           │
│  ┌──────────────────────────────────┐│
│  │ cth: RDPU BNI-AM                ││
│  └──────────────────────────────────┘│
│                                      │
│  Platform                            │
│  ┌──────────────────────────────────┐│
│  │ cth: Bibit                      ││
│  └──────────────────────────────────┘│
│                                      │
│  Total modal                         │
│  ┌──────────────────────────────────┐│
│  │ Rp              0               ││
│  └──────────────────────────────────┘│
│                                      │
│  Nilai saat ini                      │
│  ┌──────────────────────────────────┐│
│  │ Rp              0               ││
│  └──────────────────────────────────┘│
│                                      │
│  [ Simpan Aset ]                     │
│  Batal                               │
└──────────────────────────────────────┘
```

**Form Design:**
- Reuse existing form patterns from `TransactionForm` and `BudgetForm`
- Same input classes: `min-h-12 rounded-control border border-border bg-surface px-4`
- Same Rp prefix pattern for amount inputs
- Same error display: `border-expense/30 bg-expense/10 text-expense`
- Same submit button: `bg-accent text-accent-foreground rounded-control min-h-13`

### Name Placeholder per Type

| Type | Placeholder |
|------|------------|
| `rdpu` | `cth: RDPU BNI-AM` |
| `rdpt` | `cth: RDPT Sucorinvest` |
| `gold` | `cth: Emas Antam 5gr` |
| `crypto` | `cth: Bitcoin` |
| `stock` | `cth: BBCA` |
| `other_asset` | `cth: Motor Honda Vario` |

### Post-Save Behavior

1. Redirect ke `/portfolio`
2. Success toast / URL param: `?success=Aset berhasil ditambahkan.`
3. Revalidate portfolio page data

---

## 10. Add Liability Flow

### Entry Point

"+ Tambah" button in Hutang & Kewajiban section → navigates to `/portfolio/add-liability`.

### Liability Form Layout

```
┌──────────────────────────────────────┐
│  ← Kembali                          │
│                                      │
│  Tambah Hutang                       │
│  Catat hutang atau kewajiban baru.   │
├──────────────────────────────────────┤
│                                      │
│  Nama hutang                         │
│  ┌──────────────────────────────────┐│
│  │ cth: Hutang ke Andi             ││
│  └──────────────────────────────────┘│
│                                      │
│  Total hutang awal                   │
│  ┌──────────────────────────────────┐│
│  │ Rp              0               ││
│  └──────────────────────────────────┘│
│                                      │
│  Sisa hutang                         │
│  ┌──────────────────────────────────┐│
│  │ Rp              0               ││
│  └──────────────────────────────────┘│
│                                      │
│  Tanggal jatuh tempo (opsional)      │
│  ┌──────────────────────────────────┐│
│  │ Pilih tanggal                    ││
│  └──────────────────────────────────┘│
│                                      │
│  Catatan (opsional)                  │
│  ┌──────────────────────────────────┐│
│  │                                  ││
│  └──────────────────────────────────┘│
│                                      │
│  [ Simpan Hutang ]                   │
│  Batal                               │
└──────────────────────────────────────┘
```

### Liability Form Fields

| Field | Label | Required | Input | Notes |
|-------|-------|----------|-------|-------|
| Name | Nama hutang | Yes | text | max 120 chars |
| Amount | Total hutang awal | Yes | Rp + numeric | The original debt amount |
| Remaining | Sisa hutang | Yes | Rp + numeric | Current balance (must ≤ amount) |
| Due Date | Tanggal jatuh tempo | No | date | Optional |
| Notes | Catatan | No | textarea | max 1000 chars |

### Validation Rules

```
name: required, trim, > 0 chars, ≤ 120 chars
amount: required, > 0, ≤ 999,999,999,999,999
remaining_amount: required, ≥ 0, ≤ amount
due_date: optional, valid date
notes: optional, ≤ 1000 chars
```

### Error Copy

| Validation | Copy |
|-----------|------|
| Name empty | `Nama hutang harus diisi.` |
| Amount = 0 | `Nominal hutang harus lebih dari 0.` |
| Remaining > amount | `Sisa hutang tidak boleh lebih dari total hutang awal.` |
| Amount too large | `Nominal terlalu besar.` |

### Post-Save

Same as add asset: redirect to `/portfolio`, success message, revalidate.

---

## 11. Empty State

### Full Portfolio Empty

When user has NO assets (only account balances exist, which they always have from onboarding) and NO liabilities:

```
┌──────────────────────────────────────┐
│  KEKAYAAN                            │
│  Portfolio                           │
│  Pantau aset dan net worth kamu.     │
├──────────────────────────────────────┤
│                                      │
│  🟢 Hero Card: Net Worth             │
│     (shows total account balances    │
│      as total asset, Rp0 liability)  │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Daftar Aset              + Tambah   │
│  ┌──────────────────────────────────┐│
│  │ 🏦 Cash & Rekening              ││
│  │   BCA             Rp2.500.000   ││
│  │   GoPay              Rp150.000  ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │  💡                              ││
│  │  Punya investasi atau aset?      ││
│  │                                  ││
│  │  Catat reksadana, emas, crypto,  ││
│  │  saham, atau aset lainnya        ││
│  │  untuk melihat alokasi kamu.     ││
│  │                                  ││
│  │  [ + Tambah Aset ]              ││
│  └──────────────────────────────────┘│
│                                      │
│  Hutang & Kewajiban       + Tambah   │
│  ┌──────────────────────────────────┐│
│  │  Belum ada hutang dicatat.       ││
│  │  Semoga tetap begitu! 😊        ││
│  └──────────────────────────────────┘│
│                                      │
└──────────────────────────────────────┘
```

**Key decisions:**
- Hero card is **always shown** — account balances form the baseline net worth
- Asset allocation donut is **hidden** when only one category exists (Cash & Rekening only)
- Show donut only when ≥ 2 allocation categories have non-zero values
- The teaser card encourages adding more assets
- Liability empty state: friendly positive message + add button

### Empty State Designs

**Asset teaser card:**
```
bg-surface rounded-card border border-dashed border-accent/30 p-5 text-center
Icon: 💡 text-2xl
Title: "Punya investasi atau aset?" — text-sm font-bold
Description: — text-sm text-muted leading-6
CTA: "+ Tambah Aset" — inline button, bg-accent text-accent-foreground rounded-control
```

**Liability empty state:**
```
bg-surface rounded-card border border-dashed border-border p-5 text-center
text-sm text-muted
"Belum ada hutang dicatat. Semoga tetap begitu! 😊"
```

---

## 12. Loading State

Portfolio is a **Server Component** — loading handled by `loading.tsx`.

### Skeleton Layout

```
┌──────────────────────────────────────┐
│  ████████ ████                       │  ← eyebrow
│  ████████████████████                │  ← title
│  ████████████████████████████████    │  ← desc
├──────────────────────────────────────┤
│  ┌──────────────────────────────────┐│
│  │ ████████████ ████████ (accent)   ││  ← hero skeleton
│  │ ██████████████████████████       ││
│  │ ████████████  ████████████       ││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ ┌───────┐                        ││  ← donut skeleton
│  │ │       │  ████████ ████  ██%    ││
│  │ │       │  ████████ ████  ██%    ││
│  │ └───────┘  ████████ ████  ██%    ││
│  └──────────────────────────────────┘│
│  ████████████                        │
│  ┌──────────────────────────────────┐│
│  │ ██████████████ ██████████████    ││  ← asset row skeletons
│  │ ██████████████ ██████████████    ││
│  │ ██████████████ ██████████████    ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**Skeleton specs:**
- Hero: `bg-accent/30 animate-pulse rounded-card h-[160px]`
- Donut area: `bg-surface-muted animate-pulse rounded-card h-[240px]`
- Asset rows: `bg-surface-muted animate-pulse h-[60px]` × 3
- All with `rounded-card`

---

## 13. Error State

### Full Data Fetch Error

```
┌──────────────────────────────────────┐
│  KEKAYAAN                            │
│  Portfolio                           │
├──────────────────────────────────────┤
│  ┌──────────────────────────────────┐│
│  │  ⚠️                              ││
│  │  Data portfolio belum bisa       ││
│  │  dimuat.                         ││
│  │                                  ││
│  │  Ada masalah saat mengambil      ││
│  │  data aset dan hutang kamu.      ││
│  │  Coba refresh halaman ini.       ││
│  │                                  ││
│  │  [ ↻ Refresh ]                  ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**Design (reuse DashboardError pattern):**
- `bg-surface rounded-card border border-expense/30 p-6 text-center`
- Icon: `⚠️` text-3xl
- Title: `"Data portfolio belum bisa dimuat"` — text-lg font-bold
- CTA: `"Refresh"` → `router.refresh()`

### Partial Error

If assets load but liabilities fail:
```
Hutang & Kewajiban
┌──────────────────────────────────────┐
│ Data hutang belum bisa dimuat.       │
│ [Coba lagi]                          │
└──────────────────────────────────────┘
```

---

## 14. Indonesian Microcopy

### PageIntro

| Element | Copy |
|---------|------|
| Eyebrow | `KEKAYAAN` |
| Title | `Portfolio` |
| Description | `Pantau aset, hutang, dan net worth kamu.` |

### Hero Card

| Element | Copy |
|---------|------|
| Eyebrow | `NET WORTH` |
| Asset label | `↑ Aset` |
| Liability label | `↓ Hutang` |
| Negative warning | `Hutang melebihi total aset` |

### Asset Allocation

| Element | Copy |
|---------|------|
| Section title | `Alokasi Aset` |

### Allocation Category Labels

| Type | Display Label |
|------|---------------|
| Cash & accounts | `Cash & Rekening` |
| `rdpu` + `rdpt` | `Reksadana` |
| `gold` | `Emas` |
| `crypto` | `Crypto` |
| `stock` | `Saham` |
| `other_asset` | `Aset Lain` |

### Daftar Aset

| Element | Copy |
|---------|------|
| Section title | `Daftar Aset` |
| Add CTA | `+ Tambah` |
| Empty teaser title | `Punya investasi atau aset?` |
| Empty teaser desc | `Catat reksadana, emas, crypto, saham, atau aset lainnya untuk melihat alokasi kamu.` |
| Empty teaser CTA | `+ Tambah Aset` |

### Account Type Sublabels

| Account Type | Sublabel |
|-------------|----------|
| `cash` | `Cash` |
| `bank_account` | `Rekening` |
| `e_wallet` | `E-Wallet` |

### Group Headers

| Asset Type Group | Header |
|-----------------|--------|
| accounts | `🏦 Cash & Rekening` |
| rdpu/rdpt | `📈 Reksadana` |
| gold | `🪙 Emas` |
| crypto | `₿ Crypto` |
| stock | `📊 Saham` |
| other_asset | `📦 Aset Lain` |

### Hutang & Kewajiban

| Element | Copy |
|---------|------|
| Section title | `Hutang & Kewajiban` |
| Add CTA | `+ Tambah` |
| Remaining format | `Sisa {remaining} dari {total}` |
| Due date label | `Jatuh tempo: {date}` |
| Due soon warning | `⚠️ Jatuh tempo: {date}` |
| Past due warning | `⚠️ Lewat jatuh tempo!` |
| Total label | `Total hutang` |
| Empty state | `Belum ada hutang dicatat. Semoga tetap begitu! 😊` |

### Add Asset Page

| Element | Copy |
|---------|------|
| Title | `Tambah aset baru` |
| Description | `Pilih jenis aset yang ingin kamu catat.` |
| Type: RDPU | `📈 Reksadana Pasar Uang (RDPU)` |
| Type: RDPT | `📈 Reksadana Pend. Tetap (RDPT)` |
| Type: Gold | `🪙 Emas` |
| Type: Crypto | `₿ Crypto / Bitcoin` |
| Type: Stock | `📊 Saham Indonesia` |
| Type: Other | `📦 Aset lainnya` |
| Form submit | `Simpan Aset` |
| Form cancel | `Batal` |
| Success message | `Aset berhasil ditambahkan.` |

### Add Liability Page

| Element | Copy |
|---------|------|
| Title | `Tambah Hutang` |
| Description | `Catat hutang atau kewajiban baru.` |
| Form submit | `Simpan Hutang` |
| Form cancel | `Batal` |
| Success message | `Hutang berhasil dicatat.` |

### Edit Pages

| Element | Copy |
|---------|------|
| Edit asset title | `Edit Aset` |
| Edit liability title | `Edit Hutang` |
| Update button | `Simpan Perubahan` |
| Delete button | `Hapus Aset` / `Hapus Hutang` |
| Delete confirm | `Yakin hapus {name}? Data ini tidak bisa dikembalikan.` |
| Delete success | `Aset berhasil dihapus.` / `Hutang berhasil dihapus.` |

### Error Copy

| Context | Copy |
|---------|------|
| Full error | `Data portfolio belum bisa dimuat.` |
| Asset error | `Data aset belum bisa dimuat.` |
| Liability error | `Data hutang belum bisa dimuat.` |
| Save error | `Aset belum berhasil disimpan. Coba periksa datanya lagi.` |

---

## 15. What to Implement Now

### Priority 1: Data Layer

1. **`src/lib/portfolio/data.ts`** — Portfolio data queries
   - `getPortfolioData()`: fetches accounts (cash/bank/e-wallet), assets, liabilities
   - Returns typed result with calculations: totalAsset, totalLiability, netWorth
   - Allocation calculation: group assets + accounts by display category
   - Sort accounts: cash → bank → e-wallet, then alphabetical
   - Sort assets: by type group, then alphabetical by name
   - Sort liabilities: by due_date (nearest first), then by remaining_amount desc

2. **`src/lib/portfolio/types.ts`** — Type definitions
   - `PortfolioData`, `PortfolioAssetItem`, `PortfolioLiabilityItem`
   - `AllocationCategory`, `AllocationSlice`

### Priority 2: Portfolio Page

3. **`src/app/(app)/portfolio/page.tsx`** — Replace placeholder with real page
4. **`src/app/(app)/portfolio/loading.tsx`** — Skeleton loading state

### Priority 3: Portfolio Components

5. **`src/components/portfolio/hero-card.tsx`** — Net worth hero
6. **`src/components/portfolio/asset-allocation.tsx`** — Donut ring + legend
7. **`src/components/portfolio/asset-list.tsx`** — Grouped asset cards
8. **`src/components/portfolio/liability-list.tsx`** — Liability cards with progress
9. **`src/components/portfolio/portfolio-error.tsx`** — Error state

### Priority 4: Add/Edit Flows

10. **`src/app/(app)/portfolio/add-asset/page.tsx`** — Type selector page
11. **`src/app/(app)/portfolio/add-asset/form/page.tsx`** — Asset form (type from query param)
12. **`src/app/(app)/portfolio/add-liability/page.tsx`** — Liability form
13. **`src/components/portfolio/asset-form.tsx`** — Reusable asset form component
14. **`src/components/portfolio/liability-form.tsx`** — Reusable liability form component
15. **`src/app/(app)/portfolio/actions.ts`** — Server actions (CRUD for assets + liabilities)
16. **`src/lib/portfolio/validation.ts`** — Form validation

### Priority 5: Edit + Delete

17. **`src/app/(app)/portfolio/asset/[id]/page.tsx`** — Edit asset page
18. **`src/app/(app)/portfolio/liability/[id]/page.tsx`** — Edit liability page

### Priority 6: Dashboard Integration

19. **Replace** the `PlaceholderCard` on Dashboard with a **Portfolio Summary card**
    - Shows net worth number + asset/liability counts
    - "Lihat Portfolio →" link
    - Compact, 1 card, not the full portfolio view

### Priority 7: New CSS Tokens

20. **Add allocation color tokens** to `globals.css`:
```css
:root {
  --alloc-cash: #3bba8a;
  --alloc-rd: #5b8def;
  --alloc-gold: #e8b94a;
  --alloc-crypto: #f0924e;
  --alloc-stock: #c75edb;
  --alloc-other: #9caaa3;
}
```
Register in `@theme inline` block.

---

## 16. What to Postpone

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| Auto-price BTC/crypto | Needs free API, rate limits, cron job | Portfolio v2 |
| Auto-price gold | Needs gold price API | Portfolio v2 |
| Realtime stock price | Needs IDX API or scraping | Portfolio v2 |
| Net worth history chart | Needs asset_snapshots populated + charting lib | Portfolio v2 |
| Return/profit calculation | (current_value - total_cost) / total_cost | Portfolio v2 |
| Asset snapshots cron | Daily snapshot of all asset values | Portfolio v2 |
| Performance comparison | vs IHSG, vs SBN, vs inflation | Analytics |
| Investment transactions | Buy/sell recording with balance effect | Investment phase |
| Multi-currency support | USD, BTC native — needs forex conversion | Later |
| Asset categories/tags | "Emergency fund", "Retirement" — grouping | Portfolio v2 |
| Drag-to-reorder assets | Custom sorting | Polish |
| Import from CSV/Excel | Bulk import assets | Import/export phase |
| Privacy mode for portfolio | Rp•••••• masking | Privacy phase |
| Liability payment recording | Link payment transactions to liabilities | Investment phase |
| Debt reminder notifications | Push notifications for due dates | Notifications phase |

---

## 17. Edge Cases

| # | Case | Expected Behavior |
|---|------|-------------------|
| 1 | User has 0 accounts | Hero card shows Rp0 net worth. Account group hidden. |
| 2 | User has accounts but 0 assets + 0 liabilities | Hero shows account totals. Donut hidden. Teaser shown. |
| 3 | User has only 1 allocation category | Donut hidden — full circle is not informative. List still shows. |
| 4 | User has only liabilities, no assets | Net worth is negative. Warning text shown. |
| 5 | Liability remaining_amount = 0 | Show as "Lunas ✓". Progress bar 0%. Keep in list (not hidden). |
| 6 | Liability remaining_amount = amount (100%) | Full progress bar. Normal display. |
| 7 | Asset current_value = 0 | Valid (e.g., stock went to zero). Show Rp0. Include in allocation as 0%. |
| 8 | Total asset = 0 | Donut hidden. Allocation section shows "Belum ada aset". |
| 9 | Very long asset name | Truncate with `truncate` class. Full name visible on edit page. |
| 10 | Very large numbers (> Rp1 Milyar) | formatIdr handles. No abbreviation — let text wrap if needed. |
| 11 | Due date in the past | ⚠️ "Lewat jatuh tempo!" in `text-expense font-bold`. |
| 12 | Due date within 7 days | ⚠️ warning style, not error. |
| 13 | User adds same asset name twice | Allowed — names are not unique. User's choice. |
| 14 | User navigates directly to /portfolio/asset/invalid-uuid | 404 via `notFound()`. |
| 15 | Supabase RLS blocks data (user not authenticated) | Redirect to login (existing auth middleware). |

---

## 18. Suggested Component/File Structure

```
src/
├── app/(app)/portfolio/
│   ├── page.tsx                    ← Main portfolio page (server component)
│   ├── loading.tsx                 ← Skeleton loading state
│   ├── actions.ts                  ← Server actions: CRUD assets + liabilities
│   ├── add-asset/
│   │   └── page.tsx                ← Asset type selector
│   ├── add-asset-form/
│   │   └── page.tsx                ← Asset form (?type=rdpu)
│   ├── add-liability/
│   │   └── page.tsx                ← Liability form
│   ├── asset/
│   │   └── [id]/
│   │       └── page.tsx            ← Edit asset page
│   └── liability/
│       └── [id]/
│           └── page.tsx            ← Edit liability page
├── components/portfolio/
│   ├── hero-card.tsx               ← Net worth hero
│   ├── asset-allocation.tsx        ← Donut ring + legend
│   ├── asset-list.tsx              ← Grouped asset cards
│   ├── liability-list.tsx          ← Liability cards + progress bars
│   ├── asset-form.tsx              ← Reusable asset form (create + edit)
│   ├── liability-form.tsx          ← Reusable liability form
│   ├── portfolio-error.tsx         ← Error state component
│   └── donut-chart.tsx             ← SVG donut ring component
└── lib/portfolio/
    ├── data.ts                     ← Data fetching + calculations
    ├── types.ts                    ← Type definitions
    └── validation.ts               ← Form validation helpers
```

---

## Appendix: Visual Polish Notes

### Typography Scale

| Element | Class | Size |
|---------|-------|------|
| Net worth amount | `text-3xl font-extrabold tracking-[-0.04em]` | 30px |
| Allocation percentage | `text-sm font-bold` | 14px |
| Section title | `text-lg font-bold` | 18px |
| Asset value | `text-sm font-bold tabular-nums` | 14px |
| Liability remaining | `text-xs text-muted` | 12px |
| Eyebrow label | `text-[0.68rem] font-bold uppercase tracking-[0.16em]` | ~11px |

### Micro-interactions

| Element | Interaction |
|---------|------------|
| Donut segments | Draw-in animation on mount, 600ms ease-out |
| Asset row tap | `hover:bg-surface-muted active:scale-[0.99]` |
| Liability card tap | `hover:bg-surface-muted active:scale-[0.99]` |
| "+ Tambah" button | `hover:underline` |
| Progress bar | Width transition 300ms ease-out |
| Hero pills | No hover — info-only |
| Type selector rows | `active:scale-[0.98]` |

### SVG Donut Implementation Notes

```
SVG viewBox: 0 0 200 200
Circle center: 100, 100
Radius: 70 (for a 200×200 viewBox)
Stroke width: 28

Each segment:
  <circle cx="100" cy="100" r="70"
    fill="none"
    stroke="{color}"
    stroke-width="28"
    stroke-dasharray="{segmentLength} {circumference - segmentLength}"
    stroke-dashoffset="{offset}"
    transform="rotate(-90 100 100)"
    stroke-linecap="round" (for first and last segment only)
  />

Circumference = 2 * π * 70 ≈ 439.82
Segment length = (percentage / 100) * circumference
```
