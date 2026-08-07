import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ error: 'unauth' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { sub: payload.sub, email: payload.email }
    next()
  } catch (e) {
    console.error('auth middleware error', e)
    res.clearCookie('token')
    return res.status(401).send({ error: 'unauth' })
  }
}
