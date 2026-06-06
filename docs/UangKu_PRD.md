# PRD — UangKu

## 1. Product Overview

**UangKu** adalah aplikasi personal finance berbasis **mobile-first web app/PWA** untuk membantu user mencatat pemasukan, pengeluaran, transfer antar akun, aset, budget, dan perkembangan net worth secara rapi.

Aplikasi ini awalnya dibuat untuk penggunaan pribadi, tetapi struktur fiturnya tetap disiapkan agar bisa dikembangkan menjadi produk publik di masa depan.

## 2. Product Vision

Membantu user menjawab 3 pertanyaan utama:

```txt
1. Uang saya keluar ke mana?
2. Sisa uang saya bulan ini berapa?
3. Total aset dan net worth saya bertumbuh atau tidak?
```

UangKu bukan hanya expense tracker, tapi juga menjadi **personal finance dashboard** yang menggabungkan:

```txt
- Cashflow harian
- Saldo rekening/e-wallet
- Budget bulanan
- Portfolio/aset
- Liability/hutang
- Net worth
```

---

## 3. Target User

### Primary User

User pribadi yang ingin:

```txt
- mencatat pengeluaran/pemasukan harian
- memisahkan beberapa rekening/e-wallet
- melacak aset seperti reksadana, emas, Bitcoin, saham
- melihat net worth
- mengatur budget
- tetap nyaman menggunakan app setiap hari
```

### Future User

Aplikasi bisa dikembangkan untuk:

```txt
- keluarga
- pasangan
- UMKM kecil
- user publik dengan multi account
```

Tapi untuk MVP, fokusnya tetap **single-user personal use**.

---

## 4. Platform

### MVP Platform

```txt
Web App / PWA
Mobile-first
Installable ke home screen Android
Deploy biaya Rp0
```

### Recommended Stack

```txt
Frontend:
Next.js + TypeScript

Styling:
Tailwind CSS

Backend:
Next.js API Routes / Server Actions

Database:
Supabase Postgres

Auth:
Supabase Auth

Storage:
Supabase Storage

Deploy:
Vercel Hobby

Export:
xlsx / CSV generator

OCR:
Tesseract.js untuk versi gratis

AI:
Opsional, hanya jika tersedia free tier / local / later phase
```

---

## 5. Product Tone & UX Direction

### Brand Personality

UangKu terasa seperti:

```txt
Friendly
Modern
Jelas
Praktis
Tidak menggurui
```

Aplikasi berbicara seperti **teman finansial**, bukan sistem bank yang kaku.

### Bahasa

Bahasa utama:

```txt
Bahasa Indonesia
```

Tetapi beberapa istilah finance boleh tetap English:

```txt
cashflow
net worth
portfolio
saving rate
budget
```

Contoh copywriting:

```txt
Oke, pengeluaran makan Rp25.000 sudah aku catat.
```

Error message:

```txt
Aku belum paham transaksi ini. Coba pilih template atau isi manual ya.
```

Budget warning:

```txt
Budget makan kamu tinggal Rp120.000 bulan ini.
```

Insight:

```txt
Pengeluaran makan kamu agak naik minggu ini. Masih aman, tapi mulai pantau ya.
```

---

## 6. Visual Direction

### Referensi UI

```txt
Bibit
Jago
```

### Style

```txt
Modern fintech
Mobile-first
Clean card layout
Rounded corners
Soft shadow
Friendly empty state
Clear financial numbers
```

### Theme System

UangKu harus punya fitur ganti tema agar user tidak cepat bosan.

#### Appearance Settings

```txt
Mode:
- Light
- Dark
- System

Accent Theme:
- Emerald
- Blue
- Purple
- Orange
- Mono
```

#### Theme Behavior

Theme memengaruhi:

```txt
- primary button
- active bottom nav
- progress bar
- card accent
- badge
- chart accent
```

Tetapi warna makna finansial tetap konsisten:

```txt
Income: hijau
Expense: merah/orange
Transfer: biru/abu
Investment: ungu/biru
Debt: merah
```

---

## 7. Core Navigation

Bottom navigation:

```txt
Dashboard | Cashflow | Chat | Portfolio | Settings
```

### Dashboard

Fokus ke ringkasan utama.

### Cashflow

List transaksi, filter, tambah/edit transaksi.

### Chat

Input transaksi dengan chat + template chips.

### Portfolio

Aset, net worth, asset allocation.

### Settings

