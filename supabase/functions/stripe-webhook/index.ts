import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const SUBSCRIPTION_IDS = new Set(['sub_premium', 'sub_exclusif_ia'])

function resolvePackId(metadata?: Stripe.Metadata | null): string | null {
  const packId = metadata?.packId
  return packId && SUBSCRIPTION_IDS.has(packId) ? packId : null
}

async function resolveUserId(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const fromMeta = subscription.metadata?.userId
  if (fromMeta) return fromMeta

  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  return data?.user_id ?? null
}

async function isEventProcessed(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('stripe_processed_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle()
  return !!data
}

async function markEventProcessed(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  eventType: string,
  userId?: string | null,
) {
  await supabase.from('stripe_processed_events').insert({
    id: eventId,
    event_type: eventType,
    user_id: userId ?? null,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-04-10',
  })

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (await isEventProcessed(supabase, event.id)) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode !== 'subscription') {
      return new Response(JSON.stringify({ received: true, skipped: 'not_subscription' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return new Response(JSON.stringify({ received: true, skipped: 'unpaid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = session.client_reference_id ?? session.metadata?.userId
    const packId = session.metadata?.packId

    if (!userId || !packId) {
      console.error('Missing userId or packId in session metadata', session.id)
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SUBSCRIPTION_IDS.has(packId)) {
      console.error('Unknown plan:', packId)
      return new Response(JSON.stringify({ error: `Unknown plan: ${packId}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

    const periodEnd = stripeSubscriptionId
      ? (await stripe.subscriptions.retrieve(stripeSubscriptionId)).current_period_end
      : null

    const { error } = await supabase.rpc('activate_subscription_for_user', {
      p_user_id: userId,
      p_stripe_subscription_id: stripeSubscriptionId ?? null,
      p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      p_plan: packId,
    })
    if (error) {
      console.error('activate_subscription_for_user error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountEur = session.amount_total
      ? session.amount_total / 100
      : (packId === 'sub_exclusif_ia' ? 14.99 : 9.99)

    await supabase.from('payment_events').insert({
      user_id: userId,
      stripe_event_id: event.id,
      event_type: 'checkout.session.completed',
      amount_eur: amountEur,
      plan: packId,
      stripe_subscription_id: stripeSubscriptionId ?? null,
    })

    await markEventProcessed(supabase, event.id, event.type, userId)
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice

    // Premier paiement déjà géré par checkout.session.completed
    if (invoice.billing_reason !== 'subscription_cycle') {
      return new Response(JSON.stringify({ received: true, skipped: invoice.billing_reason }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (!subscriptionId) {
      return new Response(JSON.stringify({ received: true, skipped: 'no_subscription' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = await resolveUserId(supabase, subscription)

    if (!userId) {
      console.error('No user for subscription renewal', subscriptionId)
      return new Response(JSON.stringify({ error: 'User not found for renewal' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const packId = resolvePackId(subscription.metadata)

    const { error } = await supabase.rpc('renew_subscription_for_user', {
      p_user_id: userId,
      p_stripe_subscription_id: subscriptionId,
      p_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      p_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      p_plan: packId,
    })

    if (error) {
      console.error('renew_subscription_for_user error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountEur = invoice.amount_paid ? invoice.amount_paid / 100 : 0
    await supabase.from('payment_events').insert({
      user_id: userId,
      stripe_event_id: event.id,
      event_type: 'invoice.payment_succeeded',
      amount_eur: amountEur,
      plan: packId,
      stripe_subscription_id: subscriptionId,
    })

    await markEventProcessed(supabase, event.id, event.type, userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
      || await resolveUserId(supabase, subscription)
    if (userId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
        .eq('stripe_subscription_id', subscription.id)
      await supabase.from('subscription_cancellations').insert({
        user_id: userId,
        excluded_from_churn: false,
        canceled_by: 'stripe',
      })
      await markEventProcessed(supabase, event.id, event.type, userId)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
