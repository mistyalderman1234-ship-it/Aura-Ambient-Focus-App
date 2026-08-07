import express from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
const prisma = new PrismaClient()
const router = express.Router()

// Record a completed session
router.post('/session-complete', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub
    const minutes = Number(req.body?.minutes) || 25
    const nowDate = new Date().toISOString().slice(0, 10)

    const existing = await prisma.userStats.findUnique({ where: { userId } })
    if (!existing) {
      await prisma.userStats.create({ data: { userId, focusSessions: 1, minutesFocused: minutes, completedDates: [nowDate], streakCount: 1 } })
    } else {
      const updated = await prisma.userStats.update({
        where: { userId },
        data: {
          focusSessions: { increment: 1 },
          minutesFocused: { increment: minutes },
          completedDates: { push: nowDate },
          streakCount: { increment: 1 }
        }
      })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('session-complete error', err)
    res.status(500).send({ error: 'session_record_failed' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub
    const stats = await prisma.userStats.findUnique({ where: { userId } })
    res.json({ stats })
  } catch (err) {
    console.error('stats me error', err)
    res.status(500).send({ error: 'stats_failed' })
  }
})

export default router