Akun, kategori, budget, appearance, privacy, export.

---

## 8. MVP Scope

### Included in MVP

```txt
1. Authentication
2. Onboarding
3. Account/rekening/e-wallet management
4. Manual transaction input
5. Transfer antar akun
6. Cashflow dashboard
7. Category management
8. Budget management
9. Chat input sederhana dengan template
10. Transaction preview sebelum simpan
11. Asset tracker basic
12. Liability tracker basic
13. Net worth dashboard
14. Asset allocation
15. Privacy Mode
16. PIN Lock
17. Theme customization
18. Export Excel/CSV
19. PWA installable
```

### Not MVP / Later Phase

```txt
1. Integrasi bank resmi
2. WhatsApp bot
3. AI parser berbayar
4. OCR struk akurat berbasis API berbayar
5. Auto read Gmail production-ready
6. Multi-user family account
7. Subscription/payment
8. Full mobile app native
9. Advanced investment analytics
10. Auto-sync Bibit/Stockbit/e-wallet
```

---

## 9. Onboarding Flow

Onboarding menggunakan wizard 3 langkah dan bisa di-skip.

### Step 1 — Tambahkan Akun Uang

User menambahkan akun seperti:

```txt
BCA
Jago
GoPay
Cash
Bibit
Stockbit
```

Account type:

```txt
Cash
Bank Account
E-Wallet
Investment Account
Asset Account
Liability
```

### Step 2 — Isi Saldo Awal

User mengisi saldo awal tiap akun.

Contoh:

```txt
BCA: Rp2.000.000
Jago: Rp1.000.000
GoPay: Rp150.000
Cash: Rp100.000
```

Saldo ini menjadi dasar perhitungan cashflow dan account balance.

### Step 3 — Buat Budget Awal

User bisa membuat budget awal.

Contoh:

```txt
Makan: Rp700.000/bulan
Transport: Rp400.000/bulan
Lifestyle: Rp500.000/bulan
```

---

## 10. Dashboard Requirements

Dashboard harus langsung menampilkan data paling penting.

### Hero Section

Primary number:

```txt
Sisa Bulan Ini
Rp2.850.000
```

Secondary cards:

```txt
Net Worth
Rp25.400.000

Saving Rate
62%
```

### Dashboard Cards

```txt
Income bulan ini
Expense bulan ini
Cashflow bulan ini
Top spending category
Recent transactions
Budget warning
Portfolio summary
```

### Privacy Mode

User bisa klik icon mata untuk menyembunyikan semua nominal.

Contoh:

```txt
Rp25.400.000
```

menjadi:

```txt
Rp••••••••
```

Privacy Mode tersedia di:

```txt
Dashboard
Settings
```

---

## 11. Account Management

User bisa membuat banyak akun.

### Account Types

```txt
Cash
Bank Account
E-Wallet
Investment Account
Asset Account
Liability
```

### Account Fields

