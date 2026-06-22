-- Migration 003 : activation abonnement via webhook Stripe (service role)

create or replace function public.activate_subscription_for_user(
  p_user_id uuid,
  p_stripe_subscription_id text default null,
  p_period_end timestamptz default null,
  p_plan text default 'premium'
)
returns void as $$
declare
  v_plan text;
  v_credits integer;
  v_existing public.subscriptions;
begin
  v_plan := case
    when p_plan in ('sub_exclusif_ia', 'exclusif_ia') then 'exclusif_ia'
    else 'premium'
  end;
  v_credits := case when v_plan = 'exclusif_ia' then 999 else 50 end;

  select * into v_existing
  from public.subscriptions
  where user_id = p_user_id and status = 'active';

  if found then
    update public.subscriptions
    set
      plan = v_plan,
      credits_per_month = v_credits,
      current_period_start = now(),
      current_period_end = coalesce(p_period_end, now() + interval '1 month'),
      stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
      updated_at = now()
    where id = v_existing.id;
  else
    insert into public.subscriptions (
      user_id, plan, status, credits_per_month,
      current_period_start, current_period_end, stripe_subscription_id
    )
    values (
      p_user_id, v_plan, 'active', v_credits,
      now(), coalesce(p_period_end, now() + interval '1 month'), p_stripe_subscription_id
    );
  end if;

  update public.profiles
  set credits = credits + v_credits
  where id = p_user_id;
end;
$$ language plpgsql security definer;
