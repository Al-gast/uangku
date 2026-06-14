-- UangKu Phase 30: manual reconciliation status for account mutations.

alter table public.transactions
  add column if not exists reconciliation_status text not null default 'unchecked';

alter table public.transactions
  drop constraint if exists transactions_reconciliation_status_check,
  add constraint transactions_reconciliation_status_check check (
    reconciliation_status in ('unchecked', 'matched', 'needs_review')
  );

create index if not exists transactions_reconciliation_status_idx
  on public.transactions(user_id, reconciliation_status, transaction_date);
