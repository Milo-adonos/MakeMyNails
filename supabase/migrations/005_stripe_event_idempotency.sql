-- Migration 005 : idempotence webhooks Stripe

create table if not exists public.stripe_processed_events (
  id text primary key,
  event_type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.stripe_processed_events enable row level security;
