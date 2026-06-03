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
  revenue: { reward_pool: number; ops: number; mudang_pool: number; total: number }
  top_users: Array<{ telegram_name: string; total_earned: number; karma_points: number }>
  recent_transactions: Array<{ type: string; amount_ton: number; created_at: string }>
}

interface ContractBalance {
  address: string
  balance_ton: string
  reward_pool_ton: string
  mudang_pool_ton: string
  tonscan_url: string
}

// Build TON deeplink for wallet to sign a withdrawal tx
function buildWithdrawDeeplink(
  contractAddress: string,
  op: number,         // 0x2 = withdraw_ops (mudang pool), 0x3 = withdraw_pool (reward pool)
  amountNano: bigint,
  recipientAddress?: string
): string {
  // Encode message body as base64 BOC
  // op(32) + amount(coins) [+ recipient(addr) for op 0x2]
  // We use a simple text comment fallback — actual BOC encoding needs @ton/core
  // So we redirect to tonscan for manual execution
  return `https://tonscan.org/address/${contractAddress}`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [contract, setContract] = useState<ContractBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')

  // Get admin key from URL
  const adminKey = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('key') || ''
    : ''

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/stats?key=${adminKey}`).then(r => r.json()),
      fetch(`/api/admin/contract-balance?key=${adminKey}`).then(r => r.json()),
    ]).then(([s, c]) => {
      setStats(s)
      setContract(c.error ? null : c)
    }).finally(() => setLoading(false))
  }, [adminKey])

  // Build withdraw URL (opens in Tonkeeper via deeplink)
  function getWithdrawScript(op: 'reward_pool' | 'mudang_pool') {
    if (!contract) return ''
    const amountTon = op === 'reward_pool'
      ? parseFloat(contract.reward_pool_ton)
      : parseFloat(contract.mudang_pool_ton)
    if (amountTon <= 0) return ''
    // Returns a tonscan link for manual execution — can be upgraded to TON deeplink
    return contract.tonscan_url
  }

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
        <div className="text-vermil text-sm">Failed to load — check ADMIN_SECRET_KEY</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink text-paper p-6 font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-1">管理者</div>
        <h1 className="text-2xl font-bold text-paper">Spirit Tamagotchi — Admin</h1>
        <p className="text-smoke/60 text-sm mt-1">{new Date().toLocaleString()}</p>
      </div>

      {/* ── CONTRACT BALANCE ── */}
      <div className="bg-ink-50 border border-gold/20 rounded-xl p-5 mb-6">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">컨트랙트 잔액</div>

        {contract ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="font-mono text-smoke/50 text-xs truncate flex-1">{contract.address}</div>
              <a
                href={contract.tonscan_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-jade/80 hover:text-jade flex-shrink-0"
              >
                tonscan ↗
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Balance', value: contract.balance_ton, color: 'text-paper' },
                { label: 'Reward Pool (60%)', value: contract.reward_pool_ton, color: 'text-jade' },
                { label: '大巫 Pool (10%)', value: contract.mudang_pool_ton, color: 'text-gold' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-ink rounded-xl p-3 text-center">
                  <div className={`font-mono text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-smoke/50 text-xs mt-1">TON</div>
                  <div className="text-smoke/40 text-xs">{label}</div>
                </div>
              ))}
            </div>

            {/* Withdraw Buttons */}
            <div className="space-y-3">
              <div className="text-smoke/50 text-xs mb-2">출금 — 오너 지갑에서 직접 서명 필요</div>

              {/* Reward Pool Withdraw */}
              <WithdrawCard
                label="Withdraw Reward Pool"
                sublabel="op 0x3 · withdraw_pool"
                available={contract.reward_pool_ton}
                color="jade"
                contractAddress={contract.address}
                op={3}
                adminKey={adminKey}
              />

              {/* Mudang Pool Withdraw */}
              <WithdrawCard
                label="Withdraw 大巫 Pool"
                sublabel="op 0x2 · withdraw_ops"
                available={contract.mudang_pool_ton}
                color="gold"
                contractAddress={contract.address}
                op={2}
                adminKey={adminKey}
              />
            </div>
          </>
        ) : (
          <div className="text-smoke/50 text-sm text-center py-4">
            NEXT_PUBLIC_TREASURY_ADDRESS or TONCENTER_API_KEY not set
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Users',  value: stats.total_users.toLocaleString(),  color: 'text-jade',   icon: '👥' },
          { label: 'Active Pets',  value: stats.active_pets.toLocaleString(),  color: 'text-spirit', icon: '🐾' },
          { label: '$MUD Mined',   value: (stats.total_mined/1000).toFixed(1)+'K', color: 'text-gold', icon: '⛏' },
          { label: 'Open SOS',     value: String(stats.open_sos),              color: 'text-vermil', icon: '🆘' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-ink-50 border border-gold/10 rounded-xl p-4">
            <div className="text-xl mb-1">{icon}</div>
            <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-smoke/60 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Split */}
      <div className="bg-ink-50 border border-gold/10 rounded-xl p-5 mb-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">수익 분배 (DB 기준)</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Reward Pool (60%)', value: stats.revenue.reward_pool, color: '#27AE60' },
            { label: 'Operations (30%)',  value: stats.revenue.ops,         color: '#3498DB' },
            { label: '大巫 Pool (10%)',    value: stats.revenue.mudang_pool, color: '#D4AF37' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="font-mono text-xl font-bold" style={{ color }}>{value.toFixed(2)}</div>
              <div className="text-smoke/50 text-xs mt-0.5">TON</div>
              <div className="text-smoke/40 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-smoke/10 mt-4 pt-3 text-center">
          <span className="text-smoke/50 text-xs">Total: </span>
          <span className="text-paper font-mono font-bold">{stats.revenue.total.toFixed(2)} TON</span>
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-ink-50 border border-gold/10 rounded-xl p-4">
          <div className="text-smoke/50 text-xs mb-2">Pending Withdrawals</div>
          <div className="font-mono text-xl text-vermil">{stats.pending_withdrawals_count}</div>
          <div className="text-smoke/50 text-xs mt-1">
            {(stats.pending_withdrawals_amount/1000).toFixed(1)}K $MUD total
          </div>
        </div>
        <div className="bg-ink-50 border border-gold/10 rounded-xl p-4">
          <div className="text-smoke/50 text-xs mb-2">Market Listings</div>
          <div className="font-mono text-xl text-jade">{stats.active_listings}</div>
          <div className="text-smoke/50 text-xs mt-1">active</div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-ink-50 border border-gold/10 rounded-xl p-5 mb-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">Top Miners</div>
        <div className="space-y-2">
          {stats.top_users.map((u, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-smoke/40 font-mono w-5">#{i+1}</span>
              <span className="flex-1 text-paper truncate">{u.telegram_name}</span>
              <span className="font-mono text-jade text-xs">{(u.total_earned/1000).toFixed(1)}K</span>
              <span className="font-mono text-gold text-xs">{u.karma_points} karma</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-ink-50 border border-gold/10 rounded-xl p-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-4">Recent Transactions</div>
        <div className="space-y-2">
          {stats.recent_transactions.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-smoke/50 text-xs font-mono">{new Date(tx.created_at).toLocaleTimeString()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tx.type === 'egg_purchase' ? 'bg-jade/20 text-jade' :
                tx.type === 'talisman'     ? 'bg-vermil/20 text-vermil' :
                tx.type === 'nft_buy'      ? 'bg-spirit/20 text-spirit' :
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

// ── Withdraw Card ──────────────────────────────────────────────
function WithdrawCard({
  label, sublabel, available, color, contractAddress, op, adminKey
}: {
  label: string; sublabel: string; available: string
  color: 'jade' | 'gold'; contractAddress: string; op: number; adminKey: string
}) {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const availableNum = parseFloat(available)
  const colorClass = color === 'jade' ? 'text-jade' : 'text-gold'
  const borderClass = color === 'jade' ? 'border-jade/30' : 'border-gold/30'

  async function handleWithdraw() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || amt > availableNum) {
      setStatus('Invalid amount')
      return
    }
    if (op === 2 && !recipient) {
      setStatus('Recipient address required for 大巫 pool withdrawal')
      return
    }

    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/api/admin/withdraw-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey, op, amountTon: amt, recipient }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(`✓ ${data.message}`)
      setAmount('')
    } catch (err: any) {
      setStatus(`✗ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-ink rounded-xl p-4 border ${borderClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-paper text-sm font-medium">{label}</div>
          <div className="text-smoke/40 text-xs">{sublabel}</div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-lg font-bold ${colorClass}`}>{available}</div>
          <div className="text-smoke/40 text-xs">TON available</div>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`Max ${available} TON`}
          step="0.01"
          max={available}
          className="flex-1 bg-ink-50 border border-smoke/20 rounded-lg px-3 py-2 text-paper font-mono text-sm placeholder-smoke/30 outline-none focus:border-gold/40"
        />
        <span className="text-smoke/50 text-xs self-center">TON</span>
      </div>

      {op === 2 && (
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="Recipient TON address (EQ...)"
          className="w-full bg-ink-50 border border-smoke/20 rounded-lg px-3 py-2 text-paper font-mono text-xs placeholder-smoke/30 outline-none focus:border-gold/40 mb-2"
        />
      )}

      <button
        onClick={handleWithdraw}
        disabled={loading || availableNum <= 0}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
          availableNum > 0
            ? color === 'jade'
              ? 'bg-jade/15 text-jade border border-jade/30 hover:bg-jade/25'
              : 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25'
            : 'bg-smoke/10 text-smoke/30 cursor-not-allowed'
        }`}
      >
        {loading ? '⟳ Sending tx...' : availableNum <= 0 ? 'Nothing to withdraw' : `Withdraw ${amount || '...'} TON`}
      </button>

      {status && (
        <div className={`text-xs mt-2 text-center ${status.startsWith('✓') ? 'text-jade' : 'text-vermil'}`}>
          {status}
        </div>
      )}
    </div>
  )
}
