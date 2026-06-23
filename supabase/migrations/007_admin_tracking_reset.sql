-- Migration 007 : tracking enrichi + remise à zéro des stats admin

alter table public.payment_events
  add column if not exists user_email text;

alter table public.subscription_cancellations
  add column if not exists user_email text,
  add column if not exists plan text,
  add column if not exists cancel_reason text;

alter table public.generation_logs
  add column if not exists format text;

create table if not exists public.user_login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_login_logs_created_at on public.user_login_logs(created_at desc);
create index if not exists idx_user_login_logs_user_id on public.user_login_logs(user_id);

alter table public.user_login_logs enable row level security;

-- Remet à zéro compteurs/stats sans toucher utilisateurs ni abonnements
create or replace function public.reset_admin_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table public.generation_logs;
  truncate table public.payment_events;
  truncate table public.subscription_cancellations;
  truncate table public.user_login_logs;

  insert into public.admin_settings (key, value, updated_at)
  values ('churn_reset_at', to_jsonb(now()::text), now())
  on conflict (key) do update
    set value = to_jsonb(now()::text), updated_at = now();

  insert into public.admin_settings (key, value, updated_at)
  values ('stats_reset_at', to_jsonb(now()::text), now())
  on conflict (key) do update
    set value = to_jsonb(now()::text), updated_at = now();
end;
$$;

-- Exécuter la remise à zéro immédiatement
select public.reset_admin_stats();
