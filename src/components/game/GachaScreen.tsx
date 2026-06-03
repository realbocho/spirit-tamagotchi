'use client'
// src/components/game/GachaScreen.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { useAppStore } from '@/lib/store'
import PetSprite from './PetSprite'
import { RARITY_LABELS, ELEMENT_LABELS } from '@/lib/fortune-engine'
import { Pet } from '@/types'
import toast from 'react-hot-toast'
import { toNano } from '@ton/core'

const EGGS = [
  {
    type: 'free',
    name: '一般 Common Egg',
    price: 'FREE',
    priceTon: 0,
    description: 'One free egg per account. Mostly common spirits.',
    odds: [{ label: 'Common', pct: 99, color: 'text-smoke' }, { label: 'Blessed', pct: 1, color: 'text-jade-light' }],
    gradient: 'from-smoke/20 to-smoke/5',
    border: 'border-smoke/30',
    emoji: '🥚',
  },
  {
    type: 'blessed',
    name: '靈驗 Blessed Egg',
    price: '3 TON',
    priceTon: 3,
    description: 'Higher chance of powerful spirits. Good luck boost.',
    odds: [{ label: 'Common', pct: 15, color: 'text-smoke' }, { label: 'Blessed', pct: 75, color: 'text-jade-light' }, { label: 'Shaman', pct: 10, color: 'text-spirit-light' }],
    gradient: 'from-jade/20 to-jade/5',
    border: 'border-jade/40',
    emoji: '🌟',
  },
  {
    type: 'divine',
    name: '神降 Divine Egg',
    price: '10 TON',
    priceTon: 10,
    description: 'Rare Grand Shaman possible. Earns passive TON income.',
    odds: [{ label: 'Blessed', pct: 60, color: 'text-jade-light' }, { label: 'Shaman', pct: 35, color: 'text-spirit-light' }, { label: 'Grand Shaman', pct: 5, color: 'text-gold' }],
    gradient: 'from-gold/20 to-gold/5',
    border: 'border-gold/50',
    emoji: '🔮',
  },
]

