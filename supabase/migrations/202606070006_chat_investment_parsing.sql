-- UangKu Phase 13: Chat Input investment buy/sell save support.

create or replace function public.ensure_chat_categories()
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
    (v_user_id, 'Makan', 'primer', 'expense', true, true),
    (v_user_id, 'Belanja kebutuhan', 'primer', 'expense', true, true),
    (v_user_id, 'Pulsa', 'primer', 'expense', true, true),
    (v_user_id, 'Internet', 'primer', 'expense', true, true),
    (v_user_id, 'Bensin', 'transport', 'expense', true, true),
    (v_user_id, 'Kopi', 'sekunder', 'expense', true, true),
    (v_user_id, 'Jajan', 'sekunder', 'expense', true, true),
    (v_user_id, 'Hiburan', 'lifestyle', 'expense', true, true),
    (v_user_id, 'Subscription', 'lifestyle', 'expense', true, true),
    (v_user_id, 'Listrik', 'tagihan', 'expense', true, true),
    (v_user_id, 'Air', 'tagihan', 'expense', true, true),
    (v_user_id, 'Internet rumah', 'tagihan', 'expense', true, true),
    (v_user_id, 'Gaji', 'income', 'income', true, true),
    (v_user_id, 'Bonus', 'income', 'income', true, true),
    (v_user_id, 'Freelance', 'income', 'income', true, true),
    (v_user_id, 'Transfer', 'transfer', 'transfer', true, true),
    (v_user_id, 'Investasi', 'investasi', 'investment', true, true)
  on conflict (user_id, name, transaction_type)
  do update set
    "group" = excluded."group",
    is_active = true;
end;
$$;

drop function if exists public.create_chat_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid
);

create or replace function public.create_chat_transaction(
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
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
    raise exception 'Invalid chat transaction type';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 999000000000000 then
    raise exception 'Invalid amount';
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
    and type in ('cash', 'bank_account', 'e_wallet')
    and id = any (
      case
        when p_type = 'transfer'
          then array[p_account_id, p_transfer_to_account_id]
        else array[p_account_id]
      end
    )
  order by id
  for update;

  if not exists (
    select 1 from public.accounts
    where id = p_account_id
      and user_id = v_user_id
      and is_active = true
      and type in ('cash', 'bank_account', 'e_wallet')
  ) then
    raise exception 'Source account not found';
  end if;

  if p_type = 'transfer' and not exists (
    select 1 from public.accounts
    where id = p_transfer_to_account_id
      and user_id = v_user_id
      and is_active = true
      and type in ('cash', 'bank_account', 'e_wallet')
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
    'chat'
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

revoke all on function public.ensure_chat_categories() from public;
revoke all on function public.create_chat_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid
) from public;

grant execute on function public.ensure_chat_categories()
  to authenticated;
grant execute on function public.create_chat_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid
) to authenticated;
