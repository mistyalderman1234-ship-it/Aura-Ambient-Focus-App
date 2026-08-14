import Stripe from 'stripe'
import prisma from '../../prismaClient.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-11-15',
})

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const sig = req.headers['stripe-signature']
  let event
  try {
    const buf = await getRawBody(req)
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = String(session.customer)
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'ACTIVE', trialEndsAt: null },
          })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const customerId = String(invoice.customer)
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'ACTIVE' },
          })
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = String(sub.customer)
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'CANCELLED' },
          })
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = String(sub.customer)
        const status = sub.status
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus:
                status === 'active' ? 'ACTIVE' : 'CANCELLED',
            },
          })
        }
        break
      }
      default:
        console.log('Unhandled stripe event', event.type)
    }
  } catch (err) {
    console.error('Error processing webhook', err)
  }

  res.status(200).json({ received: true })
}
