'use client'
// src/components/game/CrisisModal.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { useAppStore } from '@/lib/store'
import { Pet } from '@/types'
import toast from 'react-hot-toast'
import { toNano } from '@ton/core'

interface Props { pet: Pet; onClose: () => void }

const TALISMAN_PRICE_TON = 0.5

export default function CrisisModal({ pet, onClose }: Props) {
  const { user, updatePet } = useAppStore()
  const [tonConnectUI] = useTonConnectUI()
  const [isResolving, setIsResolving] = useState(false)
  const [sosCreated, setSosCreated] = useState(false)
  const [sosId, setSosId] = useState<string | null>(null)
  const [sosCount, setSosCount] = useState(0)
  const [tab, setTab] = useState<'pay' | 'sos'>('pay')

  const handleTalismanPurchase = async () => {
    if (!user || isResolving) return
    setIsResolving(true)
    try {
      // Send TON transaction
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: process.env.NEXT_PUBLIC_TREASURY_ADDRESS!,
          amount: toNano(TALISMAN_PRICE_TON).toString(),
          payload: btoa(`talisman:${pet.id}:${user.id}`),
        }],
      })

      // Resolve crisis on server
      const res = await fetch('/api/crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          petId: pet.id,
          method: 'talisman',
          txHash: result.boc,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      updatePet(pet.id, { status: 'alive', crisis_type: null })
      toast.success('🔮 Crisis resolved! Mining resumed.')
      onClose()
    } catch (err: any) {
      if (err.message?.includes('Reject')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error(err.message || 'Failed to resolve crisis')
      }
    } finally {
      setIsResolving(false)
    }
  }

  const handleCreateSOS = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/crisis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, petId: pet.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSosId(data.sos.id)
      setSosCreated(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create SOS')
    }
  }

  const shareLink = sosId
    ? `https://t.me/share/url?url=${process.env.NEXT_PUBLIC_APP_URL}/sos/${sosId}&text=My spirit is cursed! Please tap 15 times to save it! 🙏`
    : ''

  const handleShare = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      (window.Telegram.WebApp as any).openTelegramLink(shareLink)
    } else {
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/sos/${sosId}`)
      toast.success('Link copied!')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink/90 backdrop-blur-sm z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full bg-ink-50 rounded-t-3xl border-t border-gold/20 px-5 pt-5 pb-8 safe-bottom"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-smoke/30 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="text-center mb-5">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-4xl mb-2"
          >
            {pet.crisis_type === 'sal' ? '☠️' : '⚠️'}
          </motion.div>
          <h3 className="font-display text-vermil-light text-xl font-bold">
            {pet.crisis_type === 'sal' ? '煞 Curse Detected' : '三災 Triple Calamity'}
          </h3>
          <p className="text-smoke text-sm mt-1">
            <strong className="text-paper">{pet.name}</strong> has stopped mining.
            Resolve the crisis to resume.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'pay', label: '💎 Pay to Cleanse' },
            { id: 'sos', label: '🙏 Call Friends' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 py-2 rounded-xl text-sm font-display transition-all
                ${tab === t.id ? 'bg-vermil/20 border border-vermil/50 text-vermil-light' : 'bg-smoke/10 text-smoke border border-transparent'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'pay' && (
          <div className="space-y-3">
            <div className="card-ritual p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-smoke">Cost</span>
                <span className="text-gold font-mono">{TALISMAN_PRICE_TON} TON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoke">Mining boost</span>
                <span className="text-jade-light">+10% for 24h</span>
              </div>
            </div>
            <button
              onClick={handleTalismanPurchase}
              disabled={isResolving}
              className="btn-ritual w-full"
            >
              {isResolving ? 'Processing...' : `Buy 符籍 Talisman (${TALISMAN_PRICE_TON} TON)`}
            </button>
          </div>
        )}

        {tab === 'sos' && (
          <div className="space-y-3">
            {!sosCreated ? (
              <>
                <div className="card-ritual p-4 text-sm text-smoke">
                  Share a link. Get <strong className="text-paper">15 friends</strong> to tap your pet. Crisis resolved for free!
                </div>
                <button onClick={handleCreateSOS} className="btn-ghost w-full">
                  Generate SOS Link 求助
                </button>
              </>
            ) : (
              <>
                <div className="card-ritual p-4">
                  <div className="text-center mb-3">
                    <div className="text-2xl font-display text-gold">{sosCount}/15</div>
                    <div className="text-smoke text-xs">helpers needed</div>
                  </div>
                  <div className="stat-bar-bg mb-3">
                    <div
                      className="stat-bar-fill bg-jade"
                      style={{ width: `${(sosCount / 15) * 100}%` }}
                    />
                  </div>
                </div>
                <button onClick={handleShare} className="btn-ritual w-full">
                  📤 Share SOS Link
                </button>
                <p className="text-smoke/60 text-xs text-center">
                  Link: {process.env.NEXT_PUBLIC_APP_URL}/sos/{sosId?.slice(0, 8)}...
                </p>
              </>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-3 py-2 text-smoke text-sm">
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
