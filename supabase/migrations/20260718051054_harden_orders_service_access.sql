alter table public.orders enable row level security;

revoke all on table public.orders from anon, authenticated;
grant all on table public.orders to service_role;

revoke all on table public.resend_events from anon, authenticated;
grant all on table public.resend_events to service_role;