```ts
type Account = {
  id: string;
  user_id: string;
  name: string;
  type:
    | "cash"
    | "bank_account"
    | "e_wallet"
    | "investment_account"
    | "asset_account"
    | "liability";
  initial_balance: number;
  current_balance: number;
  currency: "IDR";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

### Balance Behavior

Saldo akun otomatis berubah saat transaksi disimpan.

Contoh expense:

```txt
Makan Rp25.000 dari BCA
↓
Saldo BCA berkurang Rp25.000
```

Contoh income:

```txt
Gaji Rp4.700.000 masuk ke BCA
↓
Saldo BCA bertambah Rp4.700.000
```

Contoh transfer:

```txt
Transfer Rp100.000 dari BCA ke GoPay
↓
Saldo BCA berkurang Rp100.000
Saldo GoPay bertambah Rp100.000
```

---

## 12. Transaction System

### Transaction Types

```txt
Income
Expense
Transfer
Investment Buy
Investment Sell
Asset Update
Debt
```

### Required Fields

```txt
Tipe
Nominal
Akun
Kategori
Tanggal
```

### Optional Fields

```txt
Catatan
Merchant
Tag
Upload bukti
```

### Transaction Model

```ts
type Transaction = {
  id: string;
  user_id: string;
  type:
    | "income"
    | "expense"
    | "transfer"
    | "investment_buy"
    | "investment_sell"
    | "asset_update"
    | "debt";

  amount: number;
  category_id: string;
  account_id: string;

  transfer_to_account_id?: string;
  asset_id?: string;

  transaction_date: string;
  merchant?: string;
  notes?: string;

  source: "manual" | "chat" | "ocr" | "email";
  created_at: string;
  updated_at: string;
};
```

### Important Rule

Transfer dan investment buy **tidak boleh dihitung sebagai expense konsumtif**.

Contoh:

```txt
Top up RDPU Rp500.000
```

Bukan:

```txt
Expense Rp500.000
```

Tapi:

```txt
Transfer dari BCA ke Asset RDPU
```

atau:

```txt
Investment Buy
```

---

## 13. Manual Input UX

Manual input menggunakan **quick form pendek dulu, detail opsional**.

### Flow

```txt
Klik tombol +
↓
Pilih tipe transaksi
↓
Isi nominal
↓
Pilih akun
↓
Pilih kategori
↓
Pilih tanggal
↓
Simpan
```

### Detail Opsional

User bisa expand section:

```txt
Tambah detail
```

Berisi:

```txt
Merchant
Catatan
Upload bukti
Tag
```

### CTA

Primary button:

```txt
Simpan Transaksi
```

Success message:

```txt
Oke, transaksi berhasil dicatat.
```

---

## 14. Category System

Kategori MVP menggunakan kategori detail, tetapi tetap bisa diedit user.

### Category Groups

```txt
Primer
Sekunder
Lifestyle
Transport
Tagihan
Kesehatan
Pendidikan
Investasi
Transfer
Income
Debt
Other
```

### Example Categories

#### Primer

```txt
Makan
Belanja kebutuhan
Pulsa
Internet
```

#### Sekunder

```txt
Kopi
Jajan
Hiburan
Subscription
```

#### Lifestyle

```txt
Baju
Skincare
Gadget
Hobi
```

#### Transport

```txt
Bensin
Parkir
Ojek online
Tol
Servis kendaraan
```

#### Tagihan

```txt
Listrik
Air
Internet rumah
Cicilan
```

#### Investasi

```txt
RDPU
RDPT
Emas
Bitcoin
Saham
```

#### Income

```txt
Gaji
Bonus
Freelance
Hadiah
```

### Category Model

```ts
type Category = {
  id: string;
  user_id: string;
  name: string;
  group:
    | "primer"
    | "sekunder"
    | "lifestyle"
    | "transport"
    | "tagihan"
    | "kesehatan"
    | "pendidikan"
    | "investasi"
    | "transfer"
    | "income"
    | "debt"
    | "other";
  transaction_type: "income" | "expense" | "transfer" | "investment" | "debt";
  icon?: string;
  color?: string;
  is_default: boolean;
  is_active: boolean;
};
```

---

## 15. Chat Input UX

Chat input menggunakan gabungan:

```txt
Chat interface + template chips
```

### Main Flow

```txt
User mengetik atau pilih template
↓
Parser membaca input
↓
App menampilkan preview transaksi
↓
User edit kalau perlu
↓
User klik Simpan
```

Untuk MVP, semua hasil chat **wajib preview dulu** sebelum disimpan.

### Template Groups

```txt
Primer
Sekunder
Investasi
Transfer
Income
Tagihan
```

### Example Template Chips

#### Primer

```txt
makan [nominal]
belanja kebutuhan [nominal]
pulsa [nominal]
```

#### Sekunder

```txt
kopi [nominal]
jajan [nominal]
hiburan [nominal]
```

#### Investasi

```txt
top up RDPU [nominal]
top up RDPT [nominal]
beli emas [gram/nominal]
beli BTC [nominal]
beli saham [kode] [nominal]
```

#### Transfer

```txt
transfer dari [akun] ke [akun] [nominal]
isi GoPay dari BCA [nominal]
tarik cash dari BCA [nominal]
```

#### Income

```txt
gaji [nominal]
bonus [nominal]
freelance [nominal]
```

### Chat Parsing MVP

MVP parser boleh rule-based dulu.

Supported amount format:

```txt
25000
25.000
25k
25rb
1jt
1.5jt
4,7jt
```

Supported date keyword:

```txt
hari ini
kemarin
tadi pagi
tadi siang
tadi malam
```

Kalau parser tidak yakin:

```txt
Aku belum paham transaksi ini. Coba pilih template atau isi manual ya.
```

---

## 16. Budget System

Budget dibuat berdasarkan:

```txt
Kategori + periode
```

Budget harus bisa exclude:

```txt
Transfer
Investment Buy
Investment Sell
Asset Update
```

Karena transaksi tersebut bukan konsumsi.

### Budget Model

```ts
type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  period: "weekly" | "monthly";
  amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
};
```

### Budget Warning

Jika budget hampir habis:

```txt
Budget makan kamu tinggal Rp120.000 bulan ini.
```

Dashboard menampilkan warning jika:

```txt
spending >= 80% dari budget
```

---

## 17. Portfolio / Asset Tracker

Portfolio menampilkan:

```txt
Total aset
Net worth
Asset allocation
Daftar aset
Liability
```

### Asset Types

```txt
Cash
Reksadana Pasar Uang
Reksadana Pendapatan Tetap
Emas
Bitcoin/Crypto
Saham Indonesia
Other Asset
Liability
```

### Asset Model

```ts
type Asset = {
  id: string;
  user_id: string;
  account_id?: string;

  name: string;
  type:
    | "cash"
    | "rdpu"
    | "rdpt"
    | "gold"
    | "crypto"
    | "stock"
    | "other_asset"
    | "liability";

  platform?: string;
  currency: "IDR";

  quantity?: number;
  unit?: string;

  total_cost?: number;
  current_value: number;

  auto_price_enabled: boolean;
  last_price?: number;
  last_price_updated_at?: string;

  notes?: string;
  created_at: string;
  updated_at: string;
};
```

### Asset Price Update

MVP rule:

```txt
BTC: auto price kalau API gratis tersedia
Emas: auto price kalau API gratis tersedia, fallback manual
Saham: manual dulu
Reksadana: manual dulu
```

### Reksadana Data

Untuk RDPU/RDPT:

```txt
Nama produk
Jenis: RDPU/RDPT
Platform: Bibit/Bareksa/lainnya
Total modal
Nilai saat ini
Return manual
```

### Saham Data

Untuk saham MVP:

```txt
Kode saham
Total nilai sekarang
```

Contoh:

```txt
BBCA
Rp1.500.000
```

Detail seperti lot, average price, broker bisa ditambah nanti.

---

## 18. Net Worth Calculation

Formula:

```txt
Net Worth = Total Assets - Total Liabilities
```

Included assets:

```txt
Cash
Bank Account
E-Wallet
Investment Account
Asset Account
RDPU
RDPT
Emas
Bitcoin
Saham
Other Asset
```

Included liabilities:

```txt
Hutang
Cicilan
Debt account
```

Dashboard portfolio menampilkan:

```txt
Net Worth
Total Asset
Total Liability
Asset Allocation
```

---

## 19. Liability System

Liability harus:

```txt
Mengurangi net worth
Punya optional reminder jatuh tempo
```

### Liability Fields

```ts
type Liability = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  remaining_amount: number;
  due_date?: string;
  reminder_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
};
```

Copywriting reminder:

```txt
Ada hutang yang jatuh tempo sebentar lagi.
```

---

## 20. Privacy & Security

### PIN Lock

PIN Lock tersedia di Settings.

Default:

```txt
Aktif setiap buka app
```

Tetapi user bisa ubah.

Options:

```txt
Setiap buka app
Setelah tidak aktif 5 menit
Hanya halaman sensitif
Nonaktif
```

### Privacy Mode

Privacy Mode menyembunyikan semua nominal.

Aktif dari:

```txt
Dashboard icon mata
Settings
```

### Data Sensitif

Data yang perlu disembunyikan:

```txt
Saldo akun
Net worth
Nominal transaksi
Nilai aset
Budget
Liability
```

### Encryption

Untuk MVP:

```txt
Simpan data di Supabase dengan RLS aktif.
```

Untuk data sensitif:

```txt
Tambahkan field-level encryption untuk notes/merchant/account detail jika memungkinkan.
```

---

## 21. Export

MVP mendukung:

```txt
Excel
CSV
```

Export data:

```txt
Transactions
Accounts
Assets
Budgets
```

Filter export:

```txt
Tanggal mulai
Tanggal akhir
Kategori
Akun
Tipe transaksi
```

---

## 22. Settings

Settings berisi:

```txt
Profile
Accounts
Categories
Budgets
Appearance
Privacy & Security
Export Data
About UangKu
```

### Appearance

```txt
Mode:
- Light
- Dark
- System

