alter table public.orders
  add column if not exists invoice_email_message_id text,
  add column if not exists invoice_email_sent_at timestamptz,
  add column if not exists access_email_message_id text,
  add column if not exists access_email_sent_at timestamptz;

create index if not exists orders_invoice_email_message_id_idx
  on public.orders (invoice_email_message_id);

create index if not exists orders_access_email_message_id_idx
  on public.orders (access_email_message_id);

update public.orders
set invoice_email_message_id = coalesce(invoice_email_message_id, email_message_id),
    invoice_email_sent_at = coalesce(invoice_email_sent_at, email_sent_at)
where status <> 'PAID'
  and email_message_id is not null;
