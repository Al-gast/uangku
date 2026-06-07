# UangKu

Mobile-first personal finance PWA foundation built with Next.js, TypeScript,
Tailwind CSS, Supabase, and pnpm.

## Local development

Install dependencies:

```bash
pnpm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Fill these values from the Supabase project dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
COINGECKO_API_KEY=your-optional-demo-api-key
```

The frontend must only use the anon or publishable key. Never add a Supabase
service-role or secret key to a `NEXT_PUBLIC_` variable.

`COINGECKO_API_KEY` is optional and used only on the server for manual BTC/ETH
price refresh. Keyless public access remains available. Never expose this key
through a `NEXT_PUBLIC_` variable.

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup

Database migrations are stored at:

```text
supabase/migrations/202606060001_initial_schema.sql
supabase/migrations/202606060002_onboarding.sql
supabase/migrations/202606070001_manual_cashflow.sql
supabase/migrations/202606070002_budget_mvp.sql
```

The Supabase CLI is not required. To apply it manually:

1. Create or open a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste and run each migration in filename order.
4. Run `202606060002_onboarding.sql` after the initial schema.
5. Run `202606070001_manual_cashflow.sql` for transaction CRUD and atomic
   account balance updates.
6. Run `202606070002_budget_mvp.sql` to prepare minimal expense categories for
   Budget MVP.
7. Confirm all tables show RLS as enabled in **Table Editor**.

If the repo is linked with the Supabase CLI later, apply migrations with:

```bash
supabase db push
```

## Authentication

The current auth foundation supports:

- Email/password signup
- Email/password login
- Email confirmation callback
- Cookie-backed SSR sessions
- Protected app routes
- Logout from Settings

If email confirmation is enabled, add the local and deployed callback URLs to
the Supabase Auth redirect allow list:

```text
http://localhost:3000/auth/callback
https://your-domain.example/auth/callback
```

## Onboarding

Authenticated users with incomplete onboarding are redirected to
`/onboarding`. The three-step wizard supports:

- Multiple cash, bank, e-wallet, investment, asset, or liability accounts
- Initial balances written to both account balance columns
- Optional monthly budgets
- Minimal category creation only for selected onboarding budgets
- Complete or skip status persisted in `user_settings`

Account, category, budget, and completion writes run atomically through an
authenticated Postgres function. The browser never supplies `user_id`.

## Current scope

This phase includes authentication, schema/RLS, and onboarding for initial
accounts, balances, and optional budgets.

Manual cashflow, Dashboard cashflow summary, monthly budget CRUD, budget
progress, and Dashboard budget warnings are available. Portfolio behavior,
chat parsing, OCR, export, PWA enhancements, and advanced analytics remain
intentionally deferred.
