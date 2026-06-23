-- Migration 004 : renouvellement mensuel via invoice.payment_succeeded

create or replace function public.renew_subscription_for_user(
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_plan text default null
)
returns void as $$
declare
  v_plan text;
  v_credits integer;
  v_existing public.subscriptions;
begin
  v_plan := case
    when p_plan in ('sub_exclusif_ia', 'exclusif_ia') then 'exclusif_ia'
    when p_plan in ('sub_premium', 'premium') then 'premium'
    else null
  end;

  select * into v_existing
  from public.subscriptions
  where user_id = p_user_id
    and stripe_subscription_id = p_stripe_subscription_id;

  if not found then
    select * into v_existing
    from public.subscriptions
    where user_id = p_user_id and status = 'active';
  end if;

  if v_plan is null and found then
    v_plan := v_existing.plan;
  end if;

  v_plan := coalesce(v_plan, 'premium');
  v_credits := case when v_plan = 'exclusif_ia' then 999 else 50 end;

  if found then
    update public.subscriptions
    set
      plan = v_plan,
      status = 'active',
      credits_per_month = v_credits,
      current_period_start = p_period_start,
      current_period_end = p_period_end,
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
      p_period_start, p_period_end, p_stripe_subscription_id
    );
  end if;

  update public.profiles
  set credits = credits + v_credits
  where id = p_user_id;
end;
$$ language plpgsql security definer;
