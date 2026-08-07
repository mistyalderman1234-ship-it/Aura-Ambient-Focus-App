import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const router = express.Router()

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!email || !password) return res.status(400).send({ error: 'missing' })
  try {
    const hashed = await bcrypt.hash(password, 12)
    const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        stats: { create: {} }
      }
    })
    const token = createToken(user)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    res.status(201).json({ ok: true, trialEndsAt })
  } catch (err) {
    console.error('signup error', err)
    if (err?.code === 'P2002') return res.status(409).send({ error: 'email_taken' })
    res.status(500).send({ error: 'signup_failed' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).send({ error: 'missing' })
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return res.status(401).send({ error: 'invalid' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).send({ error: 'invalid' })
    const token = createToken(user)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('login error', err)
    res.status(500).send({ error: 'login_failed' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ ok: true })
})

export default router
