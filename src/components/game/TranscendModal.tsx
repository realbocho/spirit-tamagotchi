'use client'
// src/components/game/TranscendModal.tsx
// 薦度齋 — voluntary pet transcendence ritual → karma points
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pet } from '@/types'
import PetSprite from './PetSprite'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface Props {
  pets: Pet[]
  onClose: () => void
  onTranscended: (petId: string, karma: number) => void
}

const KARMA_PREVIEW: Record<string, number> = {
  common: 10, blessed: 30, mudang: 80, grand_mudang: 200,
}
const RARITY_COLOR: Record<string, string> = {
  common: 'text-smoke', blessed: 'text-jade', mudang: 'text-vermil', grand_mudang: 'text-gold',
}
const RARITY_NAME: Record<string, string> = {
  common: '凡 Common', blessed: '福 Blessed', mudang: '巫 Mudang', grand_mudang: '大巫 Grand',
}

export default function TranscendModal({ pets, onClose, onTranscended }: Props) {
  const { user, setUser, updatePet } = useAppStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [phase, setPhase] = useState<'select' | 'confirm' | 'ritual' | 'done'>('select')
  const [earnedKarma, setEarnedKarma] = useState(0)

  const eligiblePets = pets.filter(p => p.status !== 'transcended' && p.status !== 'dead')
  const pet = eligiblePets.find(p => p.id === selected)

  const karmaPreview = pet
    ? Math.floor((KARMA_PREVIEW[pet.rarity] || 10) * (1 + (pet.current_level - 1) * 0.1))
    : 0

  async function handleTranscend() {
    if (!user || !pet) return
    setPhase('ritual')

    try {
      const res = await fetch('/api/pets/transcend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, petId: pet.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setEarnedKarma(data.karma)

      // Update store
      updatePet(pet.id, { status: 'transcended' })
      setUser({ ...user, karma_points: (user.karma_points || 0) + data.karma })

      await new Promise(r => setTimeout(r, 2200)) // ritual animation
      setPhase('done')
      onTranscended(pet.id, data.karma)
    } catch (err: any) {
      toast.error(err.message || 'Ritual failed')
      setPhase('confirm')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/85 backdrop-blur-sm z-50 flex items-end justify-center"
        onClick={phase === 'select' || phase === 'confirm' ? onClose : undefined}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="w-full max-w-sm bg-ink-50 rounded-t-2xl border-t border-gold/20 pb-10"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-smoke/30 rounded-full mx-auto mt-4 mb-5" />

          {/* ── PHASE: SELECT ── */}
          {phase === 'select' && (
            <div className="px-5">
              <div className="text-center mb-5">
                <div className="font-cjk text-gold/50 text-xs tracking-widest mb-1">薦度齋</div>
                <h2 className="font-display text-paper text-xl">Spirit Transcendence</h2>
                <p className="text-smoke/60 text-xs mt-1">
                  Release your spirit to the heavens. Earn Karma → better egg odds.
                </p>
              </div>

              {/* Karma odds table */}
              <div className="bg-ink rounded-xl p-3 mb-4 grid grid-cols-4 gap-2 text-center text-xs">
                {Object.entries(KARMA_PREVIEW).map(([r, k]) => (
                  <div key={r}>
                    <div className={`font-cjk ${RARITY_COLOR[r]}`}>{RARITY_NAME[r].split(' ')[0]}</div>
                    <div className="text-gold font-mono mt-0.5">+{k}</div>
                  </div>
                ))}
                <div className="col-span-4 text-smoke/40 text-xs mt-1 border-t border-smoke/10 pt-1">
                  Karma boosts gacha rare rates. 10 Karma = +1% chance.
                </div>
              </div>

              {eligiblePets.length === 0 ? (
                <div className="text-center py-6 text-smoke/60 text-sm">No spirits available to transcend.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {eligiblePets.map(p => {
                    const k = Math.floor((KARMA_PREVIEW[p.rarity] || 10) * (1 + (p.current_level - 1) * 0.1))
                    const daysLeft = Math.max(0, Math.ceil(
                      (new Date(p.dies_at).getTime() - Date.now()) / 86400000
                    ))
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelected(p.id); setPhase('confirm') }}
                        className={`w-full card-ritual rarity-${p.rarity} p-3 flex items-center gap-3 text-left`}
                      >
                        <PetSprite seed={p.sprite_seed} element={p.element} rarity={p.rarity} size={44} animate={false} />
                        <div className="flex-1 min-w-0">
                          <div className="text-paper text-sm font-medium truncate">{p.name}</div>
                          <div className={`text-xs ${RARITY_COLOR[p.rarity]}`}>{RARITY_NAME[p.rarity]}</div>
                          <div className="text-smoke/50 text-xs">Lv.{p.current_level} · {daysLeft}d left</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-gold font-mono font-bold">+{k}</div>
                          <div className="text-smoke/50 text-xs">karma</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PHASE: CONFIRM ── */}
          {phase === 'confirm' && pet && (
            <div className="px-5 text-center">
              <PetSprite seed={pet.sprite_seed} element={pet.element} rarity={pet.rarity} size={80} />
              <div className="mt-3 mb-1 font-display text-paper text-lg">{pet.name}</div>
              <div className={`text-sm ${RARITY_COLOR[pet.rarity]} mb-4`}>{RARITY_NAME[pet.rarity]}</div>

              <div className="bg-ink rounded-xl p-4 mb-5 text-sm">
                <div className="text-smoke/70 mb-2">Transcendence reward</div>
                <div className="text-gold font-mono text-2xl font-bold">+{karmaPreview} Karma</div>
                <div className="text-smoke/50 text-xs mt-1">
                  Current: {user?.karma_points || 0} → {(user?.karma_points || 0) + karmaPreview}
                </div>
              </div>

              <div className="bg-vermil/10 border border-vermil/30 rounded-xl p-3 mb-5 text-xs text-smoke/80">
                ⚠ This cannot be undone. The spirit will be released to the heavens permanently.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPhase('select')} className="flex-1 btn-ghost py-3">
                  ← Back
                </button>
                <button onClick={handleTranscend} className="flex-1 btn-ritual py-3">
                  Perform 薦度齋
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE: RITUAL ANIMATION ── */}
          {phase === 'ritual' && pet && (
            <div className="px-5 text-center py-8">
              <motion.div
                animate={{
                  y: [0, -20, -60],
                  opacity: [1, 0.8, 0],
                  scale: [1, 1.2, 0.5],
                }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
              >
                <PetSprite seed={pet.sprite_seed} element={pet.element} rarity="grand_mudang" status="transcended" size={80} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-cjk text-4xl text-gold mt-4"
              >
                昇天
              </motion.div>
              <div className="text-smoke/60 text-sm mt-2">Performing the ritual...</div>

              {/* Animated particles */}
              <div className="flex justify-center gap-4 mt-4">
                {['木', '火', '土', '金', '水'].map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], y: [-20, -60, -100] }}
                    transition={{ delay: i * 0.2, duration: 1.5, repeat: Infinity }}
                    className="font-cjk text-lg"
                    style={{ color: ['#27AE60','#E74C3C','#D4AF37','#BDC3C7','#3498DB'][i] }}
                  >
                    {c}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── PHASE: DONE ── */}
          {phase === 'done' && (
            <div className="px-5 text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="text-5xl mb-4"
              >
                ✨
              </motion.div>
              <div className="font-cjk text-gold text-2xl mb-2">昇天 完成</div>
              <div className="text-paper text-sm mb-4">Transcendence complete</div>

              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6">
                <div className="text-smoke/70 text-xs mb-1">Karma earned</div>
                <div className="text-gold font-mono text-3xl font-bold">+{earnedKarma}</div>
                <div className="text-smoke/50 text-xs mt-1">
                  Total karma: {user?.karma_points || 0}
                </div>
                <div className="text-smoke/40 text-xs mt-2">
                  Every 10 Karma = +1% rare rate on next hatch
                </div>
              </div>

              <button onClick={onClose} className="btn-ritual w-full">
                Close 閉門
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
