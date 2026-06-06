-- UangKu MVP database foundation.
-- Apply with the Supabase SQL Editor or `supabase db push`.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (
    type in (
      'cash',
      'bank_account',
      'e_wallet',
      'investment_account',
      'asset_account',
      'liability'
    )
  ),
  initial_balance numeric(18, 2) not null default 0,
  current_balance numeric(18, 2) not null default 0,
  currency text not null default 'IDR' check (currency = 'IDR'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  "group" text not null check (
    "group" in (
      'primer',
      'sekunder',
      'lifestyle',
      'transport',
      'tagihan',
      'kesehatan',
      'pendidikan',
      'investasi',
      'transfer',
      'income',
      'debt',
      'other'
    )
  ),
  transaction_type text not null check (
    transaction_type in ('income', 'expense', 'transfer', 'investment', 'debt')
  ),
  icon text,
  color text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name, transaction_type),
  unique (id, user_id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid,
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (
    type in (
      'cash',
      'rdpu',
      'rdpt',
      'gold',
      'crypto',
      'stock',
      'other_asset',
      'liability'
    )
  ),
  platform text,
  currency text not null default 'IDR' check (currency = 'IDR'),
  quantity numeric(24, 8) check (quantity is null or quantity >= 0),
  unit text,
  total_cost numeric(18, 2) check (total_cost is null or total_cost >= 0),
  current_value numeric(18, 2) not null default 0 check (current_value >= 0),
  auto_price_enabled boolean not null default false,
  last_price numeric(24, 8) check (last_price is null or last_price >= 0),
  last_price_updated_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (account_id, user_id)
    references public.accounts(id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'income',
      'expense',
      'transfer',
      'investment_buy',
      'investment_sell',
      'asset_update',
      'debt'
    )
  ),
  amount numeric(18, 2) not null check (amount > 0),
  category_id uuid not null,
  account_id uuid not null,
  transfer_to_account_id uuid,
  asset_id uuid,
  transaction_date timestamptz not null default timezone('utc', now()),
  merchant text,
  notes text,
  tags text[] not null default '{}',
  source text not null default 'manual' check (
    source in ('manual', 'chat', 'ocr', 'email')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (category_id, user_id)
    references public.categories(id, user_id),
  foreign key (account_id, user_id)
    references public.accounts(id, user_id),
  foreign key (transfer_to_account_id, user_id)
    references public.accounts(id, user_id),
  foreign key (asset_id, user_id)
    references public.assets(id, user_id),
  check (
    (type = 'transfer' and transfer_to_account_id is not null)
    or type <> 'transfer'
  ),
  check (
    transfer_to_account_id is null
    or transfer_to_account_id <> account_id
  )
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  period text not null check (period in ('weekly', 'monthly')),
  amount numeric(18, 2) not null check (amount > 0),
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (category_id, user_id)
    references public.categories(id, user_id),
  check (end_date is null or end_date >= start_date)
);

create table public.asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null,
  value numeric(18, 2) not null check (value >= 0),
  quantity numeric(24, 8) check (quantity is null or quantity >= 0),
  price numeric(24, 8) check (price is null or price >= 0),
  snapshot_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (asset_id, snapshot_date),
  foreign key (asset_id, user_id)
    references public.assets(id, user_id) on delete cascade
);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  amount numeric(18, 2) not null check (amount >= 0),
  remaining_amount numeric(18, 2) not null check (remaining_amount >= 0),
  due_date date,
  reminder_enabled boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  check (remaining_amount <= amount)
);

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme_mode text not null default 'system' check (
    theme_mode in ('light', 'dark', 'system')
  ),
  accent_theme text not null default 'emerald' check (
    accent_theme in ('emerald', 'blue', 'purple', 'orange', 'mono')
  ),
  privacy_mode_enabled boolean not null default false,
  pin_lock_enabled boolean not null default false,
  pin_lock_behavior text not null default 'on_app_open' check (
    pin_lock_behavior in (
      'on_app_open',
      'after_5_minutes',
      'sensitive_pages_only',
      'disabled'
    )
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null,
  storage_path text not null check (char_length(trim(storage_path)) > 0),
  file_name text not null check (char_length(trim(file_name)) > 0),
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (transaction_id, user_id)
    references public.transactions(id, user_id) on delete cascade
);

