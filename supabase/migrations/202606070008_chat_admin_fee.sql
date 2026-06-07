-- UangKu Phase 15: optional admin fees for Chat Input movements.

create or replace function public.create_chat_transaction_with_fee(
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_category_id uuid,
  p_transaction_date timestamptz,
  p_transfer_to_account_id uuid default null,
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

  v_transaction_id := public.create_chat_transaction(
    p_type,
    p_amount,
    p_account_id,
    p_category_id,
    p_transaction_date,
    p_transfer_to_account_id,
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

revoke all on function public.create_chat_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid, numeric
) from public;

grant execute on function public.create_chat_transaction_with_fee(
  text, numeric, uuid, uuid, timestamptz, uuid, uuid, numeric
) to authenticated;
