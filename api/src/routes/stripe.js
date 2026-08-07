import express from 'express'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-11-15' })
const router = express.Router()

router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub
    const { plan } = req.body
    const priceId = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY_ID : process.env.STRIPE_PRICE_MONTHLY_ID
    if (!priceId) return res.status(500).send({ error: 'stripe_price_not_configured' })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).send({ error: 'no_user' })
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name })
      customerId = customer.id
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?checkout=cancel`
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('create-checkout error', err)
    res.status(500).send({ error: 'checkout_failed' })
  }
})

router.post('/create-portal', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.stripeCustomerId) return res.status(400).send({ error: 'no_customer' })
    const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${process.env.FRONTEND_URL}/dashboard` })
    res.json({ url: session.url })
  } catch (err) {
    console.error('create-portal error', err)
    res.status(500).send({ error: 'portal_failed' })
  }
})

// Webhook endpoint: use raw body to verify signature
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = String(session.customer)
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (user) await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'ACTIVE', trialEndsAt: null } })
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const customerId = String(invoice.customer)
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (user) await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'ACTIVE' } })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = String(sub.customer)
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (user) await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'CANCELLED' } })
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = String(sub.customer)
        const status = sub.status
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (user) await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: status === 'active' ? 'ACTIVE' : 'CANCELLED' } })
        break
      }
      default:
        console.log('Unhandled stripe event', event.type)
    }
  } catch (err) {
    console.error('Error processing webhook', err)
  }

  res.json({ received: true })
})

export default router
