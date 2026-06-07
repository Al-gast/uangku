-- UangKu Phase 12: investment buy/sell transactions with atomic account + asset movement.

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
    (v_user_id, 'Investasi', 'investasi', 'investment', true, true)
  on conflict (user_id, name, transaction_type)
  do update set
    "group" = excluded."group",
    is_active = true;
end;
$$;

create or replace function public.apply_cashflow_transaction_effect(
  p_user_id uuid,
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_transfer_to_account_id uuid,
  p_asset_id uuid,
  p_direction integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asset_value numeric(18, 2);
begin
  if p_direction not in (-1, 1) then
    raise exception 'Balance effect direction must be -1 or 1';
  end if;

  if p_type = 'income' then
    update public.accounts
    set current_balance = current_balance + (p_amount * p_direction)
    where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'expense' then
    update public.accounts
    set current_balance = current_balance - (p_amount * p_direction)
    where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'transfer' then
    update public.accounts
    set current_balance = current_balance - (p_amount * p_direction)
    where id = p_account_id and user_id = p_user_id;

    update public.accounts
    set current_balance = current_balance + (p_amount * p_direction)
    where id = p_transfer_to_account_id and user_id = p_user_id;
  elsif p_type = 'investment_buy' then
    update public.accounts
    set current_balance = current_balance - (p_amount * p_direction)
    where id = p_account_id and user_id = p_user_id;

    update public.assets
    set current_value = current_value + (p_amount * p_direction)
    where id = p_asset_id and user_id = p_user_id
    returning current_value into v_asset_value;

    if v_asset_value is null or v_asset_value < 0 then
      raise exception 'Asset value cannot be negative';
    end if;
  elsif p_type = 'investment_sell' then
    update public.assets
    set current_value = current_value - (p_amount * p_direction)
    where id = p_asset_id and user_id = p_user_id
    returning current_value into v_asset_value;

    if v_asset_value is null or v_asset_value < 0 then
      raise exception 'Asset value cannot be negative';
    end if;

    update public.accounts
    set current_balance = current_balance + (p_amount * p_direction)
    where id = p_account_id and user_id = p_user_id;
  else
    raise exception 'Unsupported balance effect type';
  end if;
end;
$$;

drop function if exists public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text
);

create or replace function public.create_manual_transaction(
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
  p_merchant text default null,
  p_notes text default null,
  p_asset_id uuid default null
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
    'investment_sell'
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

    if p_asset_id is not null then
      raise exception 'Asset is only valid for investment transactions';
    end if;
  elsif p_type in ('investment_buy', 'investment_sell') then
    if p_asset_id is null then
      raise exception 'Investment asset is required';
    end if;

    if p_transfer_to_account_id is not null then
      raise exception 'Destination account is only valid for transfers';
    end if;
  elsif p_transfer_to_account_id is not null or p_asset_id is not null then
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

  if p_type in ('investment_buy', 'investment_sell') then
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

  perform public.apply_cashflow_transaction_effect(
    v_user_id,
    p_type,
    p_amount,
    p_account_id,
    p_transfer_to_account_id,
    p_asset_id,
    1
  );

  insert into public.transactions (
    user_id,
    type,
    amount,
    category_id,
    account_id,
    transfer_to_account_id,
    asset_id,
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
    p_transaction_date,
    nullif(trim(p_merchant), ''),
    nullif(trim(p_notes), ''),
    'manual'
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

drop function if exists public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text
);

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
  p_asset_id uuid default null
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
      'investment_sell'
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
    'investment_sell'
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

    if p_asset_id is not null then
      raise exception 'Asset is only valid for investment transactions';
    end if;
  elsif p_type in ('investment_buy', 'investment_sell') then
    if p_asset_id is null then
      raise exception 'Investment asset is required';
    end if;

    if p_transfer_to_account_id is not null then
      raise exception 'Destination account is only valid for transfers';
    end if;
  elsif p_transfer_to_account_id is not null or p_asset_id is not null then
    raise exception 'Extra target fields are not valid for this transaction';
  end if;

  v_account_ids := array_remove(array[
    v_old.account_id,
    v_old.transfer_to_account_id,
    p_account_id,
    p_transfer_to_account_id
  ], null);
  v_asset_ids := array_remove(array[v_old.asset_id, p_asset_id], null);

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

  if p_type in ('investment_buy', 'investment_sell') then
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

  perform public.apply_cashflow_transaction_effect(
    v_user_id,
    v_old.type,
    v_old.amount,
    v_old.account_id,
    v_old.transfer_to_account_id,
    v_old.asset_id,
    -1
  );

  perform public.apply_cashflow_transaction_effect(
    v_user_id,
    p_type,
    p_amount,
    p_account_id,
    p_transfer_to_account_id,
    p_asset_id,
    1
  );

  update public.transactions
  set
    type = p_type,
    amount = p_amount,
    category_id = p_category_id,
    account_id = p_account_id,
    transfer_to_account_id = p_transfer_to_account_id,
    asset_id = p_asset_id,
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
      'investment_sell'
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

  perform public.apply_cashflow_transaction_effect(
    v_user_id,
    v_old.type,
    v_old.amount,
    v_old.account_id,
    v_old.transfer_to_account_id,
    v_old.asset_id,
    -1
  );

  delete from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id;
end;
$$;

revoke all on function public.ensure_manual_cashflow_categories() from public;
revoke all on function public.apply_cashflow_transaction_effect(
  uuid, text, numeric, uuid, uuid, uuid, integer
) from public;
revoke all on function public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
) from public;
revoke all on function public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
) from public;
revoke all on function public.delete_manual_transaction(uuid) from public;

grant execute on function public.ensure_manual_cashflow_categories()
  to authenticated;
grant execute on function public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
) to authenticated;
grant execute on function public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
) to authenticated;
grant execute on function public.delete_manual_transaction(uuid)
  to authenticated;