export default function GachaScreen() {
  const { user, allPets, setAllPets, setActivePet } = useAppStore()
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const [selectedEgg, setSelectedEgg] = useState<string | null>(null)
  const [isHatching, setIsHatching] = useState(false)
  const [hatchResult, setHatchResult] = useState<Pet | null>(null)
  const [birthYear, setBirthYear] = useState('')
  const [showBirthInput, setShowBirthInput] = useState(false)

  const hasUsedFreeEgg = !user?.has_free_egg
  const canHatch = selectedEgg && !isHatching && (selectedEgg !== 'free' || !hasUsedFreeEgg)

  const handleHatch = async () => {
    if (!user || !selectedEgg || isHatching) return

    const egg = EGGS.find(e => e.type === selectedEgg)!

    if (egg.priceTon > 0 && !wallet) {
      toast('Connect your TON wallet first', { icon: '👛' })
      tonConnectUI.openModal()
      return
    }

    setIsHatching(true)
    let txHash: string | undefined

    try {
      // Paid eggs: send TON first
      if (egg.priceTon > 0) {
        const result = await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [{
            address: process.env.NEXT_PUBLIC_TREASURY_ADDRESS!,
            amount: toNano(egg.priceTon).toString(),
            payload: btoa(`egg:${egg.type}:${user.id}`),
          }],
        })
        txHash = result.boc
      }

      // Mint pet
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          eggType: selectedEgg,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
          txHash,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setHatchResult(data.pet)
      setAllPets([data.pet, ...allPets])
      if (!allPets.find(p => p.status === 'alive')) {
        setActivePet(data.pet)
      }
    } catch (err: any) {
      if (err?.message?.includes('Reject')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error(err.message || 'Hatching failed')
      }
    } finally {
      setIsHatching(false)
    }
  }

  if (hatchResult) {
    return <HatchResult pet={hatchResult} onDone={() => { setHatchResult(null); setSelectedEgg(null) }} />
  }

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="font-cjk text-gold/50 text-sm mb-1">靈物孵化</div>
        <h2 className="font-display text-paper text-xl font-bold">Hatch a Spirit Egg</h2>
        <p className="text-smoke text-xs mt-1">
          Your spirit's power is shaped by your birth date & fate
        </p>
      </div>

      {/* Birth year input (optional, for better saju) */}
      <div className="mb-5">
        <button
          onClick={() => setShowBirthInput(!showBirthInput)}
          className="w-full text-left px-4 py-2 rounded-xl border border-smoke/20 text-smoke text-sm flex justify-between items-center"
        >
          <span>🗓 Enter birth year for better 四柱 alignment</span>
          <span>{showBirthInput ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence>
          {showBirthInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                type="number"
                placeholder="e.g. 1995"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full mt-2 px-4 py-2 bg-ink-50 border border-smoke/20 rounded-xl text-paper text-sm
                           focus:border-gold/50 focus:outline-none placeholder-smoke/40"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Egg selection */}
      <div className="space-y-3 mb-5">
        {EGGS.map((egg) => {
          const disabled = egg.type === 'free' && hasUsedFreeEgg
          const selected = selectedEgg === egg.type

          return (
            <motion.button
              key={egg.type}
              onClick={() => !disabled && setSelectedEgg(egg.type)}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`w-full p-4 rounded-2xl border transition-all duration-200 text-left
                bg-gradient-to-br ${egg.gradient} ${egg.border}
                ${selected ? 'ring-2 ring-gold scale-[1.01]' : ''}
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{egg.emoji}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-display text-paper text-sm font-semibold">{egg.name}</span>
                    <span className={`font-mono text-sm font-bold ${egg.priceTon === 0 ? 'text-jade-light' : 'text-gold'}`}>
                      {disabled ? 'USED' : egg.price}
                    </span>
                  </div>
                  <p className="text-smoke text-xs mt-1">{egg.description}</p>
                  <div className="flex gap-2 mt-2">
                    {egg.odds.map((o) => (
                      <span key={o.label} className={`text-xs ${o.color}`}>
                        {o.label} {o.pct}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Wallet connect or hatch button */}
      {!wallet && selectedEgg && selectedEgg !== 'free' ? (
        <button onClick={() => tonConnectUI.openModal()} className="btn-ghost w-full">
          👛 Connect Wallet to Continue
        </button>
      ) : (
        <button
          onClick={handleHatch}
          disabled={!canHatch}
          className={`w-full py-4 rounded-2xl font-display text-base transition-all duration-200
            ${canHatch ? 'btn-ritual animate-pulse-glow' : 'bg-smoke/10 text-smoke/40 cursor-not-allowed'}`}
        >
          {isHatching ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span> Hatching...
            </span>
          ) : (
            '🥚 Hatch Egg 孵化'
          )}
        </button>
      )}

      {/* Existing pets */}
      {allPets.length > 0 && (
        <div className="mt-8">
          <div className="brush-divider mb-4" />
          <h3 className="font-display text-smoke text-sm mb-3">Your Spirits ({allPets.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {allPets.map((pet) => (
              <div key={pet.id} className={`card-ritual rarity-${pet.rarity} p-2 text-center`}>
                <PetSprite seed={pet.sprite_seed} rarity={pet.rarity} element={pet.element} status={pet.status} size={48} />
                <div className="text-xs text-smoke mt-1 truncate">{pet.name}</div>
                <div className={`text-xs ${pet.status === 'alive' ? 'text-jade-light' : pet.status === 'cursed' ? 'text-vermil-light' : 'text-smoke/40'}`}>
                  {pet.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HatchResult({ pet, onDone }: { pet: Pet; onDone: () => void }) {
  const rarityColors: Record<string, string> = {
    common: 'text-smoke', blessed: 'text-jade-light',
    mudang: 'text-spirit-light', grand_mudang: 'text-gold',
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">
      {/* Radial burst */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative mb-6"
      >
        {/* Glow rings */}
        {[1.5, 1.8, 2.1].map((scale, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale, opacity: 0 }}
            transition={{ delay: i * 0.15, duration: 0.8 }}
            className="absolute inset-0 rounded-full border border-gold"
          />
        ))}
        <PetSprite seed={pet.sprite_seed} rarity={pet.rarity} element={pet.element} status={pet.status} size={120} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <div className="text-smoke text-xs mb-1">A new spirit has awakened!</div>
        <h2 className="font-display text-paper text-2xl font-bold mb-1">{pet.name}</h2>
        <div className={`font-cjk text-lg mb-3 ${rarityColors[pet.rarity]}`}>
          {RARITY_LABELS[pet.rarity]}
        </div>
        <div className="flex gap-3 justify-center mb-6">
          <span className="px-3 py-1 bg-spirit/20 border border-spirit/40 rounded-full text-xs text-spirit-light">
            {ELEMENT_LABELS[pet.element]}
          </span>
          <span className="px-3 py-1 bg-jade/20 border border-jade/40 rounded-full text-xs text-jade-light">
            Lv. 1
          </span>
        </div>

        <div className="card-ritual p-4 mb-6 text-left text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-smoke">Base Mining Rate</span>
            <span className="text-gold font-mono">{pet.base_mining_rate.toLocaleString()} $MUD/hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">Lifespan</span>
            <span className="text-paper">90 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-smoke">Luck Stat</span>
            <span className="text-paper">{pet.luck_stat}/100</span>
          </div>
        </div>

        <button onClick={onDone} className="btn-ritual px-10">
          Begin Mining ⛏
        </button>
      </motion.div>
    </div>
  )
}
