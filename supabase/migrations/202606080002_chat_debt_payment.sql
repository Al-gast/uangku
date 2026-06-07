-- UangKu Phase 29: Chat Input debt payment save support.

drop function if exists public.create_chat_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid, numeric
);

create or replace function public.create_chat_transaction_with_fee(
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
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
  v_category_type text;
  v_expected_category_type text;
  v_admin_fee numeric(18, 2) := coalesce(p_admin_fee_amount, 0);
  v_admin_fee_category_id uuid;
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
    raise exception 'Invalid chat transaction type';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 999000000000000 then
    raise exception 'Invalid amount';
  end if;

  if p_transaction_date is null then
    raise exception 'Transaction date is required';
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
    source,
    admin_fee_amount,
    admin_fee_category_id
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
    'chat',
    v_admin_fee,
    v_admin_fee_category_id
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

revoke all on function public.create_chat_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid, numeric, uuid
) from public;

grant execute on function public.create_chat_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid, numeric, uuid
) to authenticated;
