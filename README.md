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
```

The frontend must only use the anon or publishable key. Never add a Supabase
service-role or secret key to a `NEXT_PUBLIC_` variable.

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup

The initial schema is stored at:

```text
supabase/migrations/202606060001_initial_schema.sql
```

The Supabase CLI is not required. To apply it manually:

1. Create or open a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste the migration contents into a new query.
4. Run the query once.
5. Confirm all tables show RLS as enabled in **Table Editor**.

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

## Current scope

This phase includes authentication, Supabase client configuration, database
schema, RLS policies, entity types, and default category constants.

Transaction CRUD, calculations, budget behavior, portfolio behavior, chat
parsing, OCR, export, and PWA enhancements remain intentionally deferred.
