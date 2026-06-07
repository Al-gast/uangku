# UangKu Chat Input — UX/UI Design Spec (MVP)

> **Fase**: Chat Input MVP
> **Target**: Mobile-first, max-width 480px (sesuai `AppShell`)
> **Prerequisite**: Manual cashflow, dashboard, dan budget sudah implemented
> **Parser**: Rule-based (bukan AI)
> **Safety rule**: Selalu preview sebelum simpan — tidak pernah auto-save

---

## 1. Page Goal

Memungkinkan user mencatat transaksi **lebih cepat** dari form manual, menggunakan bahasa sehari-hari.

> *"Saya mau catat pengeluaran cepat tanpa isi form satu-satu."*

Chat Input bukan chatbot AI. Ini adalah **structured shortcut** — sebuah text field dengan template assistance yang mengubah input menjadi transaksi terstruktur, selalu dengan preview dan konfirmasi.

### What Chat Input IS

- Cara cepat catat transaksi umum
- Template chips untuk input tanpa ketik
- Preview yang bisa diedit sebelum disimpan
- Fallback ke form manual kalau parsing gagal

### What Chat Input IS NOT

- Chatbot percakapan (bukan multi-turn)
- AI yang menebak segalanya
- Auto-save tanpa konfirmasi
- Pengganti form manual sepenuhnya

---

## 2. User Mental Model

User memikirkan chat input seperti **mengirim pesan WhatsApp ke asisten keuangan**.

```
Mental model:
"Saya ketik apa yang saya beli dan berapa harganya,
lalu asisten menunjukkan ringkasannya,
saya periksa, lalu simpan."
```

### Flow yang user bayangkan:

```
Ketik "makan 25k" atau pilih template
          ↓
Asisten tampilkan preview:
  "Pengeluaran Makan Rp25.000 dari BCA. Benar?"
          ↓
User periksa → edit kalau perlu
          ↓
Klik Simpan → selesai
          ↓
Asisten konfirmasi → siap input berikutnya
```

### Ekspektasi kecepatan:

| Method | Tap count | Time |
|--------|-----------|------|
| Form manual | 8-12 taps | 15-20 detik |
| Chat template | 2-3 taps | 5-8 detik |
| Chat ketik | 1 ketik + 1 tap | 8-12 detik |

Chat input harus selalu **lebih cepat** dari form manual, atau user tidak punya alasan menggunakannya.

---

## 3. Mobile Layout (Top → Bottom)

### Layout Architecture Decision

> [!IMPORTANT]
> Chat page menggunakan **layout khusus** yang berbeda dari page lain. Input area **docked ke bawah** tepat di atas bottom navigation, mirip messaging app. Konten chat scrollable di atas.

```
┌──────────────────────────────────┐
│  Chat Header (compact)           │  ← Tidak pakai PageIntro
├──────────────────────────────────┤
│                                  │
│  Chat Content Area (scrollable)  │
│                                  │
│  ┌──────────────────────────────┐│
│  │ 💬 Assistant message         ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ 👤 User message              ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ 💬 Preview card              ││
│  │    [Edit] [Simpan]           ││
│  └──────────────────────────────┘│
│                                  │
├──────────────────────────────────┤
│  Template Chips (horizontal)     │  ← Scrollable chip row
├──────────────────────────────────┤
│  ┌────────────────────────┬────┐ │
│  │ Ketik transaksi...     │ ➤  │ │  ← Input bar, docked
│  └────────────────────────┴────┘ │
├──────────────────────────────────┤
│  ══════ Bottom Navigation ══════ │
└──────────────────────────────────┘
```

### Layout Specifications

**Chat Header:**
```
height: auto (compact)
padding: pt-safe-area, px-5
content:
  Title: "Chat" — text-xl font-bold
  Subtitle: "Catat transaksi dengan cepat" — text-xs text-muted
No PageIntro — terlalu besar untuk chat page
```

**Chat Content Area:**
```
flex: 1 (fills remaining space)
overflow-y: auto
padding: px-5 py-4
scroll: always scrolled to bottom on new messages
gap: 12px between message bubbles
```

**Template Chip Row:**
```
position: above input bar
padding: px-5 py-2
overflow-x: auto, scrollbar hidden
border-top: border-t border-border
background: bg-background
```

**Input Bar:**
```
position: sticky bottom, above bottom nav
padding: px-5 py-3
background: bg-surface
border-top: border-t border-border
shadow: shadow-[0_-4px_16px_var(--overlay)]

input field:
  flex-1
  min-h-12 rounded-control
  bg-background border border-border
  px-4 text-sm
  focus: border-accent ring-4 ring-accent-soft

send button:
  size-12 rounded-control
  bg-accent text-accent-foreground
  disabled when input is empty
  icon: send arrow (➤)
```

