import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth.js'
import stripeRoutes from './routes/stripe.js'
import statsRoutes from './routes/stats.js'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 4000

// Use express.json for normal JSON endpoints
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/stats', statsRoutes)
// Stripe route mounts router that uses express.raw for webhook to avoid signature issues
app.use('/api/stripe', stripeRoutes)

app.get('/api/profile', async (req, res) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ error: 'unauth' })
  try {
    const jwt = await import('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, subscriptionStatus: true, stripeCustomerId: true, createdAt: true, trialEndsAt: true }
    })
    if (!user) return res.status(404).send({ error: 'no_user' })
    res.json(user)
  } catch (err) {
    console.error('profile error', err)
    res.clearCookie('token')
    return res.status(401).send({ error: 'invalid' })
  }
})

app.get('/', (req, res) => res.send({ ok: true, message: 'Aura API' }))

app.listen(PORT, () => console.log(`API running on ${PORT}`))
