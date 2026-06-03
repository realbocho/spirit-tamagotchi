'use client'
// src/app/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react'

interface Stats {
  total_users: number
  active_pets: number
  total_mined: number
  pending_withdrawals_count: number
  pending_withdrawals_amount: number
  active_listings: number
  open_sos: number
  revenue: {
    reward_pool: number
    ops: number
    mudang_pool: number
    total: number
  }
  top_users: Array<{ telegram_name: string; total_earned: number; karma_points: number }>
  recent_transactions: Array<{ type: string; amount_ton: number; created_at: string }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [contractBalance, setContractBalance] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-gold font-cjk text-2xl animate-pulse">載入...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-vermil text-sm">Failed to load stats</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink text-paper p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-1">管理者</div>
        <h1 className="text-2xl font-bold text-paper">Spirit Tamagotchi — Admin</h1>
        <p className="text-smoke/60 text-sm mt-1">Real-time dashboard · {new Date().toLocaleString()}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.total_users.toLocaleString(), color: 'text-jade', icon: '👥' },
          { label: 'Active Pets', value: stats.active_pets.toLocaleString(), color: 'text-spirit', icon: '🐾' },
          { label: 'Total $MUD Mined', value: (stats.total_mined / 1000).toFixed(1) + 'K', color: 'text-gold', icon: '⛏' },
          { label: 'Open SOS', value: String(stats.open_sos), color: 'text-vermil', icon: '🆘' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-ink-50 border border-gold/10 rounded-xl p-4">
            <div className="text-xl mb-1">{icon}</div>
            <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-smoke/60 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Split */}
      <div className="bg-ink-50 border border-gold/10 rounded-xl p-5 mb-6">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">收益 Revenue Split</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Reward Pool (60%)', value: stats.revenue.reward_pool, color: '#27AE60' },
            { label: 'Operations (30%)', value: stats.revenue.ops, color: '#3498DB' },
            { label: '大巫 Pool (10%)', value: stats.revenue.mudang_pool, color: '#D4AF37' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="font-mono text-xl font-bold" style={{ color }}>{value.toFixed(2)} TON</div>
              <div className="text-smoke/60 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-smoke/10 mt-4 pt-3 text-center">
          <span className="text-smoke/50 text-xs">Total Revenue: </span>
          <span className="text-paper font-mono font-bold">{stats.revenue.total.toFixed(2)} TON</span>
        </div>
      </div>

      {/* Withdrawals */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-ink-50 border border-gold/10 rounded-xl p-4">
          <div className="font-cjk text-smoke/50 text-xs mb-3">출금 Pending Withdrawals</div>
          <div className="font-mono text-xl text-vermil">{stats.pending_withdrawals_count}</div>
          <div className="text-smoke/60 text-xs">requests</div>
          <div className="font-mono text-lg text-gold mt-2">{(stats.pending_withdrawals_amount / 1000).toFixed(1)}K</div>
          <div className="text-smoke/60 text-xs">$MUDANG total</div>
        </div>
        <div className="bg-ink-50 border border-gold/10 rounded-xl p-4">
          <div className="font-cjk text-smoke/50 text-xs mb-3">마켓 Market Listings</div>
          <div className="font-mono text-xl text-jade">{stats.active_listings}</div>
          <div className="text-smoke/60 text-xs">active listings</div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-ink-50 border border-gold/10 rounded-xl p-5 mb-6">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">排行 Top Miners</div>
        <div className="space-y-2">
          {stats.top_users.map((u, i) => (
            <div key={u.telegram_name} className="flex items-center gap-3 text-sm">
              <span className="text-smoke/40 font-mono w-5">#{i + 1}</span>
              <span className="flex-1 text-paper">{u.telegram_name}</span>
              <span className="font-mono text-jade">{(u.total_earned / 1000).toFixed(1)}K $MUD</span>
              <span className="font-mono text-gold text-xs">{u.karma_points} karma</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-ink-50 border border-gold/10 rounded-xl p-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">最近 Recent Transactions</div>
        <div className="space-y-2">
          {stats.recent_transactions.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-smoke/60 text-xs font-mono">
                {new Date(tx.created_at).toLocaleTimeString()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tx.type === 'egg_purchase' ? 'bg-jade/20 text-jade' :
                tx.type === 'talisman' ? 'bg-vermil/20 text-vermil' :
                tx.type === 'nft_buy' ? 'bg-spirit/20 text-spirit' :
                'bg-gold/20 text-gold'
              }`}>{tx.type}</span>
              <span className="ml-auto font-mono text-paper">{tx.amount_ton} TON</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
