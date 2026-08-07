import React, { useEffect, useState } from 'react'
import Timer from '../components/Timer'
import SoundMixer from '../components/SoundMixer'
import API from '../lib/api'

function formatDateRemaining(ms) {
  if (!ms || ms <= 0) return 'Expired'
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return `${days}d ${hours}h`
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    API.get('/api/profile')
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const trialRemaining = profile?.trialEndsAt ? new Date(profile.trialEndsAt).getTime() - Date.now() : null

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 glass p-6">
            <h2 className="font-semibold">Welcome {profile?.name || 'Friend'}</h2>
            <p className="text-sm text-slate-300 mt-1">Current plan: {profile?.subscriptionStatus || 'FREE'}</p>
            {profile?.subscriptionStatus === 'TRIAL' && (
              <div className="mt-2 text-sm text-amber-200">Trial remaining: {formatDateRemaining(trialRemaining)}</div>
            )}
            <div className="mt-6">
              <Timer />
            </div>
          </div>
          <div className="w-full md:w-96 glass p-6">
            <h3 className="font-semibold">Ambient Mixer</h3>
            <SoundMixer />
          </div>
        </div>
      </div>
    </div>
  )
}
