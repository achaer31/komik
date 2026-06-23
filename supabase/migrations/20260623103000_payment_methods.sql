alter table public.orders
  add column if not exists payment_method text,
  add column if not exists payment_channel text,
  add column if not exists va_payload jsonb,
  add column if not exists va_account_number text,
  add column if not exists va_bank_code text,
  add column if not exists va_expires_at timestamptz;

create index if not exists orders_payment_method_idx
  on public.orders (payment_method);
