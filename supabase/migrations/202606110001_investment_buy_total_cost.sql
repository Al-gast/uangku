-- UangKu Phase 29: investment buy transactions also increase asset cost basis.

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
  v_total_cost numeric(18, 2);
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
    set
      current_value = current_value + (p_amount * p_direction),
      total_cost = coalesce(total_cost, 0) + (p_amount * p_direction)
    where id = p_asset_id and user_id = p_user_id
    returning current_value, total_cost into v_asset_value, v_total_cost;

    if v_asset_value is null or v_asset_value < 0 then
      raise exception 'Asset value cannot be negative';
    end if;

    if v_total_cost is null or v_total_cost < 0 then
      raise exception 'Asset total cost cannot be negative';
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

revoke all on function public.apply_cashflow_transaction_effect(
  uuid, text, numeric, uuid, uuid, uuid, integer
) from public;
