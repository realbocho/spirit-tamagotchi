// src/app/api/pets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rollRarity, generatePetStats, BASE_MINING_RATES, calculateBirthElement } from '@/lib/fortune-engine'
import { v4 as uuidv4 } from 'uuid'
import { EggType, PetRarity, Element5 } from '@/types'

const EGG_PRICES_TON: Record<EggType, number> = {
  free: 0,
  blessed: 3,
  divine: 10,
}

// GET /api/pets?user_id=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: pets, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pets })
}

// POST /api/pets — mint a new pet from egg
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, eggType, birthYear, birthMonth, birthDay, txHash } = body

    const supabase = createServiceClient()

    // Fetch user
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const eggT = eggType as EggType
    const price = EGG_PRICES_TON[eggT]

    // Free egg: check user hasn't used it
    if (eggT === 'free') {
      if (!user.has_free_egg) {
        return NextResponse.json({ error: 'Free egg already used' }, { status: 400 })
      }
    } else {
      // Paid egg: verify TON transaction
      if (!txHash) {
        return NextResponse.json({ error: 'Transaction hash required for paid eggs' }, { status: 400 })
      }
      // TODO: verify tx on TON chain via tonapi.io
      // For now, record and trust (real impl should verify on-chain)
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('tx_hash', txHash)
        .single()
      
      if (existingTx) {
        return NextResponse.json({ error: 'Transaction already used' }, { status: 400 })
      }
    }

    // Generate pet
    const seed = parseInt(userId.replace(/-/g, '').slice(0, 8), 16) + Date.now()
    const rarity: PetRarity = rollRarity(eggType, seed)
    const element: Element5 = birthYear
      ? calculateBirthElement(birthYear, birthMonth || 1, birthDay || 1)
      : (['wood','fire','earth','metal','water'] as Element5[])[seed % 5]

    const stats = generatePetStats(rarity, element, seed)
    const miningRate = BASE_MINING_RATES[rarity]

    const now = new Date()
    const diesAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days

    const petNames: Record<PetRarity, string[]> = {
      common:       ['Baby Dokkaebi', 'Little Goblin', 'Spirit Pup', 'Tiny Gumiho', 'Wisp'],
      blessed:      ['Jade Fox', 'Thunder Turtle', 'Cloud Crane', 'Moon Bear', 'River Dragon'],
      mudang:       ['Spirit Shaman', 'Sacred Crow', 'Fire Phoenix', 'Storm Wolf', 'Void Cat'],
      grand_mudang: ['Grand Oracle', 'Celestial Tiger', 'Heavenly Serpent', 'Star Tortoise'],
    }
    const namePool = petNames[rarity]
    const petName = namePool[seed % namePool.length]

    const pet = {
      id: uuidv4(),
      owner_id: userId,
      name: petName,
      rarity,
      element,
      status: 'alive',
      luck_stat: stats.luck,
      vitality_stat: stats.vitality,
      wealth_stat: stats.wealth,
      wisdom_stat: stats.wisdom,
      base_mining_rate: miningRate,
      total_mined: 0,
      current_level: 1,
      xp: 0,
      xp_to_next: 100,
      born_at: now.toISOString(),
      dies_at: diesAt.toISOString(),
      crisis_type: null,
      crisis_started_at: null,
      crisis_ends_at: null,
      on_chain: false,
      sprite_seed: seed % 10000,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }

    const { data: createdPet, error: petError } = await supabase
      .from('pets')
      .insert(pet)
      .select()
      .single()

    if (petError) throw petError

    // Create initial mining session
    await supabase.from('mining_sessions').insert({
      id: uuidv4(),
      pet_id: pet.id,
      user_id: userId,
      started_at: now.toISOString(),
      amount: 0,
      multiplier: 1.0,
      status: 'active',
    })

    // Mark free egg used
    if (eggT === 'free') {
      await supabase.from('users').update({ has_free_egg: false }).eq('id', userId)
    } else {
      // Record transaction
      await supabase.from('transactions').insert({
        id: uuidv4(),
        user_id: userId,
        type: 'egg_purchase',
        amount_ton: price,
        tx_hash: txHash,
        status: 'confirmed',
        metadata: { egg_type: eggType, pet_id: pet.id },
        created_at: now.toISOString(),
      })

      // Split revenue: 60% reward pool, 30% ops, 10% mudang pool
      await supabase.from('revenue_splits').insert({
        id: uuidv4(),
        source_tx_hash: txHash,
        total_ton: price,
        reward_pool: price * 0.6,
        ops_fund: price * 0.3,
        mudang_pool: price * 0.1,
        created_at: now.toISOString(),
      })
    }

    return NextResponse.json({ pet: createdPet })
  } catch (err) {
    console.error('Mint pet error:', err)
    return NextResponse.json({ error: 'Failed to mint pet' }, { status: 500 })
  }
}