Theme:
- Emerald
- Blue
- Purple
- Orange
- Mono
```

### Privacy & Security

```txt
PIN Lock
Privacy Mode
Hide balance by default
```

---

## 23. Suggested Route Structure

```txt
/
 /login
 /onboarding

 /dashboard
 /cashflow
 /cashflow/new
 /cashflow/[id]/edit

 /chat

 /portfolio
 /portfolio/assets/new
 /portfolio/assets/[id]/edit
 /portfolio/liabilities/new

 /settings
 /settings/accounts
 /settings/categories
 /settings/budgets
 /settings/appearance
 /settings/privacy
 /settings/export
```

---

## 24. Suggested Folder Structure

```txt
src/
  app/
    dashboard/
    cashflow/
    chat/
    portfolio/
    settings/
    onboarding/
    login/

  components/
    ui/
    dashboard/
    cashflow/
    chat/
    portfolio/
    settings/

  lib/
    supabase/
    parser/
    calculations/
    export/
    theme/
    security/

  types/
    account.ts
    transaction.ts
    category.ts
    budget.ts
    asset.ts
    user-settings.ts

  constants/
    categories.ts
    themes.ts
    account-types.ts

  hooks/
    useAccounts.ts
    useTransactions.ts
    useBudgets.ts
    useTheme.ts
    usePrivacyMode.ts
