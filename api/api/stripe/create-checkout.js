import Stripe from 'stripe'
import prisma from '../../prismaClient.js'
import { parseTokenFromCookie } from '../../_auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-11-15' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const payload = parseTokenFromCookie(req)
    if (!payload) return res.status(401).json({ error: 'unauth' })
    const userId = payload.sub
    const { plan } = await req.json()
    const priceId = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY_ID : process.env.STRIPE_PRICE_MONTHLY_ID
    if (!priceId) return res.status(500).json({ error: 'stripe_price_not_configured' })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'no_user' })
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name })
      customerId = customer.id
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
    }
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', payment_method_types: ['card'], line_items: [{ price: priceId, quantity: 1 }], customer: customerId, success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`, cancel_url: `${process.env.FRONTEND_URL}/dashboard?checkout=cancel` })
    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('create-checkout function error', err)
    return res.status(500).json({ error: 'checkout_failed' })
  }
}
