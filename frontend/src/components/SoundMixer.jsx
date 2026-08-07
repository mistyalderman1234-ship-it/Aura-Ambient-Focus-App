import React, { useEffect, useRef, useState } from 'react'

const SOUNDS = [
  { id: 'rain', label: 'Rain', src: '/sounds/rain.mp3', premium: false },
  { id: 'ocean', label: 'Ocean', src: '/sounds/ocean.mp3', premium: false },
  { id: 'forest', label: 'Forest', src: '/sounds/forest.mp3', premium: true },
  { id: 'white', label: 'White Noise', src: '/sounds/white.mp3', premium: false },
  { id: 'tone', label: 'Meditation Tone', src: '/sounds/tone.mp3', premium: true }
]

export default function SoundMixer() {
  const [state, setState] = useState(() => SOUNDS.reduce((acc, s) => { acc[s.id] = { on: false, vol: 0.7 }; return acc }, {}))
  const refs = useRef({})
  const [userGestureRequired, setUserGestureRequired] = useState(false)

  useEffect(() => {
    // Clean up on unmount
    return () => {
      Object.values(refs.current).forEach(a => a.pause())
    }
  }, [])

  function ensureAudio(id, src) {
    if (!refs.current[id]) {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = state[id].vol
      refs.current[id] = audio
    }
    return refs.current[id]
  }

  function toggle(id, premium = false) {
    if (premium) {
      alert('Premium sound — upgrade to unlock')
      return
    }
    setState(s => {
      const next = { ...s, [id]: { ...s[id], on: !s[id].on } }
      if (next[id].on) {
        const audio = ensureAudio(id, SOUNDS.find(x => x.id === id).src)
        audio.play().catch(() => {
          // Browser blocked autoplay; prompt user to interact
          setUserGestureRequired(true)
        })
      } else {
        if (refs.current[id]) refs.current[id].pause()
      }
      return next
    })
  }

  function setVol(id, v) {
    setState(s => ({ ...s, [id]: { ...s[id], vol: v } }))
    if (refs.current[id]) refs.current[id].volume = v
  }

  function enableAudioContext() {
    // create a short user gesture to allow audio playback in mobile browsers
    Object.keys(state).forEach(id => {
      const s = state[id]
      if (s.on) {
        const a = ensureAudio(id, SOUNDS.find(x => x.id === id).src)
        a.play().catch(() => {})
      }
    })
    setUserGestureRequired(false)
  }

  return (
    <div className="space-y-3">
      {userGestureRequired && (
        <div className="mb-2">
          <button onClick={enableAudioContext} className="px-3 py-2 rounded button-primary">Enable sound</button>
        </div>
      )}
      {SOUNDS.map(s => (
        <div className="flex items-center gap-3" key={s.id}>
          <button aria-label={`${s.label} play`} onClick={() => toggle(s.id, s.premium)} className={`w-10 h-10 rounded ${s.premium ? 'bg-amber-600/20' : 'bg-white/5'}`}>
            {state[s.id].on ? '▌▌' : '▶'}
          </button>
          <div className="flex-1">
            <div className="flex justify-between">
              <div>{s.label}{s.premium && <span className="ml-2 text-xs text-amber-300">Premium</span>}</div>
              <div className="text-sm text-slate-400">{Math.round((state[s.id]?.vol ?? 0.7) * 100)}%</div>
            </div>
            <input aria-label={`${s.label} volume`} type="range" min={0} max={1} step={0.01} value={state[s.id].vol} onChange={e => setVol(s.id, Number(e.target.value))} />
          </div>
        </div>
      ))}
    </div>
  )
}