```

---

## 25. Database Tables

MVP tables:

```txt
profiles
accounts
categories
transactions
budgets
assets
asset_snapshots
liabilities
user_settings
transaction_attachments
```

### user_settings

```ts
type UserSettings = {
  id: string;
  user_id: string;
  theme_mode: "light" | "dark" | "system";
  accent_theme: "emerald" | "blue" | "purple" | "orange" | "mono";
  privacy_mode_enabled: boolean;
  pin_lock_enabled: boolean;
  pin_lock_behavior:
    | "on_app_open"
    | "after_5_minutes"
    | "sensitive_pages_only"
    | "disabled";
  created_at: string;
  updated_at: string;
};
```

---

## 26. Acceptance Criteria

### Authentication

```txt
User bisa login/logout.
User tidak bisa melihat data user lain.
RLS aktif untuk semua tabel user-owned.
```

### Onboarding

```txt
User bisa menambahkan akun awal.
User bisa mengisi saldo awal.
User bisa membuat budget awal.
User bisa skip onboarding.
```

### Transaction

```txt
User bisa membuat income.
User bisa membuat expense.
User bisa membuat transfer antar akun.
Saldo akun berubah sesuai transaksi.
Transfer tidak dihitung sebagai expense.
Investment buy tidak dihitung sebagai expense konsumtif.
```

### Chat

```txt
User bisa input transaksi via chat.
App menampilkan preview sebelum simpan.
User bisa edit preview.
Jika input tidak terbaca, app memberi pesan friendly.
```

### Budget

```txt
User bisa membuat budget per kategori dan periode.
Dashboard menampilkan budget warning.
Transfer/investment tidak masuk perhitungan budget konsumtif.
```

### Portfolio

```txt
User bisa menambah aset.
User bisa melihat total aset.
User bisa melihat liability.
App menghitung net worth.
App menampilkan asset allocation.
```

### Theme

```txt
User bisa memilih light/dark/system.
User bisa memilih accent theme.
Pilihan theme tersimpan.
Theme tidak mengganggu readability.
```

### Privacy

```txt
User bisa mengaktifkan privacy mode.
Semua nominal berubah menjadi masked.
PIN lock tersedia di settings.
```

### Export

```txt
User bisa export transaksi ke Excel.
User bisa export transaksi ke CSV.
```

---

## 27. Implementation Phases

### Phase 1 — Foundation

Goal: aplikasi bisa login, onboarding, dan punya struktur data dasar.

Scope:

```txt
- Next.js project setup
- Tailwind setup
- Supabase setup
- Auth
- RLS policies
- User profile
- Theme system
- Layout mobile-first
- Bottom navigation
```

Output:

```txt
User bisa login dan masuk dashboard kosong.
```

---

### Phase 2 — Account & Onboarding

Scope:

```txt
- Onboarding wizard
- Account creation
- Initial balance
- User settings
- Privacy mode basic
```

Output:

```txt
User bisa setup BCA/Jago/GoPay/Cash dan saldo awal.
```

---

### Phase 3 — Manual Cashflow

Scope:

```txt
- Category default
- Manual transaction form
- Income
- Expense
- Transfer
- Account balance update
- Transaction list
- Edit/delete transaction
```

Output:

```txt
User bisa mencatat transaksi harian dan saldo akun berubah otomatis.
```

---

### Phase 4 — Dashboard

Scope:

```txt
- Sisa bulan ini
- Income bulan ini
- Expense bulan ini
- Saving rate
- Recent transactions
- Top spending category
- Budget warning placeholder
```

Output:

```txt
Dashboard sudah berguna untuk melihat kondisi bulan berjalan.
```

---

### Phase 5 — Budget

Scope:

```txt
- Budget per kategori
- Monthly/weekly budget
- Budget progress
- Warning message
- Exclude transfer/investment
```

Output:

```txt
User bisa mengontrol pengeluaran kategori.
```

---

### Phase 6 — Chat Input MVP

Scope:

```txt
- Chat UI
- Template chips
- Rule-based parser
- Preview transaction
- Save from preview
- Friendly error state
```

Output:

```txt
User bisa input transaksi sederhana lewat chat.
```

---

### Phase 7 — Portfolio & Asset Tracker

Scope:

```txt
- Asset CRUD
- RDPU/RDPT
- Emas
- Bitcoin
- Saham
- Liability
- Net worth calculation
- Asset allocation chart
```

Output:

```txt
User bisa melihat total aset dan net worth.
```

---

### Phase 8 — Export & PWA

Scope:

```txt
- Export Excel
- Export CSV
- PWA manifest
- App icon
- Installable Android
```

Output:

```txt
App bisa dipasang ke home screen dan data bisa diexport.
```

---

### Phase 9 — Free Automation Experiments

Scope opsional:

```txt
- OCR struk dengan Tesseract.js
- BTC price auto update dari API gratis
- Gold price auto update jika API gratis tersedia
- Email parser manual/copy-paste
```

Output:

```txt
App mulai punya semi-automation tanpa biaya berbayar.
```

---

## 28. Non-Functional Requirements

### Performance

```txt
Dashboard load cepat.
Form input tidak berat.
Chart tidak menghambat initial render.
```

### Security

```txt
Supabase RLS wajib aktif.
User hanya bisa akses datanya sendiri.
Jangan expose service role key di frontend.
PIN disimpan sebagai hash, bukan plain text.
```

### UX

```txt
Mobile-first.
Semua input utama bisa dilakukan kurang dari 10 detik.
Semua transaksi dari chat harus preview dulu.
Copywriting friendly dan jelas.
```

### Cost

```txt
MVP harus bisa berjalan dengan biaya Rp0.
Gunakan free tier.
Hindari dependency API berbayar untuk core feature.
```

---

## 29. MVP Definition of Done

MVP dianggap selesai jika:

```txt
1. User bisa login.
2. User bisa setup akun dan saldo awal.
3. User bisa catat income, expense, transfer.
4. Saldo akun berubah otomatis.
5. User bisa melihat dashboard cashflow.
6. User bisa membuat budget dan melihat warning.
7. User bisa input via chat sederhana dengan preview.
8. User bisa menambah aset dan liability.
9. User bisa melihat net worth.
10. User bisa mengganti theme.
11. User bisa mengaktifkan privacy mode.
12. User bisa export data Excel/CSV.
13. App bisa diakses dari HP dan dipasang sebagai PWA.
```

---

## 30. Recommended First Build Scope

Untuk eksekusi pertama, jangan langsung semua PRD. Mulai dari scope ini:

```txt
1. Project setup
2. Auth
3. Theme system
4. Onboarding account + saldo awal
5. Manual transaction income/expense/transfer
6. Account balance update
7. Dashboard basic
```

Setelah itu baru lanjut:

```txt
8. Budget
9. Chat input
10. Portfolio
11. Export
12. PWA
13. OCR/automation
```

---

## 31. Notes for Coding Agent

Saat mengimplementasikan aplikasi ini:

```txt
- Prioritaskan mobile-first UI.
- Gunakan pnpm jika project memakai package manager pnpm.
- Jangan membuat fitur non-MVP sebelum fondasi cashflow stabil.
- Jangan memasukkan API berbayar sebagai dependency wajib MVP.
- Pastikan semua data user protected by Supabase RLS.
- Semua transaksi dari chat harus melewati preview sebelum disimpan.
- Transfer dan investment buy tidak boleh dihitung sebagai expense konsumtif.
- Theme harus berbasis preset dan mudah ditambah.
- Privacy mode harus tersedia sejak dashboard awal.
```
