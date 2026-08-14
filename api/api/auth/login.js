import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { email, password } = await req.json()
    if (!email || !password) return res.status(400).json({ error: 'missing' })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return res.status(401).json({ error: 'invalid' })
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'invalid' })
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    )
    const cookie =
      `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure; SameSite=Lax' : ''}`
    res.setHeader('Set-Cookie', cookie)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('login function error', err)
    return res.status(500).json({ error: 'login_failed' })
  }
}
