import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.6.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

if (!webhookSecret) {
  console.error('❌ STRIPE_WEBHOOK_SECRET is missing from environment variables');
  throw new Error('Webhook secret not configured');
}

console.log('Payment Webhook function up and running!');

serve(async (req) => {
  try {
    console.log('Starting webhook processing');
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Stripe signature missing');
      return new Response('Stripe signature missing', { status: 400 });
    }

    const body = await req.text();
    console.log(`Received webhook body: ${body}`);

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 401 });
    }

    console.log(`Stripe event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const appointmentId = session.metadata.appointment_id;
        
        // Update appointment status
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        const { error } = await supabaseClient
          .from('appointments')
          .update({ 
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent
          })
          .eq('id', appointmentId);

        if (error) throw error;
        
        // Record payment
        await supabaseClient
          .from('payments')
          .insert({
            related_table: 'appointments',
            related_id: appointmentId,
            amount_cents: session.amount_total,
            stripe_payment_intent_id: session.payment_intent,
            status: 'succeeded',
            paid_at: new Date().toISOString()
          });
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
