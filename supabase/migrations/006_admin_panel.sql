-- Migration 006 : panel admin (tables + réglages)

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  visualization_id uuid references public.visualizations(id) on delete set null,
  user_email text,
  mode text not null,
  shape text,
  style text,
  length text,
  custom_note text,
  prompt text not null,
  aspect_ratio text,
  result_image_url text,
  status text not null default 'success',
  error_message text,
  latency_ms integer,
  estimated_cost_eur numeric(10, 6) not null default 0,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  stripe_event_id text unique,
  event_type text not null,
  amount_eur numeric(10, 2) not null default 0,
  plan text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_cancellations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  canceled_at timestamptz not null default now(),
  excluded_from_churn boolean not null default false,
  canceled_by text not null default 'stripe'
);

create table if not exists public.admin_hidden_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now()
);

create index if not exists idx_generation_logs_created_at on public.generation_logs(created_at desc);
create index if not exists idx_generation_logs_user_id on public.generation_logs(user_id);
create index if not exists idx_payment_events_created_at on public.payment_events(created_at desc);
create index if not exists idx_subscription_cancellations_canceled_at on public.subscription_cancellations(canceled_at desc);

alter table public.admin_settings enable row level security;
alter table public.generation_logs enable row level security;
alter table public.payment_events enable row level security;
alter table public.subscription_cancellations enable row level security;
alter table public.admin_hidden_users enable row level security;

insert into public.admin_settings (key, value) values
  ('generation_cost_eur', '0.08'),
  ('admin_notification_email', '""'),
  ('admin_password_salt', '"makemynails_admin_v1"'),
  ('admin_password_hash', '"0c3a8237f404b528acae1c2b4db0061dea25984a8d2cedae0045b862af9ec0e2"'),
  ('maintenance_mode', 'false'),
  ('churn_reset_at', 'null')
on conflict (key) do nothing;
