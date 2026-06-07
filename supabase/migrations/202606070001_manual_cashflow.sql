-- UangKu Phase 4: manual income, expense, transfer, and atomic balances.

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
    (v_user_id, 'Transfer', 'transfer', 'transfer', true, true)
  on conflict (user_id, name, transaction_type)
  do update set
    is_active = true;
end;
$$;

create or replace function public.apply_manual_transaction_balance_effect(
  p_user_id uuid,
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_transfer_to_account_id uuid,
  p_direction integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  else
    raise exception 'Unsupported balance effect type';
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
  p_notes text default null
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
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('income', 'expense', 'transfer') then
    raise exception 'Invalid manual transaction type';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_transaction_date is null then
    raise exception 'Transaction date is required';
  end if;

  select transaction_type
  into v_category_type
  from public.categories
  where id = p_category_id
    and user_id = v_user_id
    and is_active = true;

  if v_category_type is null or v_category_type <> p_type then
    raise exception 'Category does not match transaction type';
  end if;

  if p_type = 'transfer' then
    if p_transfer_to_account_id is null
      or p_transfer_to_account_id = p_account_id then
      raise exception 'Transfer destination must be different';
    end if;
  elsif p_transfer_to_account_id is not null then
    raise exception 'Destination account is only valid for transfers';
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

  if not exists (
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

  perform public.apply_manual_transaction_balance_effect(
    v_user_id,
    p_type,
    p_amount,
    p_account_id,
    p_transfer_to_account_id,
    1
  );

  insert into public.transactions (
    user_id,
    type,
    amount,
    category_id,
    account_id,
    transfer_to_account_id,
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
  p_notes text default null
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
  v_account_ids uuid[];
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_old
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id
    and type in ('income', 'expense', 'transfer')
    and source = 'manual'
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if p_type not in ('income', 'expense', 'transfer') then
    raise exception 'Invalid manual transaction type';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_transaction_date is null then
    raise exception 'Transaction date is required';
  end if;

  select transaction_type
  into v_category_type
  from public.categories
  where id = p_category_id
    and user_id = v_user_id
    and is_active = true;

  if v_category_type is null or v_category_type <> p_type then
    raise exception 'Category does not match transaction type';
  end if;

  if p_type = 'transfer' then
    if p_transfer_to_account_id is null
      or p_transfer_to_account_id = p_account_id then
      raise exception 'Transfer destination must be different';
    end if;
  elsif p_transfer_to_account_id is not null then
    raise exception 'Destination account is only valid for transfers';
  end if;

  v_account_ids := array_remove(array[
    v_old.account_id,
    v_old.transfer_to_account_id,
    p_account_id,
    p_transfer_to_account_id
  ], null);

  perform 1
  from public.accounts
  where user_id = v_user_id
    and id = any (v_account_ids)
  order by id
  for update;

  if not exists (
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

  perform public.apply_manual_transaction_balance_effect(
    v_user_id,
    v_old.type,
    v_old.amount,
    v_old.account_id,
    v_old.transfer_to_account_id,
    -1
  );

  perform public.apply_manual_transaction_balance_effect(
    v_user_id,
    p_type,
    p_amount,
    p_account_id,
    p_transfer_to_account_id,
    1
  );

  update public.transactions
  set
    type = p_type,
    amount = p_amount,
    category_id = p_category_id,
    account_id = p_account_id,
    transfer_to_account_id = p_transfer_to_account_id,
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
    and type in ('income', 'expense', 'transfer')
    and source = 'manual'
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

  perform public.apply_manual_transaction_balance_effect(
    v_user_id,
    v_old.type,
    v_old.amount,
    v_old.account_id,
    v_old.transfer_to_account_id,
    -1
  );

  delete from public.transactions
  where id = p_transaction_id
    and user_id = v_user_id;
end;
$$;

revoke all on function public.ensure_manual_cashflow_categories() from public;
revoke all on function public.apply_manual_transaction_balance_effect(
  uuid, text, numeric, uuid, uuid, integer
) from public;
revoke all on function public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text
) from public;
revoke all on function public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text
) from public;
revoke all on function public.delete_manual_transaction(uuid) from public;

grant execute on function public.ensure_manual_cashflow_categories()
  to authenticated;
grant execute on function public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text
) to authenticated;
grant execute on function public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text
) to authenticated;
grant execute on function public.delete_manual_transaction(uuid)
  to authenticated;

-- Keep transaction history and computed balances behind the atomic RPCs.
revoke insert, update, delete on public.transactions from authenticated;
grant select on public.transactions to authenticated;

revoke update on public.accounts from authenticated;
grant update (name, type, is_active) on public.accounts to authenticated;
