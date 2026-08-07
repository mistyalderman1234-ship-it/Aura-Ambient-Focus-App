import prisma from '../prismaClient.js'
import { parseTokenFromCookie } from '../_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const payload = parseTokenFromCookie(req)
    if (!payload) return res.status(401).json({ error: 'unauth' })
    const userId = payload.sub
    const minutes = Number((await req.json())?.minutes) || 25
    const nowDate = new Date().toISOString().slice(0, 10)

    const existing = await prisma.userStats.findUnique({ where: { userId } })
    if (!existing) {
      await prisma.userStats.create({ data: { userId, focusSessions: 1, minutesFocused: minutes, completedDates: [nowDate], streakCount: 1 } })
    } else {
      await prisma.userStats.update({ where: { userId }, data: { focusSessions: { increment: 1 }, minutesFocused: { increment: minutes }, completedDates: { push: nowDate }, streakCount: { increment: 1 } } })
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('session-complete function error', err)
    return res.status(500).json({ error: 'session_record_failed' })
  }
}
