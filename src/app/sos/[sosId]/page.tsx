'use client'
// src/app/sos/[sosId]/page.tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PetSprite from '@/components/game/PetSprite'

interface SOSData {
  id: string
  pet: any
  owner_name: string
  helper_count: number
  status: string
}

export default function SOSPage({ params }: { params: { sosId: string } }) {
  const [sos, setSos] = useState<SOSData | null>(null)
  const [helped, setHelped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    fetch(`/api/crisis/sos/${params.sosId}`)
      .then(r => r.json())
      .then(d => { setSos(d.sos); setCount(d.sos?.helper_count || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.sosId])

  const handleHelp = async () => {
    if (helped) return
    // Use a guest helper ID (telegram ID if available, else random)
    const helperId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || 'guest_' + Date.now()

    const res = await fetch(`/api/crisis/sos/${params.sosId}/help`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helperId }),
    })
    const data = await res.json()
    if (res.ok) {
      setHelped(true)
      setCount(data.count)
      if (data.resolved) setResolved(true)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-gold animate-pulse font-display">Loading spirit...</div>
    </div>
  )

  if (!sos) return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 text-center">
      <div>
        <div className="text-4xl mb-3">🔮</div>
        <div className="font-display text-paper text-lg">SOS Not Found</div>
        <div className="text-smoke text-sm mt-2">This curse may have already been resolved.</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="bg-hex-grid absolute inset-0 opacity-20" />
      
      <div className="relative w-full max-w-sm">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl mb-4"
        >
          ☠️
        </motion.div>

        <h1 className="font-display text-vermil-light text-2xl font-bold mb-1">SOS! 三災 Curse!</h1>
        <p className="text-smoke text-sm mb-5">
          <strong className="text-paper">{sos.owner_name}</strong>'s spirit needs your help!
        </p>

        {sos.pet && (
          <div className="flex justify-center mb-5">
            <PetSprite
              seed={sos.pet.sprite_seed}
              rarity={sos.pet.rarity}
              element={sos.pet.element}
              status="cursed"
              size={96}
            />
          </div>
        )}

        <div className="font-display text-paper text-4xl mb-2">{count}/15</div>
        <div className="w-full h-2 bg-ink-50 rounded-full mb-6 overflow-hidden">
          <motion.div
            animate={{ width: `${(count / 15) * 100}%` }}
            transition={{ type: 'spring' }}
            className="h-full bg-jade rounded-full"
          />
        </div>

        {resolved || sos.status === 'resolved' ? (
          <div className="card-ritual p-4 text-center">
            <div className="text-3xl mb-2">✨</div>
            <div className="font-display text-jade-light text-lg">Curse Lifted!</div>
            <div className="text-smoke text-sm mt-1">The spirit is free. Thank you!</div>
          </div>
        ) : helped ? (
          <div className="card-ritual p-4 text-center">
            <div className="text-3xl mb-2">🙏</div>
            <div className="font-display text-gold text-lg">You helped!</div>
            <div className="text-smoke text-sm mt-1">{15 - count} more helpers needed</div>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleHelp}
            className="w-full py-4 rounded-2xl bg-vermil text-paper font-display text-lg
                       border border-vermil-light/50"
            style={{ boxShadow: '0 0 30px rgba(192,57,43,0.4)' }}
          >
            🤲 Pet to Help! (tap)
          </motion.button>
        )}

        <p className="text-smoke/50 text-xs mt-4">
          Open in Telegram to play Spirit Tamagotchi yourself →
        </p>
      </div>
    </div>
  )
}
