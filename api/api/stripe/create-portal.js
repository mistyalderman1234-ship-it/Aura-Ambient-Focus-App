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
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.stripeCustomerId) return res.status(400).json({ error: 'no_customer' })
    const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${process.env.FRONTEND_URL}/dashboard` })
    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('create-portal function error', err)
    return res.status(500).json({ error: 'portal_failed' })
  }
}
