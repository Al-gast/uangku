-- UangKu Phase 28: manual debt payment transactions.

alter table public.transactions
  add column if not exists liability_id uuid;

alter table public.transactions
  drop constraint if exists transactions_type_check,
  add constraint transactions_type_check check (
    type in (
      'income',
      'expense',
      'transfer',
      'investment_buy',
      'investment_sell',
      'asset_update',
      'debt',
      'debt_payment'
    )
  ),
  drop constraint if exists transactions_liability_id_user_id_fkey,
  add constraint transactions_liability_id_user_id_fkey
    foreign key (liability_id, user_id)
    references public.liabilities(id, user_id),
  drop constraint if exists transactions_debt_payment_liability_check,
  add constraint transactions_debt_payment_liability_check check (
    (
      type = 'debt_payment'
      and liability_id is not null
      and transfer_to_account_id is null
      and asset_id is null
    )
    or (
      type <> 'debt_payment'
      and liability_id is null
    )
  ),
  drop constraint if exists transactions_admin_fee_fields_check,
  add constraint transactions_admin_fee_fields_check check (
    (
      admin_fee_amount = 0
      and admin_fee_category_id is null
    )
    or (
      admin_fee_amount > 0
      and type in (
        'transfer',
        'investment_buy',
        'investment_sell',
        'debt_payment'
      )
      and admin_fee_category_id is not null
    )
  );

create index if not exists transactions_liability_id_idx
  on public.transactions(user_id, liability_id, transaction_date)
  where liability_id is not null;

drop function if exists public.create_manual_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric
);
drop function if exists public.update_manual_transaction_with_fee(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric
);
drop function if exists public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
);
drop function if exists public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
);

create or replace function public.ensure_manual_cashflow_categories()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.categories (
    user_id,
    name,
    "group",
    transaction_type,
    is_default,
    is_active
  )
  values
    (v_user_id, 'Gaji', 'income', 'income', true, true),
    (v_user_id, 'Bonus', 'income', 'income', true, true),
    (v_user_id, 'Freelance', 'income', 'income', true, true),
    (v_user_id, 'Makan', 'primer', 'expense', true, true),
    (v_user_id, 'Transport', 'transport', 'expense', true, true),
    (v_user_id, 'Tagihan', 'tagihan', 'expense', true, true),
    (v_user_id, 'Lifestyle', 'lifestyle', 'expense', true, true),
    (v_user_id, 'Transfer', 'transfer', 'transfer', true, true),
    (v_user_id, 'RDPU', 'investasi', 'investment', true, true),
    (v_user_id, 'RDPT', 'investasi', 'investment', true, true),
    (v_user_id, 'Emas', 'investasi', 'investment', true, true),
    (v_user_id, 'Crypto', 'investasi', 'investment', true, true),
    (v_user_id, 'Saham', 'investasi', 'investment', true, true),
    (v_user_id, 'Hutang', 'debt', 'debt', true, true)
  on conflict (user_id, name, transaction_type)
  do update set
    is_active = true;
end;
$$;

