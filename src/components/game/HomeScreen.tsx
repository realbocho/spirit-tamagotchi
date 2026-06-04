'use client'
// src/components/game/HomeScreen.tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import PetSprite from './PetSprite'
import CrisisModal from './CrisisModal'
import PetDetailModal from './PetDetailModal'
import { FORTUNE_LABELS, ELEMENT_LABELS, RARITY_LABELS } from '@/lib/fortune-engine'
import toast from 'react-hot-toast'

const FORTUNE_COLORS: Record<string, string> = {
  great_luck:        'text-gold',
  luck:              'text-jade-light',
  neutral:           'text-smoke',
  misfortune:        'text-vermil-light',
  great_misfortune:  'text-vermil',
}

const FORTUNE_BG: Record<string, string> = {
  great_luck:        'bg-gold/10 border-gold/30',
  luck:              'bg-jade/10 border-jade/30',
  neutral:           'bg-smoke/10 border-smoke/20',
  misfortune:        'bg-vermil/10 border-vermil/30',
  great_misfortune:  'bg-vermil/20 border-vermil/50',
}

export default function HomeScreen() {
  const { user, activePet, todayFortune, updatePet } = useAppStore()
  const [minedAmount, setMinedAmount] = useState(0)
  const [isClaiming, setIsClaiming] = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const [showPetDetail, setShowPetDetail] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)

  // Fetch active mining session start time from DB on mount
  useEffect(() => {
    if (!activePet || !user) return
    fetch(`/api/pets/session?petId=${activePet.id}&userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.started_at) {
          setSessionStartedAt(new Date(d.started_at).getTime())
        } else {
          // No session yet — use now as fallback
          setSessionStartedAt(Date.now())
        }
      })
      .catch(() => setSessionStartedAt(Date.now()))
  }, [activePet?.id, user?.id])

  // Real-time mining counter — based on DB session start time
  useEffect(() => {
    if (!activePet || activePet.status !== 'alive' || sessionStartedAt === null) return
    const multiplier = todayFortune?.mining_multiplier || 1.0
    const ratePerMs = (activePet.base_mining_rate * multiplier) / 3600000

    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartedAt
      setMinedAmount(Math.floor(elapsed * ratePerMs))
    }, 1000)

    return () => clearInterval(interval)
  }, [activePet, todayFortune, sessionStartedAt])

  // Show crisis if pet is cursed
  useEffect(() => {
    if (activePet?.status === 'cursed') {
      setShowCrisis(true)
    }
  }, [activePet?.status])

  const handleClaim = useCallback(async () => {
    if (!activePet || !user || isClaiming) return
    setIsClaiming(true)
    try {
      const res = await fetch(`/api/pets/${activePet.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, clientMined: minedAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`⛏ Claimed ${data.claimed.toLocaleString()} $MUDANG!`)
      if (data.level_up) {
        toast.success(`⬆️ Level Up! Your pet is now level ${data.new_level}!`)
      }
      updatePet(activePet.id, {
        total_mined: activePet.total_mined + data.claimed,
        current_level: data.new_level || activePet.current_level,
      })
      // Update in-game balance in store
      if (user) {
        useAppStore.getState().setUser({
          ...user,
          mudang_balance: (user.mudang_balance || 0) + data.claimed,
          total_earned: (user.total_earned || 0) + data.claimed,
        })
      }
      setMinedAmount(0)
      setSessionStartedAt(Date.now())
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim')
    } finally {
      setIsClaiming(false)
    }
  }, [activePet, user, isClaiming])

  const daysRemaining = activePet
    ? Math.max(0, Math.floor((new Date(activePet.dies_at).getTime() - Date.now()) / 86400000))
    : 0

  const lifetimeProgress = activePet
    ? (() => {
        const diesAt = new Date(activePet.dies_at).getTime()
        const bornAt = activePet.born_at
          ? new Date(activePet.born_at).getTime()
          : diesAt - 90 * 24 * 60 * 60 * 1000
        const total = diesAt - bornAt
        const remaining = diesAt - Date.now()
        // remaining/total = fraction LEFT (100% = full life, 0% = dead)
        return total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
      })()
    : 0

  if (!activePet) {
    return <NoActivePet />
  }

  return (
    <div className="min-h-full bg-hex-grid">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-smoke/50 text-xs tracking-wide">Today's Fortune</div>
          {todayFortune ? (
            <div className={`font-display text-sm font-semibold ${FORTUNE_COLORS[todayFortune.label]}`}>
              {FORTUNE_LABELS[todayFortune.label as keyof typeof FORTUNE_LABELS]}
            </div>
          ) : (
            <div className="text-smoke text-xs">Check your fortune ↓</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-smoke/50 text-xs">Lifespan</div>
          <div className={`font-mono text-sm ${daysRemaining <= 10 ? 'text-vermil-light' : 'text-paper'}`}>
            {daysRemaining}d left
          </div>
        </div>
      </div>

      {/* Lifetime bar */}
      <div className="px-4 mb-4">
        <div className="stat-bar-bg">
          <div
            className="stat-bar-fill"
            style={{
              width: `${lifetimeProgress * 100}%`,
              background: `linear-gradient(90deg, #27AE60, ${daysRemaining <= 10 ? '#E74C3C' : '#D4AF37'})`,
            }}
          />
        </div>
      </div>

      {/* Fortune card */}
      {todayFortune && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-4 mb-4 p-3 rounded-xl border ${FORTUNE_BG[todayFortune.label]} text-xs`}
        >
          <div className="flex items-start gap-2">
            <span className="font-cjk text-base">{todayFortune.stem_branch}</span>
            <div>
              <div className="text-smoke/80 leading-relaxed">{todayFortune.advisory_text}</div>
              <div className="mt-1 flex gap-2">
                <span className="text-smoke/60">{ELEMENT_LABELS[todayFortune.element_of_day as keyof typeof ELEMENT_LABELS]}</span>
                <span className={todayFortune.mining_multiplier >= 1 ? 'text-jade-light' : 'text-vermil-light'}>
                  ×{todayFortune.mining_multiplier} Mining
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pet display */}
      <div className="flex flex-col items-center px-4 py-2">
        <div className={`relative p-6 rounded-3xl card-ritual rarity-${activePet.rarity} mb-4 w-full max-w-xs cursor-pointer active:scale-95 transition-transform`} onClick={() => setShowPetDetail(true)}>
          {/* Curse overlay */}
          {activePet.status === 'cursed' && (
            <div className="absolute inset-0 rounded-3xl curse-overlay z-10 flex items-center justify-center">
              <div className="bg-ink/80 px-3 py-1 rounded-full">
                <span className="text-vermil-light text-sm font-display">
                  {activePet.crisis_type === 'sal' ? '煞 SAL CURSE' : '三災 SAMJAE'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-paper text-lg font-semibold">{activePet.name}</div>
              <div className="text-smoke text-xs">{RARITY_LABELS[activePet.rarity]}</div>
            </div>
            <div className="text-right">
              <div className="text-smoke text-xs">Lv.{activePet.current_level}</div>
              <div className="text-paper/60 text-xs">{ELEMENT_LABELS[activePet.element]}</div>
            </div>
          </div>

          {/* Pet sprite center */}
          <div className="flex justify-center mb-4">
            <PetSprite
              seed={activePet.sprite_seed}
              rarity={activePet.rarity}
              element={activePet.element}
              status={activePet.status}
              size={100}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            {[
              { label: '運 Luck',    value: activePet.luck_stat },
              { label: '命 Vitality', value: activePet.vitality_stat },
              { label: '財 Wealth',  value: activePet.wealth_stat },
              { label: '智 Wisdom',  value: activePet.wisdom_stat },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-smoke/70">{label}</span>
                  <span className="text-paper/80">{value}</span>
                </div>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill bg-gold/60" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* XP bar */}
          <div className="text-xs text-smoke/60 mb-1 flex justify-between">
            <span>XP</span>
            <span>{activePet.xp}/{activePet.xp_to_next}</span>
          </div>
          <div className="stat-bar-bg">
            <div
              className="stat-bar-fill bg-spirit"
              style={{ width: `${(activePet.xp / activePet.xp_to_next) * 100}%` }}
            />
          </div>
        </div>

        {/* Mining widget */}
        {activePet.status === 'alive' && (
          <motion.div
            className="w-full max-w-xs card-ritual p-4 mb-4"
            animate={{ boxShadow: minedAmount > 0 ? '0 0 20px rgba(212,175,55,0.15)' : 'none' }}
          >
            <div className="text-center mb-3">
              <div className="font-cjk text-smoke/50 text-xs mb-1">採掘量</div>
              <div className="mining-counter text-2xl">
                +{minedAmount.toLocaleString()} $MUD
              </div>
              <div className="text-smoke/50 text-xs mt-1">
                {activePet.base_mining_rate.toLocaleString()} $MUD/hr base
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={isClaiming || minedAmount === 0}
              className={`w-full py-3 rounded-xl font-display text-sm transition-all duration-200
                ${minedAmount > 0 && !isClaiming
                  ? 'btn-ritual'
                  : 'bg-smoke/10 text-smoke/40 cursor-not-allowed'}`}
            >
              {isClaiming ? 'Claiming...' : minedAmount > 0 ? '⛏ Claim $MUDANG' : 'Mining in progress...'}
            </button>
          </motion.div>
        )}

        {/* Crisis button */}
        {activePet.status === 'cursed' && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-full max-w-xs"
          >
            <button
              onClick={() => setShowCrisis(true)}
              className="w-full py-3 rounded-xl bg-vermil text-paper font-display text-sm
                         border border-vermil-light/50 animate-pulse-glow"
            >
              ⚡ Resolve Crisis 解厄
            </button>
          </motion.div>
        )}

        {/* Total mined */}
        <div className="w-full max-w-xs text-center mt-3">
          <div className="text-smoke/50 text-xs">
            Total mined: <span className="text-paper/70 font-mono">{activePet.total_mined.toLocaleString()} $MUD</span>
          </div>
        </div>
      </div>


      {/* Guide Banner */}
      <div className="w-full max-w-xs mt-4 mb-2">
        <a
          href="/guide"
          target="_blank"
          rel="noopener noreferrer"
          className="block card-ritual p-4 border-gold/20 hover:border-gold/40 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="font-cjk text-2xl text-gold/60">運命</div>
            <div className="flex-1 min-w-0">
              <div className="text-paper text-xs font-semibold">How to earn real TON</div>
              <div className="text-smoke/60 text-xs mt-0.5">ROI guide · Crisis strategy · Tips →</div>
            </div>
          </div>
        </a>
      </div>
      {/* Crisis Modal */}
      <AnimatePresence>
        {showPetDetail && (
          <PetDetailModal
            pet={activePet}
            onClose={() => setShowPetDetail(false)}
            onPetUpdated={(updated) => { updatePet(updated.id, updated); setShowPetDetail(false); }}
          />
        )}
        {showCrisis && activePet.status === 'cursed' && (
          <CrisisModal pet={activePet} onClose={() => setShowCrisis(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function NoActivePet() {
  const { setActiveTab } = useAppStore()
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 text-center gap-6">
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-20 h-20 rounded-2xl bg-spirit/10 border border-spirit/30 flex items-center justify-center text-4xl"
      >
        🥚
      </motion.div>
      <div>
        <h2 className="font-display text-paper text-xl mb-2">No Spirit Yet</h2>
        <p className="text-smoke text-sm">Hatch your first spirit egg to begin mining $MUDANG</p>
      </div>
      <button onClick={() => setActiveTab('gacha')} className="btn-ritual px-8">
        Hatch an Egg 孵化
      </button>
    </div>
  )
}
