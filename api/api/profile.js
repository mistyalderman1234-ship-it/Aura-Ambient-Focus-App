import prisma from './prismaClient.js'
import { parseTokenFromCookie } from './_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const payload = parseTokenFromCookie(req)
    if (!payload) return res.status(401).json({ error: 'unauth' })
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        createdAt: true,
        trialEndsAt: true,
      },
    })
    if (!user) return res.status(404).json({ error: 'no_user' })
    res.status(200).json(user)
  } catch (err) {
    console.error('profile function error', err)
    return res.status(500).json({ error: 'profile_failed' })
  }
}
