-- Annulation abonnement : crédits à zéro + génération réservée aux abonnées actives

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
  set credits = 0
  where id = p_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.use_credit(
  p_shape text,
  p_style text,
  p_length text,
  p_original_image_url text default null
)
returns json as $$
declare
  v_credits integer;
  v_has_sub boolean;
  v_viz public.visualizations;
begin
  select credits into v_credits from public.profiles where id = auth.uid();

  select exists(
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and status = 'active'
      and current_period_end > now()
  ) into v_has_sub;

  if not v_has_sub then
    raise exception 'Active subscription required';
  end if;

  if v_credits > 0 then
    update public.profiles
    set credits = credits - 1
    where id = auth.uid();
  end if;

  insert into public.visualizations (user_id, original_image_url, shape, style, length, status)
  values (auth.uid(), p_original_image_url, p_shape, p_style, p_length, 'pending')
  returning * into v_viz;

  return json_build_object(
    'visualization_id', v_viz.id,
    'credits_remaining', greatest(v_credits - 1, 0),
    'is_subscribed', true
  );
end;
$$ language plpgsql security definer;
