'use client'
// src/components/game/ProfileScreen.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react'
import { toNano } from '@ton/core'
import { useAppStore } from '@/lib/store'
import TranscendModal from './TranscendModal'
import toast from 'react-hot-toast'

interface PendingWithdrawal {
  id: string
  amount: number
  lockup_ends_at: string
  status: 'locked' | 'unlocked'
  source_type: string
}

export default function ProfileScreen() {
  const { user, telegramUser, pets, setUser, updatePet } = useAppStore()
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const address = useTonAddress()

  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([])
  const [withdrawing, setWithdrawing] = useState(false)
  const [showTranscend, setShowTranscend] = useState(false)
  const [showWithdrawDetail, setShowWithdrawDetail] = useState(false)

  useEffect(() => {
    if (user) fetchWithdrawals()
  }, [user])

  // Save wallet when connected
  useEffect(() => {
    if (address && user && !user.wallet_address) {
      fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, walletAddress: address }),
      }).then(r => r.json()).then(d => {
        if (d.user) setUser({ ...user, wallet_address: address })
      })
    }
  }, [address, user])

  async function fetchWithdrawals() {
    try {
      const res = await fetch(`/api/withdraw?user_id=${user!.id}`)
      const data = await res.json()
      setWithdrawals(data.withdrawals || [])
    } catch {}
  }

  // Withdraw all unlocked
  async function handleWithdraw() {
    if (!wallet || !user) return toast.error('Connect wallet first')
    const unlockedItems = withdrawals.filter(w => w.status === 'unlocked')
    if (!unlockedItems.length) return toast.error('No unlocked withdrawals')

    setWithdrawing(true)
    try {
      // On-chain claim: send tiny tx to trigger contract withdrawal
      const totalAmount = unlockedItems.reduce((s, w) => s + w.amount, 0)
      toast(`Initiating withdrawal of ${totalAmount.toLocaleString()} $MUDANG...`, { icon: '⏳' })

      // Mark as processing in DB
      await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          withdrawalIds: unlockedItems.map(w => w.id),
        }),
      })

      toast.success(`Withdrawal of ${totalAmount.toLocaleString()} $MUD initiated! Processing on-chain.`)
      // Deduct from store balance immediately
      if (user) {
        useAppStore.getState().setUser({
          ...user,
          mudang_balance: Math.max(0, (user.mudang_balance || 0) - totalAmount),
        })
      }
      await fetchWithdrawals()
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  // Referral share via Telegram or clipboard
  function handleShareReferral() {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'spirit_tamagotchi_bot'
    const refLink = `https://t.me/${botUsername}?startapp=ref_${user?.referral_code}`
    const shareText = `🔮 Join me in Spirit Tamagotchi 巫!\n\nRaise your spirit, mine $MUDANG, beat the curse.\n\n${refLink}`

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      // Use Telegram share sheet
      ;(window as any).Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🔮 Join Spirit Tamagotchi 巫 — K-shamanism Web3 game!')}`
      )
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Share text copied to clipboard!')
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(user?.referral_code || '')
    toast.success('Referral code copied!')
  }

  const now = Date.now()
  const unlocked = withdrawals.filter(w => w.status === 'unlocked')
  const locked   = withdrawals.filter(w => w.status === 'locked')
  const totalUnlocked = unlocked.reduce((s, w) => s + w.amount, 0)
  const totalLocked   = locked.reduce((s, w) => s + w.amount, 0)

  // Karma → gacha bonus
  const karmaBonus = Math.floor((user?.karma_points || 0) / 10)

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">

      {/* ── User Card ── */}
      <div className="card-ritual p-4 flex items-center gap-4">
        {telegramUser?.photo_url ? (
          <img src={telegramUser.photo_url} className="w-14 h-14 rounded-full border border-gold/30" alt="avatar" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-spirit/20 border border-spirit/40 flex items-center justify-center font-cjk text-2xl text-gold">
            {user?.telegram_name?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-display text-paper text-lg font-semibold truncate">{user?.telegram_name}</div>
          {telegramUser?.username && (
            <div className="text-smoke/60 text-sm">@{telegramUser.username}</div>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gold/70 font-cjk">業報</span>
              <span className="text-xs text-gold font-mono">{user?.karma_points || 0} karma</span>
            </div>
            {karmaBonus > 0 && (
              <span className="text-xs bg-gold/15 text-gold border border-gold/30 rounded-full px-2 py-0.5">
                +{karmaBonus}% rare rate
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Wallet ── */}
      <div className="card-ritual p-4">
        <div className="font-cjk text-smoke/60 text-xs mb-3">TON 지갑</div>
        {wallet ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-jade text-xs mb-0.5">● Connected</div>
              <div className="font-mono text-paper/80 text-xs">
                {address?.slice(0, 8)}…{address?.slice(-6)}
              </div>
            </div>
            <button onClick={() => tonConnectUI.disconnect()} className="btn-ghost text-xs py-1.5 px-3">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-smoke text-sm mb-3">Connect wallet for staking & withdrawals</p>
            <button onClick={() => tonConnectUI.openModal()} className="btn-ghost w-full">
              👛 Connect TON Wallet
            </button>
          </div>
        )}
      </div>

      {/* ── $MUDANG Balance + Withdraw ── */}
      <div className="card-ritual p-4">
        <div className="font-cjk text-smoke/60 text-xs mb-3">$MUDANG 잔액</div>

        <div className="flex justify-between items-baseline mb-3">
          <span className="text-smoke text-sm">Total Balance</span>
          <span className="mining-counter text-2xl">{(user?.mudang_balance || 0).toLocaleString()}</span>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-smoke/70">🔒 Locked (7d prayer)</span>
            <span className="font-mono text-smoke">{totalLocked.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-smoke/70">✅ Unlocked</span>
            <span className="font-mono text-jade">{totalUnlocked.toLocaleString()}</span>
          </div>
        </div>

        {/* Locked breakdown toggle */}
        {locked.length > 0 && (
          <button
            onClick={() => setShowWithdrawDetail(!showWithdrawDetail)}
            className="w-full text-left text-xs text-smoke/50 py-1 flex items-center gap-1"
          >
            <span>{showWithdrawDetail ? '▲' : '▼'}</span>
            {locked.length} locked batch{locked.length > 1 ? 'es' : ''}
          </button>
        )}

        <AnimatePresence>
          {showWithdrawDetail && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-1">
                {locked.map(w => {
                  const daysLeft = Math.ceil((new Date(w.lockup_ends_at).getTime() - now) / 86400000)
                  return (
                    <div key={w.id} className="flex justify-between text-xs text-smoke/60">
                      <span className="font-mono">{w.amount.toLocaleString()} $MUD</span>
                      <span>{daysLeft}d remaining</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Withdraw button */}
        {totalUnlocked > 0 ? (
          wallet ? (
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="btn-ritual w-full mt-4 text-sm"
            >
              {withdrawing ? '⟳ Processing...' : `💎 Withdraw ${totalUnlocked.toLocaleString()} $MUD`}
            </button>
          ) : (
            <div className="mt-4 bg-jade/10 border border-jade/30 rounded-xl p-3 text-center">
              <p className="text-jade text-xs mb-2">
                {totalUnlocked.toLocaleString()} $MUD ready to withdraw
              </p>
              <button onClick={() => tonConnectUI.openModal()} className="btn-ghost text-xs py-1.5 px-4">
                Connect Wallet to Withdraw
              </button>
            </div>
          )
        ) : totalLocked > 0 ? (
          <div className="mt-3 text-center text-smoke/40 text-xs py-1">
            Next unlock in {Math.ceil((new Date(locked[0]?.lockup_ends_at).getTime() - now) / 86400000)}d
          </div>
        ) : null}
      </div>

      {/* ── 천도재 (薦度齋) ── */}
      <div className="card-ritual p-4">
        <div className="font-cjk text-smoke/60 text-xs mb-1">薦度齋</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-paper text-sm font-medium">Spirit Transcendence</div>
            <div className="text-smoke/60 text-xs mt-0.5">
              Release a spirit → earn Karma → boost gacha odds
            </div>
            <div className="text-gold/70 text-xs mt-1">
              Current karma: {user?.karma_points || 0}
              {karmaBonus > 0 && ` (+${karmaBonus}% rare rate)`}
            </div>
          </div>
          <button
            onClick={() => setShowTranscend(true)}
            className="btn-ghost text-xs py-2 px-4 flex-shrink-0"
          >
            薦度齋 →
          </button>
        </div>
      </div>

      {/* ── Referral ── */}
      <div className="card-ritual p-4">
        <div className="font-cjk text-smoke/60 text-xs mb-3">소개 코드</div>

        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex-1 bg-ink rounded-xl px-3 py-2.5 font-mono text-gold text-sm text-center cursor-pointer active:opacity-70"
            onClick={handleCopyCode}
          >
            {user?.referral_code}
          </div>
          <button
            onClick={handleCopyCode}
            className="btn-ghost text-xs py-2.5 px-3 flex-shrink-0"
          >
            Copy
          </button>
        </div>

        <button onClick={handleShareReferral} className="btn-ritual w-full text-sm">
          📤 Share via Telegram
        </button>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Share link', icon: '🔗', desc: 'Friend joins' },
            { label: 'They hatch', icon: '🥚', desc: '+50 Karma' },
            { label: 'You earn', icon: '✨', desc: '+100 Karma' },
          ].map(({ label, icon, desc }) => (
            <div key={label} className="bg-ink rounded-xl py-2 px-1">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-smoke/80 text-xs">{label}</div>
              <div className="text-gold text-xs font-mono">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="card-ritual p-4">
        <div className="font-cjk text-smoke/60 text-xs mb-3">통계</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Mined', value: (user?.total_earned || 0).toLocaleString() + ' $MUD', color: 'text-jade' },
            { label: 'Karma Points', value: (user?.karma_points || 0).toLocaleString(), color: 'text-gold' },
            { label: 'Spirits Owned', value: String(pets.filter(p => p.owner_id === user?.id && p.status !== 'dead' && p.status !== 'transcended').length), color: 'text-spirit' },
            { label: 'Rare Rate Bonus', value: karmaBonus > 0 ? `+${karmaBonus}%` : 'None yet', color: karmaBonus > 0 ? 'text-vermil' : 'text-smoke/50' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-ink rounded-xl p-3 text-center">
              <div className={`font-mono text-lg font-semibold ${color}`}>{value}</div>
              <div className="text-smoke/60 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transcend Modal ── */}
      {showTranscend && (
        <TranscendModal
          pets={pets.filter(p => p.owner_id === user?.id)}
          onClose={() => setShowTranscend(false)}
          onTranscended={(petId, karma) => {
            updatePet(petId, { status: 'transcended' })
            toast.success(`✨ +${karma} Karma earned!`)
          }}
        />
      )}
    </div>
  )
}
