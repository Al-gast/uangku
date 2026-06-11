-- UangKu Phase 30: compact dashboard monthly summary.

create or replace function public.get_dashboard_monthly_summary(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  monthly_income numeric,
  monthly_expense numeric,
  transaction_count bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    coalesce(
      sum(
        case
          when transactions.type = 'income' then transactions.amount
          else 0
        end
      ),
      0
    )::numeric(18, 2) as monthly_income,
    coalesce(
      sum(
        (
          case
            when transactions.type = 'expense' then transactions.amount
            else 0
          end
        ) + coalesce(transactions.admin_fee_amount, 0)
      ),
      0
    )::numeric(18, 2) as monthly_expense,
    count(*)::bigint as transaction_count
  from public.transactions
  where transactions.user_id = auth.uid()
    and transactions.type in (
      'income',
      'expense',
      'transfer',
      'investment_buy',
      'investment_sell',
      'debt_payment'
    )
    and transactions.transaction_date >= p_start
    and transactions.transaction_date < p_end;
$$;

revoke all on function public.get_dashboard_monthly_summary(
  timestamptz,
  timestamptz
) from public;

grant execute on function public.get_dashboard_monthly_summary(
  timestamptz,
  timestamptz
) to authenticated;