### Vertical Space Budget

```
Screen: ~667px (iPhone SE) to ~844px (iPhone 15)
Bottom nav: ~72px
Input bar: ~60px
Template chips: ~48px
Header: ~56px
─────────────────
Chat area: ~431px – 608px available
```

---

## 4. Chat Empty State

Ketika user pertama kali membuka Chat page, belum ada message history.

```
┌──────────────────────────────────┐
│  Chat                            │
│  Catat transaksi dengan cepat    │
├──────────────────────────────────┤
│                                  │
│         💬                       │
│                                  │
│   Halo! Kamu bisa catat          │
│   transaksi di sini.             │
│                                  │
│   Ketik langsung, contoh:        │
│   "makan 25k"                    │
│   "gaji 4.7jt"                   │
│                                  │
│   Atau pilih template            │
│   di bawah untuk mulai.          │
│                                  │
├──────────────────────────────────┤
│  [Makan] [Kopi] [Gaji] [→]      │
├──────────────────────────────────┤
│  ┌────────────────────────┬────┐ │
│  │ Ketik transaksi...     │ ➤  │ │
│  └────────────────────────┴────┘ │
├──────────────────────────────────┤
│  ══════ Bottom Navigation ══════ │
└──────────────────────────────────┘
```

**Design:**
- Welcome message styled as assistant bubble (left-aligned)
- `bg-surface rounded-card p-5 max-w-[85%]`
- Icon: `💬` or chat icon from icon system, `text-3xl`
- Title: `"Halo! Kamu bisa catat transaksi di sini."` — `text-sm font-bold`
- Examples: monospaced or `bg-surface-muted px-2 py-0.5 rounded text-accent-strong font-semibold text-xs` inline code style
- Hint: `"Atau pilih template di bawah untuk mulai."` — `text-sm text-muted`

### Session Behavior

> [!IMPORTANT]
> Chat messages **tidak persisted ke database**. Setiap kali user navigasi keluar dan kembali, chat dimulai dari welcome message. Ini disengaja untuk MVP — chat bukan history, tapi tool input.

---

## 5. Template Chip Layout and Grouping

### Architecture

Template chips are organized in **two tiers**:

**Tier 1 — Group tabs** (always visible, scrollable):
```
[ 🍚 Primer ] [ ☕ Sekunder ] [ 💸 Tagihan ] [ 💼 Income ] [ ↔ Transfer ] [ 📈 Investasi ]
```

**Tier 2 — Individual templates** (shown for selected group):
```
Selected: Primer
[ Makan ] [ Belanja kebutuhan ] [ Pulsa ] [ Internet ]
```

### Layout

```
┌──────────────────────────────────────┐
│  Group tabs (tier 1):                │
│  [🍚Primer] [☕Sekunder] [💸Tagihan]→│  ← horizontal scroll
├──────────────────────────────────────┤
│  Template chips (tier 2):            │
│  [Makan] [Belanja kebutuhan] [Pulsa]→│  ← horizontal scroll
└──────────────────────────────────────┘
```

### Group Tab Design

```
Each tab:
  px-3 py-1.5
  rounded-full
  text-xs font-semibold
  border border-border

  default: bg-surface text-muted
  active: bg-accent-soft text-accent-strong border-accent/30

  emoji: inline before label, gap-1
```

### Template Chip Design

```
Each chip:
  px-3.5 py-2
  rounded-full
  text-sm font-semibold
  bg-surface border border-border
  text-foreground

  active:scale-[0.96] transition
  hover:bg-surface-muted

  tap → inserts template text into input field,
        then auto-focuses the input for amount entry
```

### Default Group on Load

`Primer` is selected by default (most common daily use).

---

## 6. Recommended Template Examples per Group

### 🍚 Primer (Expense)

| Chip Label | Inserts into Input | Auto Category |
|-----------|-------------------|---------------|
| Makan | `makan ` | Makan |
| Belanja kebutuhan | `belanja kebutuhan ` | Belanja kebutuhan |
| Pulsa | `pulsa ` | Pulsa |
| Internet | `internet ` | Internet |

### ☕ Sekunder (Expense)

| Chip Label | Inserts into Input | Auto Category |
|-----------|-------------------|---------------|
| Kopi | `kopi ` | Kopi |
| Jajan | `jajan ` | Jajan |
| Hiburan | `hiburan ` | Hiburan |
| Subscription | `subscription ` | Subscription |

### 💸 Tagihan (Expense)

| Chip Label | Inserts into Input | Auto Category |
|-----------|-------------------|---------------|
| Listrik | `listrik ` | Listrik |
| Air | `air ` | Air |
| Internet rumah | `internet rumah ` | Internet rumah |

