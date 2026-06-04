'use client'
// src/components/game/DemoMode.tsx
// Shown when accessed outside Telegram — marketing demo with fake data
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PetSprite from './PetSprite'

const BOT_URL = `https://t.me/Oriental_fortune_Tamagotchi_bot`

// ── Demo Data ────────────────────────────────────────────────
const DEMO_PETS = [
  { id: '1', name: 'Cheonmyeong', rarity: 'grand_mudang' as const, element: 'fire' as const,   level: 9,  rate: 4800, seed: 9981, status: 'alive' as const },
  { id: '2', name: 'Baekho',      rarity: 'mudang'       as const, element: 'metal' as const,  level: 7,  rate: 2200, seed: 4421, status: 'alive' as const },
  { id: '3', name: 'Cheongryong', rarity: 'blessed'      as const, element: 'wood'  as const,  level: 5,  rate: 980,  seed: 7733, status: 'cursed' as const },
  { id: '4', name: 'Hyeonmu',     rarity: 'mudang'       as const, element: 'water' as const,  level: 6,  rate: 1750, seed: 2244, status: 'alive' as const },
  { id: '5', name: 'Jujak',       rarity: 'grand_mudang' as const, element: 'fire'  as const,  level: 10, rate: 5600, seed: 6612, status: 'alive' as const },
]

const DEMO_LISTINGS = [
  { id: '1', name: 'Cheonmyeong', rarity: 'grand_mudang' as const, element: 'fire'  as const, level: 8, rate: 4200, price: 18.5, seed: 1122 },
  { id: '2', name: 'Baekho',      rarity: 'mudang'       as const, element: 'metal' as const, level: 6, rate: 1900, price: 6.2,  seed: 3344 },
  { id: '3', name: 'Samshin',     rarity: 'blessed'      as const, element: 'earth' as const, level: 4, rate: 820,  price: 2.1,  seed: 5566 },
]

const DEMO_LEADERBOARD = [
  { rank: 1, name: 'mudang_whale',  mined: 2847391, rarity: 'grand_mudang', level: 10 },
  { rank: 2, name: 'spiritlord99',  mined: 1923847, rarity: 'grand_mudang', level: 9  },
  { rank: 3, name: 'baekho_master', mined: 1204938, rarity: 'mudang',       level: 8  },
  { rank: 4, name: 'tonjaebal',     mined: 984021,  rarity: 'mudang',       level: 7  },
  { rank: 5, name: 'fortune_seeker',mined: 731204,  rarity: 'blessed',      level: 6  },
]

const RARITY_COLOR: Record<string, string> = {
  common: 'text-smoke', blessed: 'text-jade', mudang: 'text-vermil', grand_mudang: 'text-gold',
}
const RARITY_LABEL: Record<string, string> = {
  common: '凡', blessed: '福', mudang: '巫', grand_mudang: '大巫',
}
const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

// Animated mining counter
function MiningCounter({ rate }: { rate: number }) {
  const [count, setCount] = useState(1_284_921)
  const startRef = useRef(Date.now())
  useEffect(() => {
    const ratePerMs = rate / 3_600_000
    const iv = setInterval(() => {
      setCount(Math.floor(1_284_921 + (Date.now() - startRef.current) * ratePerMs))
    }, 500)
    return () => clearInterval(iv)
  }, [rate])
  return <span className="mining-counter">{count.toLocaleString()}</span>
}