create or replace function public.apply_debt_payment_effect(
  p_user_id uuid,
  p_amount numeric,
  p_account_id uuid,
  p_liability_id uuid,
  p_direction integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining_amount numeric(18, 2);
begin
  if p_direction not in (-1, 1) then
    raise exception 'Debt payment direction must be -1 or 1';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  update public.accounts
  set current_balance = current_balance - (p_amount * p_direction)
  where id = p_account_id
    and user_id = p_user_id;

  if not found then
    raise exception 'Debt payment account not found';
  end if;

  update public.liabilities
  set remaining_amount = remaining_amount - (p_amount * p_direction)
  where id = p_liability_id
    and user_id = p_user_id
  returning remaining_amount into v_remaining_amount;

  if v_remaining_amount is null then
    raise exception 'Liability not found';
  end if;

  if v_remaining_amount < 0 then
    raise exception 'Liability remaining cannot be negative';
  end if;
end;
$$;

create or replace function public.apply_transaction_admin_fee_effect(
  p_user_id uuid,
  p_type text,
  p_admin_fee_amount numeric,
  p_account_id uuid,
  p_direction integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_direction not in (-1, 1) then
    raise exception 'Admin fee direction must be -1 or 1';
  end if;

  if coalesce(p_admin_fee_amount, 0) = 0 then
    return;
  end if;

  if p_admin_fee_amount < 0 then
    raise exception 'Admin fee cannot be negative';
  end if;

  if p_type not in (
    'transfer',
    'investment_buy',
    'investment_sell',
    'debt_payment'
  ) then
    raise exception 'Admin fee is not valid for this transaction type';
  end if;

  update public.accounts
  set current_balance =
    current_balance - (p_admin_fee_amount * p_direction)
  where id = p_account_id
    and user_id = p_user_id;

  if not found then
    raise exception 'Admin fee account not found';
  end if;
end;
$$;

create or replace function public.create_manual_transaction(
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
  p_merchant text default null,
  p_notes text default null,
  p_asset_id uuid default null,
  p_liability_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction_id uuid;
  v_category_type text;
  v_expected_category_type text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in (
    'income',
    'expense',
    'transfer',
    'investment_buy',
    'investment_sell',
    'debt_payment'
  ) then
    raise exception 'Invalid transaction type';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_transaction_date is null then
    raise exception 'Transaction date is required';
  end if;

  v_expected_category_type := case
    when p_type in ('investment_buy', 'investment_sell') then 'investment'
    when p_type = 'debt_payment' then 'debt'
    else p_type
  end;

  select transaction_type
  into v_category_type
  from public.categories
  where id = p_category_id
    and user_id = v_user_id
    and is_active = true;

  if v_category_type is null or v_category_type <> v_expected_category_type then
    raise exception 'Category does not match transaction type';
  end if;

  if p_type = 'transfer' then
    if p_transfer_to_account_id is null
      or p_transfer_to_account_id = p_account_id then
      raise exception 'Transfer destination must be different';
    end if;

    if p_asset_id is not null or p_liability_id is not null then
      raise exception 'Extra target fields are not valid for transfers';
    end if;
  elsif p_type in ('investment_buy', 'investment_sell') then
    if p_asset_id is null then
      raise exception 'Investment asset is required';
    end if;

    if p_transfer_to_account_id is not null or p_liability_id is not null then
      raise exception 'Extra target fields are not valid for investments';
    end if;
  elsif p_type = 'debt_payment' then
    if p_liability_id is null then
      raise exception 'Liability is required';
    end if;

    if p_transfer_to_account_id is not null or p_asset_id is not null then
      raise exception 'Extra target fields are not valid for debt payment';
    end if;
  elsif p_transfer_to_account_id is not null
    or p_asset_id is not null
    or p_liability_id is not null then
    raise exception 'Extra target fields are not valid for this transaction';
  end if;

  perform 1
  from public.accounts
  where user_id = v_user_id
    and is_active = true
    and id = any (
      case
        when p_type = 'transfer'
          then array[p_account_id, p_transfer_to_account_id]
        else array[p_account_id]
      end
    )
  order by id
  for update;

  if p_type in (
    'investment_buy',
    'investment_sell',
    'debt_payment'
  ) then
    if not exists (
      select 1 from public.accounts
      where id = p_account_id
        and user_id = v_user_id
        and is_active = true
        and type in ('cash', 'bank_account', 'e_wallet')
    ) then
      raise exception 'Spendable account not found';
    end if;
  elsif not exists (
    select 1 from public.accounts
    where id = p_account_id
      and user_id = v_user_id
      and is_active = true
  ) then
    raise exception 'Source account not found';
  end if;

  if p_type = 'transfer' and not exists (
    select 1 from public.accounts
    where id = p_transfer_to_account_id
      and user_id = v_user_id
      and is_active = true
  ) then
    raise exception 'Destination account not found';
  end if;

  if p_type in ('investment_buy', 'investment_sell') then
    perform 1
    from public.assets
    where id = p_asset_id
      and user_id = v_user_id
      and type in ('rdpu', 'rdpt', 'gold', 'crypto', 'stock', 'other_asset')
    for update;

    if not found then
      raise exception 'Investment asset not found';
    end if;
  end if;

  if p_type = 'debt_payment' then
    perform 1
    from public.liabilities
    where id = p_liability_id
      and user_id = v_user_id
    for update;

    if not found then
      raise exception 'Liability not found';
    end if;

    perform public.apply_debt_payment_effect(
      v_user_id,
      p_amount,
      p_account_id,
      p_liability_id,
      1
    );
  else
    perform public.apply_cashflow_transaction_effect(
      v_user_id,
      p_type,
      p_amount,
      p_account_id,
      p_transfer_to_account_id,
      p_asset_id,
      1
    );
  end if;

  insert into public.transactions (
    user_id,
    type,
    amount,
    category_id,
    account_id,
    transfer_to_account_id,
    asset_id,
    liability_id,
    transaction_date,
    merchant,
    notes,
    source
  )
  values (
    v_user_id,
    p_type,
    p_amount,
    p_category_id,
    p_account_id,
    p_transfer_to_account_id,
    p_asset_id,
    p_liability_id,
    p_transaction_date,
    nullif(trim(p_merchant), ''),
    nullif(trim(p_notes), ''),
    'manual'
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

create or replace function public.update_manual_transaction(
  p_transaction_id uuid,
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
  p_merchant text default null,
  p_notes text default null,
  p_asset_id uuid default null,
  p_liability_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old public.transactions%rowtype;
  v_category_type text;
  v_expected_category_type text;
  v_account_ids uuid[];
  v_asset_ids uuid[];
  v_liability_ids uuid[];
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_old
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and type in (
      'income',
      'expense',
      'transfer',
      'investment_buy',
      'investment_sell',
      'debt_payment'
    )
    and source in ('manual', 'chat')
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if p_type not in (
    'income',
    'expense',
    'transfer',
    'investment_buy',
    'investment_sell',
    'debt_payment'
  ) then
    raise exception 'Invalid transaction type';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_transaction_date is null then
    raise exception 'Transaction date is required';
  end if;

  v_expected_category_type := case
    when p_type in ('investment_buy', 'investment_sell') then 'investment'
    when p_type = 'debt_payment' then 'debt'
    else p_type
  end;

  select transaction_type
  into v_category_type
  from public.categories
  where id = p_category_id
    and user_id = v_user_id
    and is_active = true;

  if v_category_type is null or v_category_type <> v_expected_category_type then
    raise exception 'Category does not match transaction type';
  end if;

  if p_type = 'transfer' then
    if p_transfer_to_account_id is null
      or p_transfer_to_account_id = p_account_id then
      raise exception 'Transfer destination must be different';
    end if;

    if p_asset_id is not null or p_liability_id is not null then
      raise exception 'Extra target fields are not valid for transfers';
    end if;
  elsif p_type in ('investment_buy', 'investment_sell') then
    if p_asset_id is null then
      raise exception 'Investment asset is required';
    end if;

    if p_transfer_to_account_id is not null or p_liability_id is not null then
      raise exception 'Extra target fields are not valid for investments';
    end if;
  elsif p_type = 'debt_payment' then
    if p_liability_id is null then
      raise exception 'Liability is required';
    end if;

    if p_transfer_to_account_id is not null or p_asset_id is not null then
      raise exception 'Extra target fields are not valid for debt payment';
    end if;
  elsif p_transfer_to_account_id is not null
    or p_asset_id is not null
    or p_liability_id is not null then
    raise exception 'Extra target fields are not valid for this transaction';
  end if;

  v_account_ids := array_remove(array[
    v_old.account_id,
    v_old.transfer_to_account_id,
    p_account_id,
    p_transfer_to_account_id
  ], null);
  v_asset_ids := array_remove(array[v_old.asset_id, p_asset_id], null);
  v_liability_ids := array_remove(array[v_old.liability_id, p_liability_id], null);

  perform 1
  from public.accounts
  where user_id = v_user_id
    and id = any (v_account_ids)
  order by id
  for update;

  if array_length(v_asset_ids, 1) is not null then
    perform 1
    from public.assets
    where user_id = v_user_id
      and id = any (v_asset_ids)
    order by id
    for update;
  end if;

  if array_length(v_liability_ids, 1) is not null then
    perform 1
    from public.liabilities
    where user_id = v_user_id
      and id = any (v_liability_ids)
    order by id
    for update;
  end if;

  if p_type in (
    'investment_buy',
    'investment_sell',
    'debt_payment'
  ) then
    if not exists (
      select 1 from public.accounts
      where id = p_account_id
        and user_id = v_user_id
        and is_active = true
        and type in ('cash', 'bank_account', 'e_wallet')
    ) then
      raise exception 'Spendable account not found';
    end if;
  elsif not exists (
    select 1 from public.accounts
    where id = p_account_id
      and user_id = v_user_id
      and is_active = true
  ) then
    raise exception 'Source account not found';
  end if;

  if p_type = 'transfer' and not exists (
    select 1 from public.accounts
    where id = p_transfer_to_account_id
      and user_id = v_user_id
      and is_active = true
  ) then
    raise exception 'Destination account not found';
  end if;

  if p_type in ('investment_buy', 'investment_sell') and not exists (
    select 1 from public.assets
    where id = p_asset_id
      and user_id = v_user_id
      and type in ('rdpu', 'rdpt', 'gold', 'crypto', 'stock', 'other_asset')
  ) then
    raise exception 'Investment asset not found';
  end if;

  if p_type = 'debt_payment' and not exists (
    select 1 from public.liabilities
    where id = p_liability_id
      and user_id = v_user_id
  ) then
    raise exception 'Liability not found';
  end if;

  if v_old.type = 'debt_payment' then
    perform public.apply_debt_payment_effect(
      v_user_id,
      v_old.amount,
      v_old.account_id,
      v_old.liability_id,
      -1
    );
  else
    perform public.apply_cashflow_transaction_effect(
      v_user_id,
      v_old.type,
      v_old.amount,
      v_old.account_id,
      v_old.transfer_to_account_id,
      v_old.asset_id,
      -1
    );
  end if;

  if p_type = 'debt_payment' then
    perform public.apply_debt_payment_effect(
      v_user_id,
      p_amount,
      p_account_id,
      p_liability_id,
      1
    );
  else
    perform public.apply_cashflow_transaction_effect(
      v_user_id,
      p_type,
      p_amount,
      p_account_id,
      p_transfer_to_account_id,
      p_asset_id,
      1
    );
  end if;

  update public.transactions
  set
    type = p_type,
    amount = p_amount,
    category_id = p_category_id,
    account_id = p_account_id,
    transfer_to_account_id = p_transfer_to_account_id,
    asset_id = p_asset_id,
    liability_id = p_liability_id,
    transaction_date = p_transaction_date,
    merchant = nullif(trim(p_merchant), ''),
    notes = nullif(trim(p_notes), '')
  where id = p_transaction_id
    and user_id = v_user_id;
end;
$$;

create or replace function public.delete_manual_transaction(
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old public.transactions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_old
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and type in (
      'income',
      'expense',
      'transfer',
      'investment_buy',
      'investment_sell',
      'debt_payment'
    )
    and source in ('manual', 'chat')
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  perform 1
  from public.accounts
  where user_id = v_user_id
    and id = any (
      array_remove(
        array[v_old.account_id, v_old.transfer_to_account_id],
        null
      )
    )
  order by id
  for update;

  if v_old.asset_id is not null then
    perform 1
    from public.assets
    where user_id = v_user_id
      and id = v_old.asset_id
    for update;
  end if;

  if v_old.liability_id is not null then
    perform 1
    from public.liabilities
    where user_id = v_user_id
      and id = v_old.liability_id
    for update;
  end if;

  if v_old.type = 'debt_payment' then
    perform public.apply_debt_payment_effect(
      v_user_id,
      v_old.amount,
      v_old.account_id,
      v_old.liability_id,
      -1
    );
  else
    perform public.apply_cashflow_transaction_effect(
      v_user_id,
      v_old.type,
      v_old.amount,
      v_old.account_id,
      v_old.transfer_to_account_id,
      v_old.asset_id,
      -1
    );
  end if;

  delete from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id;
end;
$$;

create or replace function public.create_manual_transaction_with_fee(
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
  p_merchant text default null,
  p_notes text default null,
  p_asset_id uuid default null,
  p_admin_fee_amount numeric default 0,
  p_liability_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction_id uuid;
  v_admin_fee numeric(18, 2) := coalesce(p_admin_fee_amount, 0);
  v_admin_fee_category_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_admin_fee < 0 then
    raise exception 'Admin fee cannot be negative';
  end if;

  if v_admin_fee > 0
    and p_type not in (
      'transfer',
      'investment_buy',
      'investment_sell',
      'debt_payment'
    ) then
    raise exception 'Admin fee is not valid for this transaction type';
  end if;

  if p_type = 'investment_sell' and v_admin_fee > p_amount then
    raise exception 'Admin fee cannot exceed investment sell amount';
  end if;

  v_transaction_id := public.create_manual_transaction(
    p_type,
    p_amount,
    p_account_id,
    p_category_id,
    p_transaction_date,
    p_transfer_to_account_id,
    p_merchant,
    p_notes,
    p_asset_id,
    p_liability_id
  );

  if v_admin_fee > 0 then
    v_admin_fee_category_id := public.ensure_admin_fee_category();

    perform public.apply_transaction_admin_fee_effect(
      v_user_id,
      p_type,
      v_admin_fee,
      p_account_id,
      1
    );

    update public.transactions
    set
      admin_fee_amount = v_admin_fee,
      admin_fee_category_id = v_admin_fee_category_id
    where id = v_transaction_id
      and user_id = v_user_id;
  end if;

  return v_transaction_id;
end;
$$;

create or replace function public.update_manual_transaction_with_fee(
  p_transaction_id uuid,
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
  p_merchant text default null,
  p_notes text default null,
  p_asset_id uuid default null,
  p_admin_fee_amount numeric default 0,
  p_liability_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old public.transactions%rowtype;
  v_admin_fee numeric(18, 2) := coalesce(p_admin_fee_amount, 0);
  v_admin_fee_category_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_old
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and source in ('manual', 'chat')
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if v_admin_fee < 0 then
    raise exception 'Admin fee cannot be negative';
  end if;

  if v_admin_fee > 0
    and p_type not in (
      'transfer',
      'investment_buy',
      'investment_sell',
      'debt_payment'
    ) then
    raise exception 'Admin fee is not valid for this transaction type';
  end if;

  if p_type = 'investment_sell' and v_admin_fee > p_amount then
    raise exception 'Admin fee cannot exceed investment sell amount';
  end if;

  update public.transactions
  set
    admin_fee_amount = 0,
    admin_fee_category_id = null
  where id = p_transaction_id
    and user_id = v_user_id;

  perform public.update_manual_transaction(
    p_transaction_id,
    p_type,
    p_amount,
    p_account_id,
    p_category_id,
    p_transaction_date,
    p_transfer_to_account_id,
    p_merchant,
    p_notes,
    p_asset_id,
    p_liability_id
  );

  perform public.apply_transaction_admin_fee_effect(
    v_user_id,
    v_old.type,
    v_old.admin_fee_amount,
    v_old.account_id,
    -1
  );

  if v_admin_fee > 0 then
    v_admin_fee_category_id := public.ensure_admin_fee_category();

    perform public.apply_transaction_admin_fee_effect(
      v_user_id,
      p_type,
      v_admin_fee,
      p_account_id,
      1
    );
  end if;

  update public.transactions
  set
    admin_fee_amount = v_admin_fee,
    admin_fee_category_id = v_admin_fee_category_id
  where id = p_transaction_id
    and user_id = v_user_id;
end;
$$;

create or replace function public.delete_manual_transaction_with_fee(
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old public.transactions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_old
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and source in ('manual', 'chat')
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  perform public.delete_manual_transaction(p_transaction_id);

  perform public.apply_transaction_admin_fee_effect(
    v_user_id,
    v_old.type,
    v_old.admin_fee_amount,
    v_old.account_id,
    -1
  );
end;
$$;

revoke all on function public.apply_debt_payment_effect(
  uuid, numeric, uuid, uuid, integer
) from public;
revoke all on function public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, uuid
) from public;
revoke all on function public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, uuid
) from public;
revoke all on function public.create_manual_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric, uuid
) from public;
revoke all on function public.update_manual_transaction_with_fee(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric, uuid
) from public;

grant execute on function public.create_manual_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric, uuid
) to authenticated;
grant execute on function public.update_manual_transaction_with_fee(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric, uuid
) to authenticated;