### 💼 Income

| Chip Label | Inserts into Input | Auto Category |
|-----------|-------------------|---------------|
| Gaji | `gaji ` | Gaji |
| Bonus | `bonus ` | Bonus |
| Freelance | `freelance ` | Freelance |

### ↔ Transfer

| Chip Label | Inserts into Input | Auto Category |
|-----------|-------------------|---------------|
| Transfer | `transfer ` | Transfer |

### 📈 Investasi

> [!NOTE]
> Investasi templates are shown tapi **disabled** di MVP karena investment transactions belum fully implemented. Chip tetap visible dengan `opacity-50` dan tooltip `"Segera hadir"` agar user tahu fitur ini akan datang.

| Chip Label | Status |
|-----------|--------|
| Top up RDPU | Disabled |
| Top up RDPT | Disabled |
| Beli emas | Disabled |
| Beli BTC | Disabled |

### Template-to-Input Behavior

Ketika user tap template chip:

1. Text diinsert ke input field (e.g., `"makan "`)
2. Input field auto-focus
3. Keyboard muncul
4. Cursor di akhir — user langsung ketik nominal
5. User kirim: `"makan 25k"` → parser processes

**Key insight**: Template chips bukan shortcut yang langsung menampilkan form. Mereka **pre-fill input text** sehingga flow tetap konsisten — selalu lewat parser → preview → save.

---

## 7. Chat Input Placeholder Copy

### Input Field Placeholder

**Default:**
```
Ketik transaksi, cth: "makan 25k"
```

**After template tap (contextual, optional polish):**
```
(After tapping Makan chip, input shows: "makan ")
Placeholder not visible because text already present
```

### Placeholder Behavior

- Placeholder visible only when input is empty
- Color: `text-muted` (same as other form placeholders)
- The example changes randomly on each visit (optional later phase):
  - `"makan 25k"`
  - `"kopi 18rb"`
  - `"gaji 4.7jt"`
  - `"bensin 50k"`

For MVP: static placeholder `Ketik transaksi, cth: "makan 25k"` is sufficient.

---

## 8. Assistant Response Copy After Parsing

### Successful Parse → Show Preview

Assistant does NOT reply with text when parsing succeeds. Instead, it directly shows the **preview card** (see section 10). This minimizes noise and keeps the flow fast.

The visual sequence is:

```
User bubble:     "makan 25k"
                      ↓
Preview card:    [Preview transaksi details]
                 [Edit]  [Simpan]
```

### Optional Confirmation Variants (after save)

Post-save, the assistant shows a brief confirmation message:

| Transaction Type | Confirmation Copy |
|-----------------|-------------------|
| Expense | `Oke, pengeluaran sudah dicatat ✓` |
| Income | `Oke, pemasukan sudah dicatat ✓` |
| Transfer | `Oke, transfer sudah dicatat ✓` |

**Design:**
- Left-aligned assistant bubble
- `bg-surface rounded-card px-4 py-3`
- `text-sm text-foreground`
- Check mark: `text-income` color (green)
- Subtle entry animation: fade-in + slide-up, 200ms

### After Confirmation

Chat is ready for next input. The confirmation stays in the chat log (in-memory only, not persisted). User can immediately type or tap a template for the next transaction.

---

## 9. Failed Parsing Copy

### When Parser Cannot Understand

```
┌──────────────────────────────────┐
│  💬 Assistant                    │
│                                  │
│  Hmm, aku belum paham            │
│  transaksi ini 🤔                │
│                                  │
│  Coba format seperti ini:        │
│  · makan 25k                    │
│  · gaji 4.7jt                   │
│  · transfer BCA ke GoPay 100rb  │
│                                  │
│  Atau pilih template di bawah.   │
│                                  │
│  [ Isi manual → ]                │
└──────────────────────────────────┘
```

**Design:**
- Same assistant bubble style as welcome message
- `🤔` emoji adds personality, not robotic error
- Examples remind user of correct format
- **"Isi manual →"** link → navigates to `/cashflow/new` as escape hatch
  - Style: `text-sm font-semibold text-accent-strong`
  - This is critical — user should never be stuck

### Specific Parse Failure Variants

| Situation | Assistant Response |
|----------|-------------------|
| No amount detected | `Sepertinya nominal belum ada. Coba tambahkan angka, contoh: "makan 25k"` |
| Amount only, no category | `Aku perlu tahu ini untuk apa. Coba tulis kategori + nominal, contoh: "kopi 18k"` |
| Unrecognized category | `Aku belum kenal kategori "{input}". Coba pilih template atau isi manual ya.` |
| Gibberish / too short | `Hmm, aku belum paham transaksi ini 🤔 Coba format seperti ini: ...` |
| Amount = 0 | `Nominal harus lebih dari 0 ya.` |
| Amount unreasonably large (>999T) | `Nominal terlalu besar. Coba periksa lagi ya.` |

