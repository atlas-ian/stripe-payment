const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './transactions.db',
  logging: false
});

const Transaction = require('./models/Transaction')(sequelize);

// Middleware
app.use(cors());
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());

// Initialize database
sequelize.sync({ force: false }).then(() => {
  console.log('Database synchronized');
});

// Routes
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      try {
        await Transaction.create({
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: 'succeeded'
        });
        console.log('Transaction recorded in database');
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
      break;
    
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get transactions (for debugging)
app.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Webhook endpoint: /webhook');
});
