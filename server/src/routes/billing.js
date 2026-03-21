const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// POST /api/billing/checkout — create Stripe Checkout session
router.post('/checkout', async (req, res, next) => {
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const { plan } = req.body;
    const PLAN_TO_PRICE = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ANNUAL,
    };
    const priceId = PLAN_TO_PRICE[plan];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "annual".' });
    }

    // Compute remaining trial days for Stripe trial_period_days
    let trialDays = undefined;
    if (dbUser.subscriptionStatus === 'trialing' && dbUser.trialEndsAt) {
      const remaining = Math.ceil((dbUser.trialEndsAt.getTime() - Date.now()) / 86400000);
      trialDays = Math.max(0, remaining);
      if (trialDays === 0) trialDays = undefined; // expired trial = no Stripe trial
    }

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/parent?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/parent?checkout=cancel`,
      metadata: { userId: dbUser.id },
    };

    // Use existing Stripe customer if available, otherwise customer_email
    if (dbUser.stripeCustomerId) {
      sessionParams.customer = dbUser.stripeCustomerId;
    } else {
      sessionParams.customer_email = dbUser.email;
    }

    // Add trial period if parent is still in trial
    if (trialDays && trialDays > 0) {
      sessionParams.subscription_data = { trial_period_days: trialDays };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/portal — create Stripe Customer Portal session
router.get('/portal', async (req, res, next) => {
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    if (!dbUser.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found — subscribe first' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/parent`,
    });
    res.json({ url: portalSession.url });
  } catch (err) {
    next(err);
  }
});

// Standalone webhook handler — receives raw body, NOT express.json()
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[billing] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'active',
              trialEndsAt: null,
            },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionEnd: sub.ended_at ? new Date(sub.ended_at * 1000) : new Date(),
          },
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await prisma.user.updateMany({
          where: { stripeCustomerId: invoice.customer },
          data: { subscriptionStatus: 'past_due' },
        });
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[billing] Webhook processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = router;
module.exports.router = router;
module.exports.webhookHandler = webhookHandler;
module.exports.stripe = stripe; // exposed for testing
