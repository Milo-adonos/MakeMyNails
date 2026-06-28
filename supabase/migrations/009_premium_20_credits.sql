-- Premium = 20 crédits/mois (reset au renouvellement). Exclusif IA = illimité.

alter table public.profiles
  add column if not exists credits_remaining integer,
  add column if not exists credits_reset_date timestamptz;

update public.profiles
set credits_remaining = coalesce(credits_remaining, credits, 0)
where credits_remaining is null;

alter table public.profiles
  alter column credits_remaining set default 0;

update public.subscriptions
set credits_per_month = 20
where plan = 'premium';

update public.subscriptions
set credits_per_month = null
where plan = 'exclusif_ia';

-- Activation abonnement : reset crédits (pas cumulatif)
create or replace function public.activate_subscription_for_user(
  p_user_id uuid,
  p_stripe_subscription_id text default null,
  p_period_end timestamptz default null,
  p_plan text default 'premium'
)
returns void as $$
declare
  v_plan text;
  v_period_end timestamptz;
  v_existing public.subscriptions;
begin
  v_plan := case
    when p_plan in ('sub_exclusif_ia', 'exclusif_ia') then 'exclusif_ia'
    else 'premium'
  end;
  v_period_end := coalesce(p_period_end, now() + interval '1 month');

  select * into v_existing
  from public.subscriptions
  where user_id = p_user_id and status = 'active';

  if found then
    update public.subscriptions
    set
      plan = v_plan,
      credits_per_month = case when v_plan = 'exclusif_ia' then null else 20 end,
      current_period_start = now(),
      current_period_end = v_period_end,
      stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
      updated_at = now()
    where id = v_existing.id;
  else
    insert into public.subscriptions (
      user_id, plan, status, credits_per_month,
      current_period_start, current_period_end, stripe_subscription_id
    )
    values (
      p_user_id, v_plan, 'active',
      case when v_plan = 'exclusif_ia' then null else 20 end,
      now(), v_period_end, p_stripe_subscription_id
    );
  end if;

  update public.profiles
  set
    credits_remaining = case when v_plan = 'exclusif_ia' then null else 20 end,
    credits = case when v_plan = 'exclusif_ia' then 0 else 20 end,
    credits_reset_date = v_period_end
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Renouvellement : Premium → 20 crédits, Exclusif IA → illimité
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

  if found then
    update public.subscriptions
    set
      plan = v_plan,
      status = 'active',
      credits_per_month = case when v_plan = 'exclusif_ia' then null else 20 end,
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
      p_user_id, v_plan, 'active',
      case when v_plan = 'exclusif_ia' then null else 20 end,
      p_period_start, p_period_end, p_stripe_subscription_id
    );
  end if;

  update public.profiles
  set
    credits_remaining = case when v_plan = 'exclusif_ia' then null else 20 end,
    credits = case when v_plan = 'exclusif_ia' then 0 else 20 end,
    credits_reset_date = p_period_end
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Annulation
create or replace function public.cancel_subscription_for_user(
  p_user_id uuid,
  p_stripe_subscription_id text default null
)
returns void as $$
begin
  update public.subscriptions
  set
    status = 'canceled',
    updated_at = now()
  where user_id = p_user_id
    and status = 'active'
    and (
      p_stripe_subscription_id is null
      or stripe_subscription_id = p_stripe_subscription_id
    );

  update public.profiles
  set credits = 0, credits_remaining = 0, credits_reset_date = null
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Réserve une génération (vérifie crédits Premium, ne consomme pas encore)
create or replace function public.use_credit(
  p_shape text,
  p_style text,
  p_length text,
  p_original_image_url text default null
)
returns json as $$
declare
  v_credits_remaining integer;
  v_plan text;
  v_viz public.visualizations;
begin
  select s.plan into v_plan
  from public.subscriptions s
  where s.user_id = auth.uid()
    and s.status = 'active'
    and s.current_period_end > now()
  limit 1;

  if v_plan is null then
    raise exception 'Active subscription required';
  end if;

  select credits_remaining into v_credits_remaining
  from public.profiles
  where id = auth.uid();

  if v_plan = 'premium' and coalesce(v_credits_remaining, 0) <= 0 then
    raise exception 'Tu as utilisé tes 20 générations ce mois-ci. Passe à Exclusif IA pour des générations illimitées 💅';
  end if;

  insert into public.visualizations (user_id, original_image_url, shape, style, length, status)
  values (auth.uid(), p_original_image_url, p_shape, p_style, p_length, 'pending')
  returning * into v_viz;

  return json_build_object(
    'visualization_id', v_viz.id,
    'credits_remaining', case
      when v_plan = 'exclusif_ia' then null
      else coalesce(v_credits_remaining, 0)
    end,
    'is_subscribed', true,
    'plan', v_plan,
    'is_unlimited', v_plan = 'exclusif_ia'
  );
end;
$$ language plpgsql security definer;

-- Consomme 1 crédit Premium à la génération réussie
create or replace function public.complete_visualization(p_viz_id uuid, p_result_image_url text)
returns void as $$
declare
  v_plan text;
begin
  update public.visualizations
  set result_image_url = p_result_image_url, status = 'completed'
  where id = p_viz_id and user_id = auth.uid();

  if not found then
    return;
  end if;

  select s.plan into v_plan
  from public.subscriptions s
  where s.user_id = auth.uid()
    and s.status = 'active'
    and s.current_period_end > now()
  limit 1;

  if v_plan = 'premium' then
    update public.profiles
    set
      credits_remaining = greatest(coalesce(credits_remaining, 0) - 1, 0),
      credits = greatest(coalesce(credits, 0) - 1, 0)
    where id = auth.uid();
  end if;
end;
$$ language plpgsql security definer;
