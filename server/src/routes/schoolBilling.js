const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');
const { isSchoolLicensed } = require('../lib/schoolUtils');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Tier-based pricing: school admin picks a tier, server resolves to Stripe Price ID
const TIER_TO_PRICE = {
  tier_1: process.env.STRIPE_PRICE_SCHOOL_TIER_1,  // up to 5 teachers
  tier_2: process.env.STRIPE_PRICE_SCHOOL_TIER_2,  // up to 15 teachers
  tier_3: process.env.STRIPE_PRICE_SCHOOL_TIER_3,  // up to 50 teachers
};

const TIER_TO_SEATS = { tier_1: 5, tier_2: 15, tier_3: 50 };

// Helper: get school where current user is admin
async function requireSchoolAdmin(req, res) {
  if (req.user.type === 'kid') {
    res.status(403).json({ error: 'School admin access required' });
    return null;
  }
  const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
  if (!dbUser) { res.status(404).json({ error: 'User not found' }); return null; }
  const membership = await prisma.schoolTeacher.findUnique({
    where: { userId: dbUser.id },
    include: { school: true },
  });
  if (!membership || membership.role !== 'admin') {
    res.status(403).json({ error: 'School admin access required' });
    return null;
  }
  return { user: dbUser, school: membership.school };
}

// POST /api/billing/school-checkout — create Stripe Checkout for school license
router.post('/school-checkout', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;
    const { school, user } = ctx;

    const { plan } = req.body; // tier_1 | tier_2 | tier_3
    const priceId = TIER_TO_PRICE[plan];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan. Must be "tier_1", "tier_2", or "tier_3".' });
    }

    const seatCount = TIER_TO_SEATS[plan];

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/school?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/school?checkout=cancel`,
      metadata: { schoolId: school.id, seatCount: String(seatCount) },
    };

    if (school.stripeCustomerId) {
      sessionParams.customer = school.stripeCustomerId;
    } else {
      sessionParams.customer_email = school.contactEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/school-status — license state + seats used
router.get('/school-status', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;
    const { school } = ctx;

    const seatsUsed = await prisma.schoolTeacher.count({ where: { schoolId: school.id } });

    res.json({
      id: school.id,
      name: school.name,
      licenseStatus: school.licenseStatus,
      licenseExpiry: school.licenseExpiry,
      seatCount: school.seatCount,
      seatsUsed,
      isLicensed: isSchoolLicensed(school),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/school-invoices — Stripe invoice list for school
router.get('/school-invoices', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;
    const { school } = ctx;

    if (!school.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    const stripeInvoices = await stripe.invoices.list({
      customer: school.stripeCustomerId,
      limit: 24,
    });

    const invoices = stripeInvoices.data.map(inv => ({
      id: inv.id,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      invoicePdf: inv.invoice_pdf,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      created: inv.created,
    }));

    res.json({ invoices });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.router = router;
module.exports.stripe = stripe;
