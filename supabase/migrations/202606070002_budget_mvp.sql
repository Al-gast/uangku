-- UangKu Phase 6: minimal consumptive categories for Budget MVP.

create or replace function public.ensure_budget_categories()
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
    (v_user_id, 'Transport', 'transport', 'expense', true, true),
    (v_user_id, 'Tagihan', 'tagihan', 'expense', true, true),
    (v_user_id, 'Lifestyle', 'lifestyle', 'expense', true, true),
    (v_user_id, 'Kesehatan', 'kesehatan', 'expense', true, true),
    (v_user_id, 'Pendidikan', 'pendidikan', 'expense', true, true)
  on conflict (user_id, name, transaction_type)
  do update set
    is_active = true;
end;
$$;

revoke all on function public.ensure_budget_categories() from public;
grant execute on function public.ensure_budget_categories()
  to authenticated;