### Tone Rules for Error Messages

- Never blame the user (`"Input salah"` ❌)
- Always suggest what to do next
- Always provide escape hatch to manual form
- Use friendly emoji sparingly (max 1 per message)

---

## 10. Transaction Preview Card Layout

### Preview Card Anatomy

```
┌──────────────────────────────────────┐
│  Preview Transaksi                   │
├──────────────────────────────────────┤
│                                      │
│  🔴 Pengeluaran                      │  ← type badge
│                                      │
│  Rp25.000                            │  ← amount, large
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Kategori    Makan               ││  ← detail rows
│  │ Akun        BCA · Rp2.500.000   ││
│  │ Tanggal     Hari ini             ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌────────────┐ ┌──────────────────┐ │
│  │   Batal    │ │  Simpan ✓       │ │  ← action buttons
│  └────────────┘ └──────────────────┘ │
└──────────────────────────────────────┘
```

### Detailed Specs

**Container:**
```
bg-surface rounded-card border border-border shadow-card
p-5
max-w-[85%] (same as chat bubbles)
margin-left: auto-aligned left (assistant side)
```

**Type Badge:**
```
inline-flex, rounded-full
px-2.5 py-1 text-[0.65rem] font-bold

Income:   bg-income/10 text-income   label: "Pemasukan"
Expense:  bg-expense/10 text-expense label: "Pengeluaran"
Transfer: bg-transfer/10 text-transfer label: "Transfer"
```

**Amount:**
```
text-2xl font-bold mt-2
Income:   text-income
Expense:  text-expense
Transfer: text-transfer
```

**Detail Rows:**
```
mt-4 space-y-0
rounded-control bg-surface-muted overflow-hidden

Each row:
  flex justify-between items-center
  px-4 py-3
  border-b border-border (except last)

  Label: text-xs text-muted
  Value: text-sm font-semibold text-foreground

  Tappable rows: hover:bg-background cursor-pointer
                 (for editable fields, see section 11)
```

**Preview Detail Fields:**

| Field | Label | Default Value | Editable? |
|-------|-------|---------------|-----------|
| Type | Tipe | Auto-detected | Yes (tap to change) |
| Amount | Nominal | Parsed from input | Yes (tap to edit) |
| Category | Kategori | Auto-matched | Yes (tap to change) |
| Account | Akun | User's default account | Yes (tap to change) |
| Date | Tanggal | Hari ini | Yes (tap to change) |
| Destination | Ke akun | (transfer only) | Yes (tap to change) |

**Action Buttons:**
```
grid grid-cols-2 gap-3 mt-4

Batal:
  min-h-12 rounded-control
  border border-border bg-surface
  text-sm font-bold text-muted
  active:scale-[0.98]

Simpan:
  min-h-12 rounded-control
  bg-accent text-accent-foreground
  text-sm font-bold
  active:scale-[0.96]
  disabled state: opacity-60, cursor-not-allowed
```

### Transfer Preview Variant

```
┌──────────────────────────────────────┐
│  Preview Transaksi                   │
├──────────────────────────────────────┤
│                                      │
│  🔵 Transfer                         │
│                                      │
│  Rp100.000                           │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Dari        BCA · Rp2.500.000   ││
│  │ Ke          GoPay · Rp150.000   ││
│  │ Tanggal     Hari ini             ││
│  └──────────────────────────────────┘│
│                                      │
│  [ Batal ] [ Simpan ✓ ]             │
└──────────────────────────────────────┘
```

---

## 11. Preview Edit Interaction

### Design Decision: Inline Edit, Not Separate Form

When user taps an editable field on the preview card, the row **expands inline** to show edit controls. This is faster than navigating to a separate form.

### Edit Flow

```
Step 1: User sees preview card
Step 2: User taps "Kategori: Makan" row
Step 3: Row expands to show category picker (dropdown)
Step 4: User selects new category
Step 5: Row collapses, preview updates
Step 6: User taps "Simpan"
```

### Field Edit Behaviors

**Nominal (tap to edit):**
```
Row transforms:
  ┌──────────────────────────────────┐
  │ Nominal                          │
  │ ┌──────────────────────────────┐ │
  │ │ Rp         25.000         ✓ │ │  ← inline input
  │ └──────────────────────────────┘ │
  └──────────────────────────────────┘

  Input: inputMode="numeric"
  Rp prefix label
  Confirm: ✓ button or Enter key
  Auto-select all text for easy replacement
```

