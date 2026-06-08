-- UangKu Category Management MVP:
-- Allow editing historical transactions that keep their existing category after
-- that category has been deactivated. New/switch-to category choices still
-- require an active category through the existing form option filters.

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
    and (is_active = true or id = v_old.category_id);

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
