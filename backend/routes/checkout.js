const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

/**
 * POST /api/v1/checkout/create-session
 * Create Stripe checkout session
 */
router.post('/create-session', async (req, res) => {
  try {
    const { productId, email, name, language = 'ru' } = req.body;

    if (!productId || !email || !name) {
      return res.status(400).json({
        error: 'productId, email, and name are required'
      });
    }

    const { db } = require('../index');
    const connection = await db.getConnection();

    // Get product details
    const query = 'SELECT id, name_en, price_usd FROM products WHERE id = ? AND status = "active"';
    const [products] = await connection.query(query, [productId]);
    connection.release();

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    const successUrl = process.env.APP_URL + '/success?session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = process.env.APP_URL + '/cancel';

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name_en || 'BizBox Product',
              description: `Ready-made business solution`
            },
            unit_amount: product.price_usd * 100
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      client_reference_id: `${productId}-${email}-${Date.now()}`,
      metadata: {
        productId,
        email,
        name,
        language
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (err) {
    console.error('❌ Checkout Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/checkout/webhook
 * Stripe webhook handler
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.warn('⚠️  Stripe webhook secret not configured');
      return res.sendStatus(200);
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { db } = require('../index');

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const connection = await db.getConnection();

      // Insert customer record
      const customerQuery = `
        INSERT INTO customers (
          email, name, product_id, product_name,
          price_paid, currency, payment_date,
          stripe_customer_id, stripe_payment_id,
          status, onboarding_status, language
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'active', 'started', ?)
      `;

      await connection.query(customerQuery, [
        session.customer_email,
        session.metadata?.name || session.customer_email,
        session.metadata?.productId || null,
        'BizBox Product',
        (session.amount_total / 100),
        session.currency,
        session.customer,
        session.id,
        'active',
        session.metadata?.language || 'ru'
      ]);

      connection.release();

      console.log(`✅ Payment received from ${session.customer_email}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/checkout/session/:sessionId
 * Get checkout session details
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: true,
      status: session.payment_status,
      customer: session.customer_email,
      amount: session.amount_total / 100,
      currency: session.currency
    });
  } catch (err) {
    console.error('❌ Session Retrieval Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
