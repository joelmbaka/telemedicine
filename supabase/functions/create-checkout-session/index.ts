import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.6.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

console.log('Create Checkout Session function up and running!');

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const { appointment_id, amount_cents, success_url, cancel_url } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Doctor Appointment',
          },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: { appointment_id },
    });

    return new Response(JSON.stringify({ sessionUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
