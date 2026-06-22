import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const SUBSCRIPTION_IDS = new Set(['sub_premium', 'sub_exclusif_ia'])

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid' && session.mode !== 'subscription') {
      return new Response(JSON.stringify({ received: true }), {
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
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
    if (userId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
        .eq('stripe_subscription_id', subscription.id)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
