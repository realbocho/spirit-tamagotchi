'use client'
// src/components/game/LeaderboardScreen.tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { LeaderboardEntry } from '@/types'
import PetSprite from './PetSprite'

const RARITY_LABEL: Record<string, string> = {
  common: '凡', blessed: '福', mudang: '巫', grand_mudang: '大巫',
}
const RARITY_COLOR: Record<string, string> = {
  common: 'text-smoke', blessed: 'text-jade', mudang: 'text-vermil', grand_mudang: 'text-gold',
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function formatMudang(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function LeaderboardScreen() {
  const { user } = useAppStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(({ entries: data }) => {
        setEntries(data || [])
        const mine = (data || []).findIndex((e: LeaderboardEntry) => e.user_id === user?.id)
        if (mine >= 0) setMyRank(mine + 1)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="text-center mb-1">
          <span className="font-cjk text-gold/50 text-xs tracking-widest">排行榜</span>
        </div>
        <h1 className="font-display text-paper text-2xl text-center mb-1">Spirit Rankings</h1>
        <p className="text-smoke/60 text-xs text-center">Top miners of $MUDANG</p>
      </div>

      {/* My rank badge */}
      {myRank && (
        <div className="mx-4 mb-4 card-ritual p-3 flex items-center gap-3">
          <span className="font-cjk text-gold text-sm">내 순위</span>
          <span className="ml-auto font-mono text-paper text-lg font-semibold">#{myRank}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-3xl animate-spin">☯</div>
          <p className="text-smoke/60 text-sm">Reading the akashic records...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="mx-4 card-ritual p-8 text-center">
          <div className="font-cjk text-4xl text-gold/30 mb-3">虛</div>
          <p className="text-smoke/70 text-sm">Rankings unlock after 100 active miners.</p>
          <p className="text-smoke/50 text-xs mt-1">Be the first to mine $MUDANG!</p>
        </div>
      ) : (
        <div className="px-4 pb-24 space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card-ritual p-3 flex items-center gap-3 ${
                entry.user_id === user?.id ? 'border-gold/40' : ''
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {RANK_MEDAL[entry.rank] ? (
                  <span className="text-xl">{RANK_MEDAL[entry.rank]}</span>
                ) : (
                  <span className="font-mono text-smoke/60 text-sm">#{entry.rank}</span>
                )}
              </div>

              {/* Pet sprite */}
              <div className="w-10 h-10 flex-shrink-0">
                <PetSprite seed={entry.rank * 137} element="fire" rarity={entry.pet_rarity as any} size={40} />
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-cjk text-xs ${RARITY_COLOR[entry.pet_rarity]}`}>
                    {RARITY_LABEL[entry.pet_rarity]}
                  </span>
                  <span className="text-paper text-sm font-medium truncate">
                    {entry.telegram_name}
                    {entry.user_id === user?.id && (
                      <span className="text-gold/70 text-xs ml-1">(나)</span>
                    )}
                  </span>
                </div>
                <div className="text-smoke/60 text-xs">
                  Lv.{entry.pet_level} spirit
                </div>
              </div>

              {/* Mined amount */}
              <div className="text-right flex-shrink-0">
                <div className="font-mono text-jade text-sm font-semibold">
                  {formatMudang(entry.total_mined)}
                </div>
                <div className="text-smoke/50 text-xs">$MUDANG</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