// ── Main Component ────────────────────────────────────────────
export default function DemoMode() {
  const [tab, setTab] = useState<'home' | 'market' | 'leaderboard'>('home')
  const [showCrisisBadge, setShowCrisisBadge] = useState(true)

  const activePet = DEMO_PETS[0]

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden flex flex-col">
      {/* Demo Banner */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        className="bg-gold/15 border-b border-gold/30 px-4 py-2 flex items-center justify-between flex-shrink-0 z-50"
      >
        <span className="text-gold/80 text-xs">👁 Preview Mode — Open in Telegram to play</span>
        <a
          href={BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-gold text-ink font-semibold px-3 py-1 rounded-full"
        >
          Play Free →
        </a>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeTab activePet={activePet} showCrisis={showCrisisBadge} />
            </motion.div>
          )}
          {tab === 'market' && (
            <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MarketTab />
            </motion.div>
          )}
          {tab === 'leaderboard' && (
            <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LeaderboardTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-ink border-t border-gold/15 flex z-40">
        {[
          { id: 'home',        icon: '⛩', label: '靈' },
          { id: 'market',      icon: '🏮', label: '市' },
          { id: 'leaderboard', icon: '🏆', label: '榜' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all ${
              tab === t.id ? 'text-gold' : 'text-smoke/50'
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="font-cjk text-xs">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── Home Tab ──────────────────────────────────────────────────
function HomeTab({ activePet, showCrisis }: { activePet: typeof DEMO_PETS[0]; showCrisis: boolean }) {
  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-cjk text-gold/50 text-xs">四柱八字 · 甲午年</div>
          <div className="text-paper font-display text-lg">Spirit Tamagotchi 巫</div>
        </div>
        <div className="text-right">
          <div className="text-smoke/60 text-xs">$MUDANG</div>
          <MiningCounter rate={4800} />
        </div>
      </div>

      {/* Fortune Card */}
      <div className="card-ritual p-3 mb-4 flex items-center gap-3 bg-gold/5 border-gold/30">
        <div className="font-cjk text-2xl text-gold">大吉</div>
        <div>
          <div className="text-paper text-sm font-semibold">Great Luck · 甲午</div>
          <div className="text-smoke/70 text-xs">Mining rate ×1.5 today</div>
        </div>
        <div className="ml-auto font-mono text-gold text-sm font-bold">×1.5</div>
      </div>

      {/* Active Pet */}
      <div className="flex flex-col items-center mb-5">
        <div className={`relative p-5 rounded-3xl card-ritual rarity-${activePet.rarity} w-full max-w-xs mb-4`}>
          {/* Crisis badge on 3rd pet (Cheongryong) shown here as alt */}
          <div className="flex flex-col items-center">
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <PetSprite seed={activePet.seed} element={activePet.element} rarity={activePet.rarity} size={96} />
            </motion.div>
            <div className={`font-cjk text-sm mt-2 ${RARITY_COLOR[activePet.rarity]}`}>
              {RARITY_LABEL[activePet.rarity]} {activePet.rarity === 'grand_mudang' ? 'Grand Mudang' : activePet.rarity}
            </div>
            <div className="font-display text-paper text-xl font-bold">{activePet.name}</div>
            <div className="text-smoke/60 text-xs">Lv.{activePet.level} · Fire 火</div>
          </div>

          {/* Mining rate */}
          <div className="mt-3 flex items-center justify-center gap-2 bg-ink/40 rounded-xl py-2">
            <span className="text-smoke/60 text-xs">⛏ Mining</span>
            <span className="font-mono text-jade font-semibold">{activePet.rate.toLocaleString()}</span>
            <span className="text-smoke/50 text-xs">$MUD/hr</span>
          </div>
        </div>

        {/* Claim button */}
        <button className="btn-ritual w-full max-w-xs text-sm">
          ✦ Claim 1,284,921 $MUDANG
        </button>
      </div>

      {/* All Pets */}
      <div className="mb-4">
        <div className="text-smoke/60 text-xs mb-2 font-cjk">Your Spirits ({DEMO_PETS.length})</div>
        <div className="space-y-2">
          {DEMO_PETS.map(p => (
            <div key={p.id} className={`card-ritual rarity-${p.rarity} p-3 flex items-center gap-3`}>
              <PetSprite seed={p.seed} element={p.element} rarity={p.rarity} status={p.status} size={44} animate={false} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-cjk text-xs ${RARITY_COLOR[p.rarity]}`}>{RARITY_LABEL[p.rarity]}</span>
                  <span className="text-paper text-sm font-medium truncate">{p.name}</span>
                  {p.status === 'cursed' && (
                    <span className="text-xs bg-vermil/20 text-vermil border border-vermil/30 rounded px-1">⚡煞</span>
                  )}
                </div>
                <div className="text-smoke/50 text-xs">Lv.{p.level} · {p.rate.toLocaleString()} $MUD/hr</div>
              </div>
              <div className="font-mono text-jade text-sm">{fmt(p.rate * 24)}/day</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <CTABanner />
    </div>
  )
}

// ── Market Tab ────────────────────────────────────────────────
function MarketTab() {
  return (
    <div className="px-4 pt-4">
      <div className="text-center mb-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-1">市場</div>
        <h2 className="font-display text-paper text-xl">Spirit Market</h2>
        <p className="text-smoke/60 text-xs mt-1">Buy & sell spirit NFTs · 10% marketplace fee</p>
      </div>

      <div className="space-y-3 mb-6">
        {DEMO_LISTINGS.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`card-ritual rarity-${l.rarity} p-4`}
          >
            <div className="flex items-center gap-3">
              <PetSprite seed={l.seed} element={l.element} rarity={l.rarity} size={60} animate={false} />
              <div className="flex-1 min-w-0">
                <div className={`font-cjk text-xs ${RARITY_COLOR[l.rarity]} mb-0.5`}>{RARITY_LABEL[l.rarity]}</div>
                <div className="font-display text-paper text-sm font-semibold">{l.name}</div>
                <div className="text-smoke/60 text-xs">Lv.{l.level} · {l.rate.toLocaleString()} $MUD/hr</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-gold font-bold text-lg">{l.price}</div>
                <div className="text-smoke/50 text-xs mb-2">TON</div>
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-gold/20 text-gold border border-gold/40 rounded-lg px-3 py-1.5 block text-center">
                  Buy
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <CTABanner />
    </div>
  )
}

// ── Leaderboard Tab ───────────────────────────────────────────
function LeaderboardTab() {
  return (
    <div className="px-4 pt-4">
      <div className="text-center mb-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-1">排行榜</div>
        <h2 className="font-display text-paper text-xl">Spirit Rankings</h2>
        <p className="text-smoke/60 text-xs">Top $MUDANG miners</p>
      </div>

      <div className="space-y-2 mb-6">
        {DEMO_LEADERBOARD.map((e, i) => (
          <motion.div
            key={e.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card-ritual p-3 flex items-center gap-3"
          >
            <div className="w-8 text-center flex-shrink-0">
              {RANK_MEDAL[e.rank]
                ? <span className="text-xl">{RANK_MEDAL[e.rank]}</span>
                : <span className="font-mono text-smoke/50 text-sm">#{e.rank}</span>
              }
            </div>
            <PetSprite
              seed={e.rank * 137}
              element={['fire','metal','wood','water','earth'][i] as any}
              rarity={e.rarity as any}
              size={40}
              animate={false}
            />
            <div className="flex-1 min-w-0">
              <div className="text-paper text-sm font-medium truncate">{e.name}</div>
              <div className={`text-xs ${RARITY_COLOR[e.rarity]}`}>
                {RARITY_LABEL[e.rarity]} · Lv.{e.level}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono text-jade text-sm font-semibold">{fmt(e.mined)}</div>
              <div className="text-smoke/50 text-xs">$MUDANG</div>
            </div>
          </motion.div>
        ))}
      </div>

      <CTABanner />
    </div>
  )
}

// ── CTA Banner ────────────────────────────────────────────────
function CTABanner() {
  return (
    <motion.a
      href={BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={{ scale: 0.97 }}
      className="block card-ritual border-gold/40 p-5 text-center mb-4"
    >
      <div className="font-cjk text-3xl text-gold/60 mb-2">巫</div>
      <div className="font-display text-paper text-lg font-bold mb-1">Start Mining for Free</div>
      <div className="text-smoke/70 text-sm mb-3">Enter your Four Pillars · Hatch your spirit · Earn TON</div>
      <div className="inline-block bg-gold text-ink font-bold px-8 py-2.5 rounded-xl text-sm">
        Open in Telegram →
      </div>
    </motion.a>
  )
}