create index accounts_user_id_idx on public.accounts(user_id);
create index categories_user_id_idx on public.categories(user_id);
create index transactions_user_date_idx
  on public.transactions(user_id, transaction_date desc);
create index budgets_user_id_idx on public.budgets(user_id);
create index assets_user_id_idx on public.assets(user_id);
create index asset_snapshots_user_date_idx
  on public.asset_snapshots(user_id, snapshot_date desc);
create index liabilities_user_id_idx on public.liabilities(user_id);
create index transaction_attachments_user_id_idx
  on public.transaction_attachments(user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create trigger liabilities_set_updated_at
before update on public.liabilities
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.assets enable row level security;
alter table public.asset_snapshots enable row level security;
alter table public.liabilities enable row level security;
alter table public.user_settings enable row level security;
alter table public.transaction_attachments enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy accounts_select_own on public.accounts
for select to authenticated
using ((select auth.uid()) = user_id);
create policy accounts_insert_own on public.accounts
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy accounts_update_own on public.accounts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy accounts_delete_own on public.accounts
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy categories_select_own on public.categories
for select to authenticated
using ((select auth.uid()) = user_id);
create policy categories_insert_own on public.categories
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy categories_update_own on public.categories
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy categories_delete_own on public.categories
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy transactions_select_own on public.transactions
for select to authenticated
using ((select auth.uid()) = user_id);
create policy transactions_insert_own on public.transactions
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy transactions_update_own on public.transactions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy transactions_delete_own on public.transactions
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy budgets_select_own on public.budgets
for select to authenticated
using ((select auth.uid()) = user_id);
create policy budgets_insert_own on public.budgets
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy budgets_update_own on public.budgets
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy budgets_delete_own on public.budgets
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy assets_select_own on public.assets
for select to authenticated
using ((select auth.uid()) = user_id);
create policy assets_insert_own on public.assets
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy assets_update_own on public.assets
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy assets_delete_own on public.assets
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy asset_snapshots_select_own on public.asset_snapshots
for select to authenticated
using ((select auth.uid()) = user_id);
create policy asset_snapshots_insert_own on public.asset_snapshots
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy asset_snapshots_update_own on public.asset_snapshots
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy asset_snapshots_delete_own on public.asset_snapshots
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy liabilities_select_own on public.liabilities
for select to authenticated
using ((select auth.uid()) = user_id);
create policy liabilities_insert_own on public.liabilities
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy liabilities_update_own on public.liabilities
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy liabilities_delete_own on public.liabilities
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy user_settings_select_own on public.user_settings
for select to authenticated
using ((select auth.uid()) = user_id);
create policy user_settings_insert_own on public.user_settings
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy user_settings_update_own on public.user_settings
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy user_settings_delete_own on public.user_settings
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy transaction_attachments_select_own
on public.transaction_attachments
for select to authenticated
using ((select auth.uid()) = user_id);
create policy transaction_attachments_insert_own
on public.transaction_attachments
for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy transaction_attachments_update_own
on public.transaction_attachments
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy transaction_attachments_delete_own
on public.transaction_attachments
for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.assets to authenticated;
grant select, insert, update, delete on public.asset_snapshots to authenticated;
grant select, insert, update, delete on public.liabilities to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete
  on public.transaction_attachments to authenticated;

revoke all on public.profiles from anon;
revoke all on public.accounts from anon;
revoke all on public.categories from anon;
revoke all on public.transactions from anon;
revoke all on public.budgets from anon;
revoke all on public.assets from anon;
revoke all on public.asset_snapshots from anon;
revoke all on public.liabilities from anon;
revoke all on public.user_settings from anon;
revoke all on public.transaction_attachments from anon;
