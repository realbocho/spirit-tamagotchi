'use client'
// src/components/game/PetDetailModal.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pet } from '@/types'
import PetSprite from './PetSprite'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface Props {
  pet: Pet
  onClose: () => void
  onPetUpdated: (pet: Pet) => void
}

const ELEMENT_EMOJI: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
}
const RARITY_COLOR: Record<string, string> = {
  common: 'text-smoke', blessed: 'text-jade', mudang: 'text-vermil', grand_mudang: 'text-gold',
}
const RARITY_NAME: Record<string, string> = {
  common: 'Common 凡', blessed: 'Blessed 福', mudang: 'Mudang 巫', grand_mudang: 'Grand Mudang 大巫',
}

const LEVEL_COSTS: Record<number, number> = {
  1: 100, 2: 250, 3: 500, 4: 1000, 5: 2000,
  6: 4000, 7: 8000, 8: 16000, 9: 32000,
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-smoke/60 text-xs w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-ink-50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="font-mono text-xs text-smoke/80 w-6 text-right">{value}</span>
    </div>
  )
}

export default function PetDetailModal({ pet, onClose, onPetUpdated }: Props) {
  const { user, setUser } = useAppStore()
  const [leveling, setLeveling] = useState(false)

  const now = Date.now()
  const diesAt = new Date(pet.dies_at).getTime()
  // born_at fallback: if missing, assume 90 days before dies_at
  const bornAt = pet.born_at
    ? new Date(pet.born_at).getTime()
    : diesAt - 90 * 24 * 60 * 60 * 1000
  const totalLifespan = diesAt - bornAt
  const remaining = diesAt - now
  const daysLeft = Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24)))
  const lifePct = totalLifespan > 0
    ? Math.max(0, Math.min(100, Math.round((remaining / totalLifespan) * 100)))
    : Math.max(0, Math.min(100, Math.round((daysLeft / 90) * 100)))
  const xpPct = Math.round((pet.xp / pet.xp_to_next) * 100)
  const levelCost = LEVEL_COSTS[pet.current_level] || 99999
  const canLevelUp = pet.xp >= pet.xp_to_next &&
    pet.current_level < 10 &&
    (user?.mudang_balance || 0) >= levelCost

  async function handleLevelUp() {
    if (!user) return
    setLeveling(true)
    try {
      const res = await fetch('/api/pets/level-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, petId: pet.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`🌟 Level ${data.newLevel}! Mining +${data.miningBoost}/hr`)
      onPetUpdated(data.pet)
      if (user) setUser({ ...user, mudang_balance: user.mudang_balance - data.cost })
    } catch (err: any) {
      toast.error(err.message || 'Level up failed')
    } finally {
      setLeveling(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-sm bg-ink-50 rounded-t-2xl border-t border-gold/20 p-5 pb-10"
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-smoke/30 rounded-full mx-auto mb-5" />

          {/* Pet header */}
          <div className="flex items-center gap-4 mb-5">
            <PetSprite seed={pet.sprite_seed} element={pet.element} rarity={pet.rarity} size={64} />
            <div>
              <div className={`text-xs font-cjk mb-0.5 ${RARITY_COLOR[pet.rarity]}`}>
                {RARITY_NAME[pet.rarity]}
              </div>
              <h2 className="font-display text-paper text-xl">{pet.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-cjk text-gold text-sm">{ELEMENT_EMOJI[pet.element]}</span>
                <span className="text-smoke/60 text-xs">Lv.{pet.current_level} · {pet.base_mining_rate}/hr</span>
              </div>
            </div>
          </div>

          {/* Life bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-smoke/60 mb-1">
              <span>壽命 Lifespan</span>
              <span className={daysLeft < 14 ? 'text-vermil' : 'text-smoke/60'}>{daysLeft}d left</span>
            </div>
            <div className="h-2 bg-ink rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  lifePct > 50 ? 'bg-jade' : lifePct > 20 ? 'bg-gold' : 'bg-vermil'
                }`}
                style={{ width: `${lifePct}%` }}
              />
            </div>
          </div>

          {/* XP bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-smoke/60 mb-1">
              <span>EXP</span>
              <span>{pet.xp} / {pet.xp_to_next}</span>
            </div>
            <div className="h-1.5 bg-ink rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                className="h-full rounded-full bg-gold"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-5">
            <StatBar label="幸運 Luck" value={pet.luck_stat} color="bg-gold" />
            <StatBar label="活力 Vit" value={pet.vitality_stat} color="bg-jade" />
            <StatBar label="財富 Wealth" value={pet.wealth_stat} color="bg-vermil" />
            <StatBar label="智慧 Wis" value={pet.wisdom_stat} color="bg-spirit" />
          </div>

          {/* Crisis badge */}
          {pet.crisis_type && (
            <div className="mb-4 px-3 py-2 bg-vermil/10 border border-vermil/30 rounded-lg text-center">
              <span className="text-vermil text-sm font-cjk">
                {pet.crisis_type === 'sal' ? '⚡ 煞 SAL CURSE active' : '🌀 三災 SAMJAE active'}
              </span>
              <p className="text-smoke/60 text-xs mt-0.5">Mining paused until curse is lifted</p>
            </div>
          )}

          {/* Level up button */}
          {pet.current_level < 10 && (
            <button
              onClick={handleLevelUp}
              disabled={!canLevelUp || leveling}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                canLevelUp
                  ? 'btn-ritual'
                  : 'bg-ink border border-smoke/20 text-smoke/40 cursor-not-allowed'
              }`}
            >
              {leveling ? (
                '⟳ Leveling up...'
              ) : pet.xp < pet.xp_to_next ? (
                `Need ${pet.xp_to_next - pet.xp} more XP`
              ) : (user?.mudang_balance || 0) < levelCost ? (
                `Need ${levelCost} $MUDANG`
              ) : (
                `✦ Level Up → Lv.${pet.current_level + 1} (${levelCost} $MUDANG)`
              )}
            </button>
          )}
          {pet.current_level >= 10 && (
            <div className="text-center text-gold font-cjk text-sm py-2">大成 MAX LEVEL</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
