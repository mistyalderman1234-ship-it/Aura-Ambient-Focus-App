export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  // Clear cookie
  const cookie = `token=; HttpOnly; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure; SameSite=Lax' : ''}`
  res.setHeader('Set-Cookie', cookie)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
