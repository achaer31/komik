alter table public.orders
  add column if not exists include_vvip boolean not null default false;
