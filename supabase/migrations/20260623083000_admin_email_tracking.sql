alter table public.orders
  add column if not exists email_status text not null default 'NOT_SENT',
  add column if not exists email_message_id text,
  add column if not exists email_processed_at timestamptz,
  add column if not exists email_delivered_at timestamptz,
  add column if not exists email_opened_at timestamptz,
  add column if not exists email_clicked_at timestamptz,
  add column if not exists email_bounced_at timestamptz,
  add column if not exists email_failed_at timestamptz,
  add column if not exists email_complained_at timestamptz,
  add column if not exists email_last_event_at timestamptz,
  add column if not exists email_last_event text,
  add column if not exists email_error text;

create index if not exists orders_email_message_id_idx
  on public.orders (email_message_id);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

update public.orders
set email_status = case
  when email_sent_at is not null then 'SENT'
  else 'NOT_SENT'
end
where email_status is null
   or email_status = 'NOT_SENT';

create table if not exists public.resend_events (
  id text primary key,
  event_type text not null,
  email_id text,
  recipient text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists resend_events_email_id_idx
  on public.resend_events (email_id);

alter table public.resend_events enable row level security;

revoke all on public.resend_events from anon, authenticated;