**Kategori (tap to change):**
```
Row transforms:
  ┌──────────────────────────────────┐
  │ Kategori                         │
  │ ┌──────────────────────────────┐ │
  │ │ Makan                      ▾ │ │  ← native select
  │ └──────────────────────────────┘ │
  └──────────────────────────────────┘

  Uses native <select> for mobile friendliness
  Filtered by current transaction type
  Change triggers immediate preview update
```

**Akun (tap to change):**
```
Same pattern as Kategori:
  Native <select>
  Shows: account name + current balance
  Filter: active accounts only
```

**Tanggal (tap to change):**
```
Row transforms:
  ┌──────────────────────────────────┐
  │ Tanggal                          │
  │ ┌──────────────────────────────┐ │
  │ │ 2026-06-07                   │ │  ← native date input
  │ └──────────────────────────────┘ │
  └──────────────────────────────────┘

  Uses native <input type="date">
  Default: today (Jakarta timezone)
```

**Tipe (tap to change):**
```
Row transforms:
  ┌───────────────────────────────────────┐
  │ Tipe                                  │
  │ [Pemasukan] [Pengeluaran] [Transfer]  │  ← segmented control
  └───────────────────────────────────────┘

  Changing type:
    → resets category to first match for new type
    → shows/hides "Ke akun" field for transfer
    → updates badge color and amount color
```

### Edit Visual Indicator

Editable rows have a subtle right-arrow icon (chevron) to hint tappability:

```
│ Kategori    Makan                ›  │
```

Active/editing row: `bg-accent-soft/50` highlight

---

## 12. Save/Cancel Button Copy

### Button Labels

| Button | Copy | State |
|--------|------|-------|
| Save (default) | `Simpan ✓` | Primary accent |
| Save (submitting) | `Menyimpan...` | Disabled, loading |
| Cancel | `Batal` | Secondary ghost |

### Post-Save Behavior

1. Preview card **collapses** with fade-out animation (200ms)
2. Assistant confirmation bubble appears: `"Oke, pengeluaran sudah dicatat ✓"`
3. Input field clears and auto-focuses → ready for next input
4. Template chips remain visible
5. Dashboard and Cashflow pages are **revalidated** (via `revalidatePath`)

### Cancel Behavior

1. Preview card **collapses** with fade-out (200ms)
2. No assistant message (silent cancel)
3. User's original text message stays in chat log (grayed out, `text-muted line-through`)
4. Input field clears and auto-focuses

### Cancel Copy — Intentionally Minimal

Cancel does NOT show a confirmation dialog. One tap = cancel. Alasannya:
- Belum ada data yang tersimpan (preview belum di-save)
- Menampilkan dialog "Yakin batal?" mengalahkan tujuan kecepatan
- User bisa selalu ketik ulang

---

## 13. Loading State

### Parser Processing (< 100ms typical)

```
┌──────────────────────────────────┐
│  User bubble: "makan 25k"       │
│                                  │
│  ┌──────────────────────┐        │
│  │  ● ● ●               │       │  ← typing indicator
│  └──────────────────────┘        │
└──────────────────────────────────┘
```

**Typing indicator:**
- Three dots animation (bouncing), `bg-surface rounded-card px-4 py-3`
- Duration: artificial delay of 300-500ms even if parser is instant
- Why the delay? Instant responses feel buggy. A brief "thinking" moment makes the assistant feel natural.
- Dots: `size-2 rounded-full bg-muted animate-bounce` with stagger

### Save Processing

```
Save button:
  "Menyimpan..." — disabled state
  Optional: subtle pulse animation on button

Preview card: stays visible but actions disabled
  Both buttons: opacity-60, pointer-events-none
```

### Initial Page Load

Chat page is a **Client Component** (not Server Component like Dashboard). Alasannya:
- Chat requires stateful interaction (message list, input state)
- But data (accounts, categories) needs to be fetched on mount

```
Loading state:
  Header: visible immediately (static)
  Chat area: skeleton welcome message (pulse)
  Template chips: skeleton pills (pulse)
  Input bar: visible but disabled until data loads

Skeleton:
  Welcome bubble: bg-surface-muted animate-pulse rounded-card h-[160px] w-[85%]
  Chip row: 4 skeleton pills, h-8 w-20 rounded-full bg-surface-muted animate-pulse
```

---

## 14. Error State

### Save Failed

```
┌──────────────────────────────────┐
│  💬 Assistant                    │
│                                  │
│  Transaksi belum berhasil        │
│  disimpan. Coba klik Simpan      │
│  lagi ya.                        │
│                                  │
│  [ Coba Simpan Lagi ]            │
└──────────────────────────────────┘
```

