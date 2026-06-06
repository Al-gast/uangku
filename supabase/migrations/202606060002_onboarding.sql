-- UangKu Phase 3: onboarding status and atomic onboarding writes.

alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

create or replace function public.complete_onboarding(
  p_accounts jsonb,
  p_budgets jsonb default '[]'::jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account jsonb;
  v_budget jsonb;
  v_name text;
  v_type text;
  v_balance numeric(18, 2);
  v_category_name text;
  v_category_group text;
  v_category_id uuid;
  v_budget_amount numeric(18, 2);
  v_onboarding_completed boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(coalesce(p_accounts, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_accounts, '[]'::jsonb)) = 0 then
    raise exception 'At least one account is required';
  end if;

  if jsonb_array_length(p_accounts) > 20 then
    raise exception 'A maximum of 20 accounts is allowed';
  end if;

  if jsonb_typeof(coalesce(p_budgets, '[]'::jsonb)) <> 'array' then
    raise exception 'Budgets must be an array';
  end if;

  if jsonb_array_length(coalesce(p_budgets, '[]'::jsonb)) > 6 then
    raise exception 'A maximum of 6 onboarding budgets is allowed';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_budgets, '[]'::jsonb)) as budget
    group by budget ->> 'category'
    having count(*) > 1
  ) then
    raise exception 'Duplicate onboarding budget categories are not allowed';
  end if;

  insert into public.user_settings (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select onboarding_completed
  into v_onboarding_completed
  from public.user_settings
  where user_id = v_user_id
  for update;

  if v_onboarding_completed then
    return;
  end if;

  for v_account in
    select value from jsonb_array_elements(p_accounts)
  loop
    v_name := trim(v_account ->> 'name');
    v_type := v_account ->> 'type';
    v_balance := coalesce(nullif(v_account ->> 'initial_balance', '')::numeric, 0);

    if v_name is null or v_name = '' or char_length(v_name) > 100 then
      raise exception 'Account name is required';
    end if;

    if v_type is null or v_type not in (
      'cash',
      'bank_account',
      'e_wallet',
      'investment_account',
      'asset_account',
      'liability'
    ) then
      raise exception 'Invalid account type';
    end if;

    insert into public.accounts (
      user_id,
      name,
      type,
      initial_balance,
      current_balance
    )
    values (
      v_user_id,
      v_name,
      v_type,
      v_balance,
      v_balance
    );
  end loop;

  for v_budget in
    select value from jsonb_array_elements(coalesce(p_budgets, '[]'::jsonb))
  loop
    v_category_name := v_budget ->> 'category';
    v_budget_amount := nullif(v_budget ->> 'amount', '')::numeric;

    v_category_group := case v_category_name
      when 'Makan' then 'primer'
      when 'Transport' then 'transport'
      when 'Lifestyle' then 'lifestyle'
      when 'Tagihan' then 'tagihan'
      when 'Kesehatan' then 'kesehatan'
      when 'Pendidikan' then 'pendidikan'
      else null
    end;

    if v_category_group is null then
      raise exception 'Invalid onboarding budget category';
    end if;

    if v_budget_amount is null or v_budget_amount <= 0 then
      raise exception 'Budget amount must be greater than zero';
    end if;

    insert into public.categories (
      user_id,
      name,
      "group",
      transaction_type,
      is_default,
      is_active
    )
    values (
      v_user_id,
      v_category_name,
      v_category_group,
      'expense',
      true,
      true
    )
    on conflict (user_id, name, transaction_type)
    do update set
      "group" = excluded."group",
      is_active = true
    returning id into v_category_id;

    insert into public.budgets (
      user_id,
      category_id,
      period,
      amount,
      start_date,
      is_active
    )
    values (
      v_user_id,
      v_category_id,
      'monthly',
      v_budget_amount,
      date_trunc('month', current_date)::date,
      true
    );
  end loop;

  insert into public.user_settings (
    user_id,
    onboarding_completed,
    onboarding_completed_at
  )
  values (
    v_user_id,
    true,
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    onboarding_completed = true,
    onboarding_completed_at = excluded.onboarding_completed_at;
end;
$$;

create or replace function public.skip_onboarding()
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_settings (
    user_id,
    onboarding_completed,
    onboarding_completed_at
  )
  values (
    v_user_id,
    true,
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    onboarding_completed = true,
    onboarding_completed_at = excluded.onboarding_completed_at;
end;
$$;

revoke all on function public.complete_onboarding(jsonb, jsonb) from public;
revoke all on function public.skip_onboarding() from public;
grant execute on function public.complete_onboarding(jsonb, jsonb)
  to authenticated;
grant execute on function public.skip_onboarding()
  to authenticated;
