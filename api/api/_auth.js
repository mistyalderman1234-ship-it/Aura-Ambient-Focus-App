import jwt from 'jsonwebtoken'

export function parseTokenFromCookie(req) {
  const cookie = req.headers?.cookie
  if (!cookie) return null
  const token = cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('token='))
  if (!token) return null
  const value = token.split('=')[1]
  try {
    const payload = jwt.verify(decodeURIComponent(value), process.env.JWT_SECRET)
    return payload
  } catch (err) {
    return null
  }
}

export function requireAuth(req) {
  const payload = parseTokenFromCookie(req)
  if (!payload) throw new Error('unauth')
  return payload
}