**Behavior:**
- Preview card stays visible (user doesn't lose their data)
- Error message appears below preview card
- "Coba Simpan Lagi" button retries the save action
- After 3 failures: show `"Coba isi manual ya."` with link to `/cashflow/new` (prefilled if possible)

### Data Load Failed (accounts/categories)

```
┌──────────────────────────────────┐
│  Chat                            │
│  Catat transaksi dengan cepat    │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────────┐│
│  │  ⚠️                          ││
│  │                              ││
│  │  Data belum bisa dimuat      ││
│  │  Coba refresh halaman ini.   ││
│  │                              ││
│  │  [ ↻ Refresh ]              ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

- Input bar disabled
- Template chips hidden
- Same error card pattern as Dashboard (`DashboardError`)

### RPC Migration Not Applied

```
"Migration manual cashflow belum diterapkan di Supabase."
```

Reuse `rpcErrorMessage()` from existing cashflow actions.

---

## 15. What to Implement Now

### Priority 1: Chat Parser Engine

1. **`src/lib/chat/parser.ts`** — Rule-based parser
   - Input: raw text string + available categories + available accounts
   - Output: `ParseResult` (success with parsed fields, or failure with reason)
   - Amount parsing: reuse patterns from PRD (`25k`, `25rb`, `1jt`, `1.5jt`, `4,7jt`, `25.000`, `25000`)
   - Category matching: case-insensitive, fuzzy substring against user's categories
   - Account matching: case-insensitive name match (e.g., `"dari BCA"` → BCA account)
   - Date keyword parsing: `hari ini`, `kemarin` → date string
   - Transfer detection: keywords `transfer`, `dari...ke...`

2. **`src/lib/chat/types.ts`** — Type definitions
   ```
   ParseResult = ParseSuccess | ParseFailure
   ParseSuccess: { type, amount, categoryId, accountId, transferToAccountId?, date, confidence }
   ParseFailure: { reason: string, suggestions: string[] }
   ```

### Priority 2: Chat Page (Client Component)

3. **`src/app/(app)/chat/page.tsx`** — Server component wrapper
   - Fetches accounts + categories (reuse `getCashflowFormOptions`)
   - Passes data to client component

4. **`src/components/chat/chat-view.tsx`** — Main client component
   - Manages message state (in-memory array)
   - Handles input, parsing, preview, save flow
   - Uses `useActionState` for save (reuse existing `createTransaction` action or new `saveChatTransaction` action)

### Priority 3: Chat UI Components

5. **`src/components/chat/message-bubble.tsx`** — User and assistant message bubbles
6. **`src/components/chat/template-chips.tsx`** — Template group tabs + individual chips
7. **`src/components/chat/chat-input-bar.tsx`** — Docked input bar with send button
8. **`src/components/chat/transaction-preview.tsx`** — Preview card with inline editing
9. **`src/components/chat/typing-indicator.tsx`** — Three-dot bounce animation

### Priority 4: Integration

10. **Save action**: Create `src/app/(app)/chat/actions.ts`
    - Reuse `create_manual_transaction` RPC (same as cashflow)
    - Set `source: 'chat'` instead of `'manual'` for tracking
    - Revalidate `/cashflow` and `/dashboard` after save

11. **Template data**: Create `src/constants/chat-templates.ts`
    - Template groups with labels, icons, and chip definitions
    - Maps chips to category names for auto-matching

### Priority 5: Layout Adjustment

12. **Chat-specific layout**: The chat page needs the input bar docked above bottom nav, not inside the regular `<main>` scroll area. Options:
    - Override padding in chat page with negative margin
    - Or create a `ChatShell` wrapper that restructures the flex layout
    - **Recommended**: Chat page uses a `ChatLayout` component that manages its own scroll + fixed input positioning within the existing `AppShell` container

---

## 16. What to Postpone

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| AI parser (LLM-based) | Requires API cost, latency, complexity | Chat v2 |
| Multi-turn conversation | MVP is single-shot parse-preview-save | Chat v2 |
| Chat history persistence | No value for MVP — chat is a tool, not a log | Chat v2 |
| Investment transaction templates | `investment_buy`/`investment_sell` not implemented yet | Portfolio phase |
| OCR receipt scanning | Complex, needs camera + OCR lib | Later phase |
| Voice input | Needs speech-to-text API | Later phase |
| Recurring transaction from chat | "setiap bulan gaji 4.7jt" — needs recurring system | Later phase |
| Smart account suggestion | "kopi biasanya dari GoPay" — needs usage history | Chat v2 |
| Undo after save | "Batal yang tadi" — needs undo system | Chat v2 |
| Merchant extraction | "makan di warteg 25k" → merchant: warteg | Chat v2 |
| Date parsing beyond keywords | "tanggal 3", "minggu lalu" | Chat v2 |
| Category learning | Learn user's custom categories from typing patterns | Chat v2 |
| Chat animation polish | Smooth bubble entry animations, scroll animations | Polish phase |

---

## 17. Edge Cases the Parser Should Handle

### Amount Parsing

| # | Input | Expected Parse | Notes |
|---|-------|---------------|-------|
| 1 | `makan 25000` | Rp25.000 | Plain number |
| 2 | `makan 25.000` | Rp25.000 | Dot as thousands separator |
| 3 | `makan 25k` | Rp25.000 | k = ribu |
| 4 | `makan 25rb` | Rp25.000 | rb = ribu |
| 5 | `makan 25ribu` | Rp25.000 | ribu = ribu |
| 6 | `makan 1jt` | Rp1.000.000 | jt = juta |
| 7 | `makan 1juta` | Rp1.000.000 | juta = juta |
| 8 | `makan 1.5jt` | Rp1.500.000 | decimal juta |
| 9 | `makan 4,7jt` | Rp4.700.000 | comma decimal juta |
| 10 | `makan 150` | Rp150 | Small number — valid (e.g., parking) |
| 11 | `makan 0` | ❌ Error | Zero not valid |
| 12 | `makan -25k` | ❌ Error | Negative not valid |
| 13 | `makan 999999999999999` | ❌ Error | Exceeds max |

### Category & Account Matching

| # | Input | Expected Behavior |
|---|-------|-------------------|
| 14 | `MAKAN 25k` | → Makan (case insensitive) |
| 15 | `Makan 25k dari bca` | → Makan, account: BCA |
| 16 | `gaji 4.7jt masuk BCA` | → Gaji (income), account: BCA |
| 17 | `transfer dari BCA ke GoPay 100rb` | → Transfer, BCA → GoPay, Rp100.000 |
| 18 | `transfer BCA GoPay 100rb` | → Transfer, BCA → GoPay (smart parse, no "dari/ke") |
| 19 | `kopi 18k gopay` | → Kopi, account: GoPay |
| 20 | `bensinnn 50k` | ❌ or fuzzy match → Bensin (typo tolerance) |
| 21 | `xyz 25k` | ❌ Unknown category |

### Transfer Parsing

| # | Input | Expected Parse |
|---|-------|---------------|
| 22 | `transfer dari BCA ke GoPay 100rb` | ✅ Full format |
| 23 | `transfer BCA ke GoPay 100rb` | ✅ Without "dari" |
| 24 | `transfer 100rb dari BCA ke GoPay` | ✅ Amount before accounts |
| 25 | `isi GoPay dari BCA 100rb` | ✅ "isi" = transfer |
| 26 | `transfer BCA ke BCA 100rb` | ❌ Same source and destination |
| 27 | `transfer GoPay 100rb` | ⚠️ Missing destination — partial parse, ask in preview |

### Date Keywords

| # | Input | Expected Date |
|---|-------|--------------|
| 28 | `makan 25k hari ini` | Today |
| 29 | `makan 25k kemarin` | Yesterday |
| 30 | `makan 25k` (no date) | Default: today |

### Whitespace & Formatting

| # | Input | Expected |
|---|-------|----------|
| 31 | `  makan   25k  ` | Trim + normalize whitespace → valid |
| 32 | `makan25k` | Split at number boundary → valid |
| 33 | ` ` (empty) | No parse — ignore |
| 34 | `25k` | Amount only → ❌ missing category |
| 35 | `makan` | Category only → ❌ missing amount |

---

## 18. UX Rules to Make Rule-Based Parsing Feel Smart

### Rule 1: Default to the Obvious

When parser is uncertain about type, use these defaults:

```
Category from expense group → type: expense
Category from income group  → type: income
Keyword "transfer"/"isi"    → type: transfer
No match                    → type: expense (most common action)
```

### Rule 2: Default Account is the First Account

If no account is mentioned in the input, use the user's **first account** (by creation order). Most users have one primary bank account.

### Rule 3: Default Date is Today

If no date keyword is mentioned, always default to today. This is correct 90%+ of the time.

### Rule 4: Show Confidence Through Completeness

A fully parsed preview (all fields filled) feels "smart" even though the parser just matched keywords. The key is: **never show an empty field**. Always have a default for everything.

### Rule 5: Category Matching is Substring, Not Exact

```
"makan" → matches category "Makan" ✓
"belanja" → matches "Belanja kebutuhan" ✓
"listrik" → matches "Listrik" ✓
"ojek" → matches "Ojek online" ✓
```

Use lowercased `startsWith` first, then `includes` as fallback.

### Rule 6: Account Matching is Name-Based

```
"BCA" → matches account named "BCA" ✓
"gopay" → matches account named "GoPay" ✓ (case insensitive)
"jago" → matches account named "Jago" ✓
```

Match against `account.name.toLowerCase()`.

### Rule 7: Amount Keywords are Greedy

Parse amount suffixes generously:

```
k, rb, ribu    → × 1.000
jt, juta       → × 1.000.000
m, miliar      → × 1.000.000.000 (unlikely but safe)
```

### Rule 8: "dari" and "ke" are Transfer Signals

If the input contains `dari [account]` or `ke [account]`, it's a transfer signal. Combine with `transfer` keyword for confidence.

```
"transfer dari BCA ke GoPay 100rb"
→ type: transfer, from: BCA, to: GoPay

"kopi 18k dari GoPay"
→ type: expense, from: GoPay (NOT transfer — no "ke")
```

### Rule 9: Don't Guess — Show Preview

When parser is 60-80% confident (e.g., found amount and possible category but not sure about account), **still show preview** with best guesses filled in. Let the user correct. This feels smarter than saying "I don't understand."

```
Threshold:
  Amount found + category found → show preview (user corrects account)
  Amount found + no category → ❌ error (need at least category context)
  No amount found → ❌ error (amount is non-negotiable)
```

### Rule 10: Income Keywords are Explicit

Only classify as income if the category unambiguously belongs to the income group. Expense is the safe default.

```
"gaji 4.7jt"     → income ✓ (gaji is income category)
"freelance 800k"  → income ✓
"bonus 1jt"       → income ✓
"makan 25k"       → expense ✓ (makan is expense category)
"kopi 18k"        → expense ✓
```

### Rule 11: Recognize "masuk" as Account Hint for Income

```
"gaji 4.7jt masuk BCA"
→ type: income, account: BCA

"freelance 800k masuk Jago"
→ type: income, account: Jago
```

`masuk` = the account where money goes in.

### Rule 12: Be Fast — Parse Synchronously

The parser runs client-side, purely in JavaScript. No API calls. No network latency. Even with the artificial 300-500ms "thinking" delay, the total time from send to preview should be under 1 second.

---

## Appendix A: Message Type Design Reference

### User Bubble

```
max-w-[85%] ml-auto (right-aligned)
bg-accent text-accent-foreground
rounded-card rounded-br-lg (tail on bottom-right)
px-4 py-3
text-sm
```

### Assistant Bubble

```
max-w-[85%] mr-auto (left-aligned)
bg-surface text-foreground
border border-border
rounded-card rounded-bl-lg (tail on bottom-left)
px-4 py-3
text-sm
```

### System Message (optional, for confirmations)

```
text-center
text-xs text-muted
py-2
No bubble — just floating text
Example: "7 Juni 2026, 12:05"
```

---

## Appendix B: Component File Structure

```
src/
├── app/(app)/chat/
│   ├── page.tsx              ← Server wrapper (fetches data)
│   └── actions.ts            ← Save transaction server action
├── components/chat/
│   ├── chat-view.tsx         ← Main client component (state manager)
│   ├── message-bubble.tsx    ← User + assistant bubble styles
│   ├── template-chips.tsx    ← Group tabs + chip row
│   ├── chat-input-bar.tsx    ← Input field + send button
│   ├── transaction-preview.tsx ← Preview card + inline editing
│   └── typing-indicator.tsx  ← Three-dot loading animation
├── lib/chat/
│   ├── parser.ts             ← Rule-based text parser
│   └── types.ts              ← ParseResult, ChatMessage types
└── constants/
    └── chat-templates.ts     ← Template groups + chip definitions
```

---

## Appendix C: State Machine

```
            ┌──────────┐
            │  IDLE     │ ← welcome message / ready for input
            └────┬─────┘
                 │ user sends text or taps template
                 ▼
            ┌──────────┐
            │ PARSING   │ ← 300-500ms thinking indicator
            └────┬─────┘
           ╱            ╲
    success              failure
         ╱                    ╲
    ┌──────────┐       ┌──────────┐
    │ PREVIEW   │      │  ERROR    │ ← error message shown
    └────┬─────┘       └────┬─────┘
    ╱         ╲              │ user types again
  save      cancel           └──→ IDLE
   ╱             ╲
┌──────────┐  ┌──────────┐
│ SAVING    │  │  IDLE     │ ← cancelled, ready again
└────┬─────┘  └──────────┘
   ╱      ╲
success   failure
  ╱            ╲
┌──────────┐  ┌──────────┐
│ SUCCESS   │  │SAVE_ERROR │ ← retry option shown
└────┬─────┘  └──────────┘
     │
     └──→ IDLE (confirmation shown, ready for next)
```
