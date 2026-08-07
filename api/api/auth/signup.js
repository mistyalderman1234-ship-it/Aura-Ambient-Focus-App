import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, email, password } = await req.json()
    if (!email || !password) return res.status(400).json({ error: 'missing' })
    const hashed = await bcrypt.hash(password, 12)
    const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    const user = await prisma.user.create({ data: { name, email, password: hashed, subscriptionStatus: 'TRIAL', trialEndsAt, stats: { create: {} } } })
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' })
    // set cookie
    const cookie = `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure; SameSite=Lax' : ''}`
    res.setHeader('Set-Cookie', cookie)
    return new Response(JSON.stringify({ ok: true, trialEndsAt }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('signup function error', err)
    if (err?.code === 'P2002') return res.status(409).json({ error: 'email_taken' })
    return res.status(500).json({ error: 'signup_failed' })
  }
}
