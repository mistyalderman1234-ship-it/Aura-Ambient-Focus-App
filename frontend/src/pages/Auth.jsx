import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../lib/api'

export default function Auth() {
  const { mode } = useParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const payload = mode === 'signup' ? { name, email, password } : { email, password }
      const res = await API.post(url, payload)
      navigate('/dashboard')
    } catch (err) {
      setError(err.userMessage || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md glass p-6" aria-labelledby="auth-heading">
        <h2 id="auth-heading" className="text-xl font-semibold mb-4">{mode === 'signup' ? 'Create account' : 'Login'}</h2>
        {mode === 'signup' && (
          <label className="block mb-2">
            <span className="text-sm text-slate-300">Name</span>
            <input aria-label="Name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 mb-3 rounded bg-transparent border" />
          </label>
        )}
        <label className="block mb-2">
          <span className="text-sm text-slate-300">Email</span>
          <input aria-label="Email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mb-3 rounded bg-transparent border" />
        </label>
        <label className="block mb-2">
          <span className="text-sm text-slate-300">Password</span>
          <input aria-label="Password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full p-2 mb-4 rounded bg-transparent border" />
        </label>
        {error && <div role="alert" className="text-rose-400 mb-3">{error}</div>}
        <button aria-label="Continue" disabled={loading} className="w-full py-2 rounded button-primary">
          {loading ? 'Please wait...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
