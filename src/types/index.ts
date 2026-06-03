// src/types/index.ts

export type PetRarity = 'common' | 'blessed' | 'mudang' | 'grand_mudang'
export type Element5 = 'wood' | 'fire' | 'earth' | 'metal' | 'water'
export type PetStatus = 'alive' | 'cursed' | 'dead' | 'transcended'
export type EggType = 'free' | 'blessed' | 'divine'
export type FortuneScore = 'great_luck' | 'luck' | 'neutral' | 'misfortune' | 'great_misfortune'
export type CrisisType = 'sal' | 'samjae' | null

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

export interface User {
  id: string                    // UUID
  telegram_id: number
  telegram_username?: string
  telegram_name: string
  photo_url?: string
  wallet_address?: string
  device_uuid?: string
  mudang_balance: number        // $MUDANG token balance (in-game)
  total_earned: number
  referral_code: string
  referred_by?: string
  karma_points: number          // 業報 points
  has_free_egg: boolean
  tutorial_complete: boolean
  birth_year?: number
  birth_month?: number
  birth_day?: number
  created_at: string
  last_active: string
}

export interface Pet {
  id: string
  owner_id: string
  name: string
  rarity: PetRarity
  element: Element5
  status: PetStatus

  // 四柱八字 stats (0-100)
  luck_stat: number
  vitality_stat: number
  wealth_stat: number
  wisdom_stat: number

  // Mining
  base_mining_rate: number      // $MUDANG per hour
  total_mined: number
  current_level: number
  xp: number
  xp_to_next: number

  // Lifecycle
  born_at: string
  dies_at: string               // born_at + 90 days

  // Crisis
  crisis_type: CrisisType
  crisis_started_at?: string
  crisis_ends_at?: string

  // NFT
  token_id?: number
  on_chain: boolean
  mint_tx_hash?: string

  // Visual
  sprite_seed: number

  created_at: string
  updated_at: string
}

export interface DailyFortune {
  id: string
  user_id: string
  date: string                  // YYYY-MM-DD
  score: number                 // 0-100
  label: FortuneScore
  mining_multiplier: number     // 0.5 - 1.5
  element_of_day: Element5
  advisory_text: string
  stem_branch?: string          // 天干地支 label
  created_at: string
}

export interface MiningSession {
  id: string
  pet_id: string
  user_id: string
  started_at: string
  claimed_at?: string
  amount: number
  multiplier: number
  status: 'active' | 'claimable' | 'claimed'
}

export interface Transaction {
  id: string
  user_id: string
  type: 'egg_purchase' | 'exorcism' | 'talisman' | 'withdraw' | 'nft_sale' | 'nft_buy' | 'referral_reward'
  amount_ton: number
  amount_mudang?: number
  tx_hash?: string
  status: 'pending' | 'confirmed' | 'failed'
  metadata?: Record<string, unknown>
  created_at: string
}

export interface NFTListing {
  id: string
  pet_id: string
  seller_id: string
  price_ton: number
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  sold_at?: string
  buyer_id?: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  telegram_name: string
  photo_url?: string
  total_mined: number
  pet_rarity: PetRarity
  pet_level: number
}

// TON Connect types
export interface WalletConnection {
  address: string
  chain: '-239' | '-3'  // mainnet | testnet
  publicKey: string
}
