-- UangKu Phase 14: optional admin fees for transfer and investment movements.

alter table public.transactions
  add column if not exists admin_fee_amount numeric(18, 2) not null default 0,
  add column if not exists admin_fee_category_id uuid;

alter table public.transactions
  drop constraint if exists transactions_admin_fee_amount_check,
  add constraint transactions_admin_fee_amount_check
    check (admin_fee_amount >= 0),
  drop constraint if exists transactions_admin_fee_fields_check,
  add constraint transactions_admin_fee_fields_check check (
    (
      admin_fee_amount = 0
      and admin_fee_category_id is null
    )
    or (
      admin_fee_amount > 0
      and type in ('transfer', 'investment_buy', 'investment_sell')
      and admin_fee_category_id is not null
    )
  ),
  drop constraint if exists transactions_sell_admin_fee_check,
  add constraint transactions_sell_admin_fee_check check (
    type <> 'investment_sell'
    or admin_fee_amount <= amount
  ),
  drop constraint if exists transactions_admin_fee_category_id_user_id_fkey,
  add constraint transactions_admin_fee_category_id_user_id_fkey
    foreign key (admin_fee_category_id, user_id)
    references public.categories(id, user_id);

create index if not exists transactions_admin_fee_category_idx
  on public.transactions(user_id, admin_fee_category_id, transaction_date)
  where admin_fee_amount > 0;

create or replace function public.ensure_admin_fee_category()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_category_id uuid;
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
  values (
    v_user_id,
    'Biaya Admin',
    'tagihan',
    'expense',
    true,
    true
  )
  on conflict (user_id, name, transaction_type)
  do update set
    "group" = excluded."group",
    is_active = true
  returning id into v_category_id;

  return v_category_id;
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

  if p_type not in ('transfer', 'investment_buy', 'investment_sell') then
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
  p_admin_fee_amount numeric default 0
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
    and p_type not in ('transfer', 'investment_buy', 'investment_sell') then
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
    p_asset_id
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
  p_admin_fee_amount numeric default 0
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
    and p_type not in ('transfer', 'investment_buy', 'investment_sell') then
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
    p_asset_id
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

revoke all on function public.ensure_admin_fee_category() from public;
revoke all on function public.apply_transaction_admin_fee_effect(
  uuid, text, numeric, uuid, integer
) from public;
revoke all on function public.create_manual_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric
) from public;
revoke all on function public.update_manual_transaction_with_fee(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric
) from public;
revoke all on function public.delete_manual_transaction_with_fee(uuid)
  from public;

revoke execute on function public.create_manual_transaction(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
) from authenticated;
revoke execute on function public.update_manual_transaction(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid
) from authenticated;
revoke execute on function public.delete_manual_transaction(uuid)
  from authenticated;

grant execute on function public.ensure_admin_fee_category()
  to authenticated;
grant execute on function public.create_manual_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric
) to authenticated;
grant execute on function public.update_manual_transaction_with_fee(
  uuid, text, numeric, uuid, uuid, timestamptz, uuid, text, text, uuid, numeric
) to authenticated;
grant execute on function public.delete_manual_transaction_with_fee(uuid)
  to authenticated;
