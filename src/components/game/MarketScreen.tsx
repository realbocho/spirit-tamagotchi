'use client'
// src/components/game/MarketScreen.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { toNano } from '@ton/core'
import PetSprite from './PetSprite'
import { ELEMENT_LABELS, RARITY_LABELS } from '@/lib/fortune-engine'
import toast from 'react-hot-toast'

interface Listing {
  id: string
  price_ton: number
  created_at: string
  pet: any
  seller_name: string
}

export default function MarketScreen() {
  const { user, pets, setPets } = useAppStore()
  const [tonConnectUI] = useTonConnectUI()
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null) // listing id

  useEffect(() => {
    fetch('/api/market')
      .then(r => r.json())
      .then(d => setListings(d.listings || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleBuy(listing: Listing) {
    if (!user) return toast.error('Login required')
    if (listing.pet.owner_id === user.id) return toast.error('Cannot buy your own pet')
    setBuying(listing.id)
    try {
      // Send TON payment
      const tx = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: process.env.NEXT_PUBLIC_TREASURY_ADDRESS!,
          amount: toNano(listing.price_ton).toString(),
          payload: '', // op: buy NFT
        }],
      })

      // Record purchase
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          listingId: listing.id,
          txHash: tx.boc,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`🎉 ${listing.pet.name} is now yours!`)
      setListings(prev => prev.filter(l => l.id !== listing.id))
      // Refresh pets to include newly acquired
      fetch(`/api/pets?userId=${user.id}`)
        .then(r => r.json())
        .then(d => d.pets && setPets(d.pets))
    } catch (err: any) {
      if (err?.message?.includes('User declined')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error(err.message || 'Purchase failed')
      }
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="font-cjk text-gold/50 text-xs tracking-widest mb-1">市場</div>
        <h1 className="font-display text-paper text-2xl">Spirit Market</h1>
        <p className="text-smoke/60 text-xs mt-1">Buy & sell spirit NFTs. 10% marketplace fee.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{ id: 'buy', label: '🛒 Buy Spirits' }, { id: 'sell', label: '💰 List My Spirits' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all
              ${tab === t.id
                ? 'bg-gold/15 border border-gold/40 text-gold'
                : 'bg-smoke/10 text-smoke border border-transparent'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'buy' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-smoke/60 space-y-2">
              <div className="text-2xl animate-spin">☯</div>
              <p className="text-sm">Loading market...</p>
            </div>
          ) : listings.length === 0 ? (
            <EmptyMarket />
          ) : (
            <div className="space-y-3">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`card-ritual rarity-${listing.pet.rarity} p-4`}
                >
                  <div className="flex items-center gap-3">
                    <PetSprite
                      seed={listing.pet.sprite_seed}
                      rarity={listing.pet.rarity}
                      element={listing.pet.element}
                      size={60}
                      animate={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-paper text-sm font-semibold truncate">
                        {listing.pet.name}
                      </div>
                      <div className="text-smoke text-xs">{RARITY_LABELS[listing.pet.rarity]}</div>
                      <div className="text-smoke/70 text-xs">
                        {ELEMENT_LABELS[listing.pet.element]} · Lv.{listing.pet.current_level}
                      </div>
                      <div className="text-xs text-jade mt-0.5">
                        ⛏ {listing.pet.base_mining_rate.toLocaleString()} $MUD/hr
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-gold font-mono font-bold">{listing.price_ton} TON</div>
                      <div className="text-smoke/50 text-xs mb-2">{listing.seller_name}</div>
                      {listing.pet.owner_id !== user?.id ? (
                        <button
                          onClick={() => handleBuy(listing)}
                          disabled={buying === listing.id}
                          className="btn-ritual text-xs py-1.5 px-3"
                        >
                          {buying === listing.id ? '...' : 'Buy'}
                        </button>
                      ) : (
                        <span className="text-xs text-smoke/40">Yours</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-4 px-3 py-2 bg-ink-50 rounded-lg text-xs text-smoke/60">
            <span className="text-paper">Note:</span> Buyer gets a fresh 90-day lifespan. 10% fee taken on sale.
          </div>
        </div>
      )}

      {tab === 'sell' && <SellTab listings={listings} setListings={setListings} />}
    </div>
  )
}

function EmptyMarket() {
  return (
    <div className="text-center py-12">
      <div className="font-cjk text-5xl text-gold/20 mb-3">虛</div>
      <p className="text-smoke/70 text-sm">No spirits for sale right now.</p>
      <p className="text-smoke/50 text-xs mt-1">Be the first to list one!</p>
    </div>
  )
}

function SellTab({ listings, setListings }: { listings: Listing[]; setListings: any }) {
  const { user, pets } = useAppStore()
  const [selectedPetId, setSelectedPetId] = useState('')
  const [price, setPrice] = useState('')
  const [listing, setListing] = useState(false)

  const MIN_PRICES: Record<string, number> = {
    common: 0.5, blessed: 1.5, mudang: 5, grand_mudang: 15,
  }

  // Unlisted alive pets
  const listedPetIds = new Set(listings.map(l => l.pet.id))
  const myPets = pets.filter(p => p.owner_id === user?.id && p.status !== 'dead' && !listedPetIds.has(p.id))
  const selectedPet = myPets.find(p => p.id === selectedPetId)

  async function handleList() {
    if (!user || !selectedPet) return
    const priceTon = parseFloat(price)
    const minP = MIN_PRICES[selectedPet.rarity]
    if (isNaN(priceTon) || priceTon < minP) {
      return toast.error(`Minimum ${minP} TON for ${selectedPet.rarity}`)
    }
    setListing(true)
    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, petId: selectedPet.id, priceTon }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('✓ Listed on market!')
      setSelectedPetId('')
      setPrice('')
      setListings((prev: Listing[]) => [...prev, { ...data.listing, pet: selectedPet, seller_name: user.telegram_name }])
    } catch (err: any) {
      toast.error(err.message || 'Failed to list')
    } finally {
      setListing(false)
    }
  }

  if (myPets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="font-cjk text-5xl text-gold/20 mb-3">無</div>
        <p className="text-smoke/70 text-sm">No spirits available to list.</p>
        <p className="text-smoke/50 text-xs mt-1">Hatch more eggs from the 孵 tab!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-smoke/70 text-xs mb-2">Select Spirit to List</label>
        <div className="space-y-2">
          {myPets.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPetId(p.id)}
              className={`w-full card-ritual rarity-${p.rarity} p-3 flex items-center gap-3 transition-all ${
                selectedPetId === p.id ? 'border-gold/50 bg-gold/5' : ''
              }`}
            >
              <PetSprite seed={p.sprite_seed} rarity={p.rarity} element={p.element} size={44} animate={false} />
              <div className="flex-1 text-left">
                <div className="text-paper text-sm font-medium">{p.name}</div>
                <div className="text-smoke/60 text-xs">{RARITY_LABELS[p.rarity]} · Lv.{p.current_level}</div>
              </div>
              {selectedPetId === p.id && <span className="text-gold">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedPet && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-smoke/70 text-xs mb-2">
            Listing Price (min {MIN_PRICES[selectedPet.rarity]} TON)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder={`${MIN_PRICES[selectedPet.rarity]}`}
              step="0.1"
              min={MIN_PRICES[selectedPet.rarity]}
              className="flex-1 bg-ink border border-smoke/20 rounded-xl px-4 py-3 text-paper placeholder-smoke/30 font-mono focus:border-gold/40 outline-none"
            />
            <span className="flex items-center text-smoke px-2">TON</span>
          </div>
          <button
            onClick={handleList}
            disabled={listing || !price}
            className="w-full btn-ritual mt-3"
          >
            {listing ? 'Listing...' : '✦ List on Market'}
          </button>
        </motion.div>
      )}
    </div>
  )
}
