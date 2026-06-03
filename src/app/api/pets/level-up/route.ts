// src/app/api/pets/level-up/route.ts
// Called when a pet accumulates enough XP; spends $MUDANG to level up
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const LEVEL_COSTS: Record<number, number> = {
  1: 100, 2: 250, 3: 500, 4: 1000, 5: 2000,
  6: 4000, 7: 8000, 8: 16000, 9: 32000,
}
const MAX_LEVEL = 10

export async function POST(req: NextRequest) {
  try {
    const { userId, petId } = await req.json()
    const supabase = createServiceClient()

    const [{ data: pet }, { data: user }] = await Promise.all([
      supabase.from('pets').select('*').eq('id', petId).eq('owner_id', userId).single(),
      supabase.from('users').select('mudang_balance').eq('id', userId).single(),
    ])

    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (pet.current_level >= MAX_LEVEL) return NextResponse.json({ error: 'Already max level' }, { status: 400 })
    if (pet.xp < pet.xp_to_next) return NextResponse.json({ error: 'Not enough XP' }, { status: 400 })

    const cost = LEVEL_COSTS[pet.current_level] || 100
    if (user.mudang_balance < cost) {
      return NextResponse.json({ error: `Need ${cost} $MUDANG to level up` }, { status: 400 })
    }

    const newLevel = pet.current_level + 1
    const newXpToNext = Math.floor(pet.xp_to_next * 1.8)
    const miningBoost = Math.floor(pet.base_mining_rate * 0.15) // +15% per level

    const now = new Date().toISOString()

    // Deduct $MUDANG and level up pet
    const { error: balanceErr } = await supabase.rpc('deduct_mudang_balance', {
      p_user_id: userId,
      p_amount: cost,
    })
    if (balanceErr) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const { data: updatedPet } = await supabase
      .from('pets')
      .update({
        current_level: newLevel,
        xp: 0,
        xp_to_next: newXpToNext,
        base_mining_rate: pet.base_mining_rate + miningBoost,
        // Improve stats slightly
        luck_stat: Math.min(100, pet.luck_stat + 2),
        vitality_stat: Math.min(100, pet.vitality_stat + 2),
        wealth_stat: Math.min(100, pet.wealth_stat + 3),
        wisdom_stat: Math.min(100, pet.wisdom_stat + 2),
        updated_at: now,
      })
      .eq('id', petId)
      .select()
      .single()

    return NextResponse.json({
      ok: true,
      pet: updatedPet,
      cost,
      newLevel,
      miningBoost,
    })
  } catch (err) {
    console.error('[pets/level-up]', err)
    return NextResponse.json({ error: 'Level up failed' }, { status: 500 })
  }
}
