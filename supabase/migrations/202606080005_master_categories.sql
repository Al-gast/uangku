-- UangKu Master Category foundation.
-- Consolidates default category seeding and adds metadata for category UX/chat.

alter table public.categories
  add column if not exists is_system boolean not null default false,
  add column if not exists sort_order integer not null default 1000,
  add column if not exists aliases text[] not null default '{}';

create index if not exists categories_user_type_order_idx
  on public.categories(user_id, transaction_type, sort_order, name);

create or replace function public.ensure_default_categories()
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

  insert into public.categories as existing_category (
    user_id,
    name,
    "group",
    transaction_type,
    icon,
    color,
    is_default,
    is_active,
    is_system,
    sort_order,
    aliases
  )
  values
    (v_user_id, 'Makan', 'primer', 'expense', null, null, true, true, false, 100, array['sarapan','makan siang','makan malam','gofood','grabfood','warteg','ayam']),
    (v_user_id, 'Belanja kebutuhan', 'primer', 'expense', null, null, true, true, false, 110, array['belanja','sembako','grocery','kebutuhan rumah']),
    (v_user_id, 'Pulsa', 'primer', 'expense', null, null, true, true, false, 120, array['isi pulsa','paket data','data']),
    (v_user_id, 'Internet', 'primer', 'expense', null, null, true, true, false, 130, array['wifi','kuota']),
    (v_user_id, 'Kopi', 'sekunder', 'expense', null, null, true, true, false, 200, array['ngopi','coffee','cafe']),
    (v_user_id, 'Jajan', 'sekunder', 'expense', null, null, true, true, false, 210, array['snack','cemilan','cilok']),
    (v_user_id, 'Hiburan', 'sekunder', 'expense', null, null, true, true, false, 220, array['nonton','movie','bioskop','game']),
    (v_user_id, 'Subscription', 'sekunder', 'expense', null, null, true, true, false, 230, array['langganan','netflix','spotify','icloud']),
    (v_user_id, 'Baju', 'lifestyle', 'expense', null, null, true, true, false, 300, array['pakaian','fashion']),
    (v_user_id, 'Skincare', 'lifestyle', 'expense', null, null, true, true, false, 310, array['skin care','kosmetik']),
    (v_user_id, 'Gadget', 'lifestyle', 'expense', null, null, true, true, false, 320, array['elektronik','aksesoris hp']),
    (v_user_id, 'Hobi', 'lifestyle', 'expense', null, null, true, true, false, 330, array['hobby']),
    (v_user_id, 'Bensin', 'transport', 'expense', null, null, true, true, false, 400, array['bbm','pertalite','pertamax']),
    (v_user_id, 'Parkir', 'transport', 'expense', null, null, true, true, false, 410, array['parking']),
    (v_user_id, 'Ojek online', 'transport', 'expense', null, null, true, true, false, 420, array['ojol','gojek','grab','ride']),
    (v_user_id, 'Tol', 'transport', 'expense', null, null, true, true, false, 430, array['e toll','etoll']),
    (v_user_id, 'Servis kendaraan', 'transport', 'expense', null, null, true, true, false, 440, array['service kendaraan','ganti oli','bengkel']),
    (v_user_id, 'Listrik', 'tagihan', 'expense', null, null, true, true, false, 500, array['pln','token listrik']),
    (v_user_id, 'Air', 'tagihan', 'expense', null, null, true, true, false, 510, array['pdam']),
    (v_user_id, 'Internet rumah', 'tagihan', 'expense', null, null, true, true, false, 520, array['wifi rumah','indihome','biznet']),
    (v_user_id, 'Biaya Admin', 'tagihan', 'expense', null, null, true, true, true, 590, array['admin','biaya','fee','biaya admin']),
    (v_user_id, 'Kesehatan', 'kesehatan', 'expense', null, null, true, true, false, 600, array['obat','dokter','klinik','apotek']),
    (v_user_id, 'Pendidikan', 'pendidikan', 'expense', null, null, true, true, false, 700, array['sekolah','kursus','buku']),
    (v_user_id, 'Lainnya', 'other', 'expense', null, null, true, true, false, 900, array['lain lain','lain-lain']),
    (v_user_id, 'Gaji', 'income', 'income', null, null, true, true, false, 100, array['salary','payroll']),
    (v_user_id, 'Bonus', 'income', 'income', null, null, true, true, false, 110, array['thr','insentif']),
    (v_user_id, 'Freelance', 'income', 'income', null, null, true, true, false, 120, array['project','proyek']),
    (v_user_id, 'Hadiah', 'income', 'income', null, null, true, true, false, 130, array['gift']),
    (v_user_id, 'Transfer', 'transfer', 'transfer', null, null, true, true, true, 100, array['isi','top up saldo','pindah saldo']),
    (v_user_id, 'Investasi', 'investasi', 'investment', null, null, true, true, true, 100, array['top up','beli investasi','jual investasi']),
    (v_user_id, 'RDPU', 'investasi', 'investment', null, null, true, true, false, 110, array['reksadana pasar uang','reksa dana pasar uang']),
    (v_user_id, 'RDPT', 'investasi', 'investment', null, null, true, true, false, 120, array['reksadana pendapatan tetap','reksa dana pendapatan tetap']),
    (v_user_id, 'Emas', 'investasi', 'investment', null, null, true, true, false, 130, array['gold']),
    (v_user_id, 'Bitcoin', 'investasi', 'investment', null, null, true, true, false, 140, array['btc','crypto','kripto']),
    (v_user_id, 'Saham', 'investasi', 'investment', null, null, true, true, false, 150, array['stock']),
    (v_user_id, 'Hutang', 'debt', 'debt', null, null, true, true, true, 100, array['utang','cicilan','pinjaman'])
  on conflict (user_id, name, transaction_type)
  do update set
    "group" = excluded."group",
    icon = coalesce(existing_category.icon, excluded.icon),
    color = coalesce(existing_category.color, excluded.color),
    is_default = true,
    is_system = excluded.is_system,
    sort_order = excluded.sort_order,
    aliases = case
      when existing_category.aliases = '{}'::text[] then excluded.aliases
      else existing_category.aliases
    end,
    is_active = case
      when excluded.is_system then true
      else existing_category.is_active
    end;

  update public.categories
  set
    is_system = true,
    is_default = true,
    is_active = true,
    sort_order = case
      when name = 'Biaya Admin' and transaction_type = 'expense' then 590
      when name = 'Transfer' and transaction_type = 'transfer' then 100
      when name = 'Investasi' and transaction_type = 'investment' then 100
      when name = 'Hutang' and transaction_type = 'debt' then 100
      else sort_order
    end
  where user_id = v_user_id
    and (
      (name = 'Biaya Admin' and transaction_type = 'expense')
      or (name = 'Transfer' and transaction_type = 'transfer')
      or (name = 'Investasi' and transaction_type = 'investment')
      or (name = 'Hutang' and transaction_type = 'debt')
    );
end;
$$;

create or replace function public.ensure_manual_cashflow_categories()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_default_categories();
end;
$$;

create or replace function public.ensure_budget_categories()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_default_categories();
end;
$$;

create or replace function public.ensure_chat_categories()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_default_categories();
end;
$$;

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

  perform public.ensure_default_categories();

  select id
  into v_category_id
  from public.categories
  where user_id = v_user_id
    and name = 'Biaya Admin'
    and transaction_type = 'expense'
  limit 1;

  if v_category_id is null then
    raise exception 'Admin fee category not found';
  end if;

  return v_category_id;
end;
$$;

revoke all on function public.ensure_default_categories() from public;
revoke all on function public.ensure_manual_cashflow_categories() from public;
revoke all on function public.ensure_budget_categories() from public;
revoke all on function public.ensure_chat_categories() from public;
revoke all on function public.ensure_admin_fee_category() from public;

grant execute on function public.ensure_default_categories() to authenticated;
grant execute on function public.ensure_manual_cashflow_categories() to authenticated;
grant execute on function public.ensure_budget_categories() to authenticated;
grant execute on function public.ensure_chat_categories() to authenticated;
grant execute on function public.ensure_admin_fee_category() to authenticated;
