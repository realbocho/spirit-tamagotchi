export const dynamic = 'force-dynamic'
// src/app/api/pets/transcend/route.ts
// 천도재(薦度齋) — voluntary pet burn → karma points → better gacha odds
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Karma gained by rarity
const KARMA_BY_RARITY: Record<string, number> = {
  common: 10, blessed: 30, mudang: 80, grand_mudang: 200,
}
// Karma gained bonus from level
const karmaForPet = (rarity: string, level: number) =>
  Math.floor((KARMA_BY_RARITY[rarity] || 10) * (1 + (level - 1) * 0.1))

export async function POST(req: NextRequest) {
  try {
    const { userId, petId } = await req.json()
    const supabase = createServiceClient()

    const { data: pet } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .eq('owner_id', userId)
      .single()

    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    if (pet.status === 'transcended' || pet.status === 'dead') {
      return NextResponse.json({ error: 'Pet is already gone' }, { status: 400 })
    }

    const karma = karmaForPet(pet.rarity, pet.current_level)
    const now = new Date().toISOString()

    // Mark pet as transcended + add karma to user
    const [petResult] = await Promise.all([
      supabase.from('pets').update({
        status: 'transcended',
        updated_at: now,
      }).eq('id', petId),

      supabase.rpc('add_mudang_balance', { p_user_id: userId, p_amount: 0 }), // no-op, just for RPC test
    ])

    // Add karma via direct update
    const { data: user } = await supabase
      .from('users')
      .select('karma_points')
      .eq('id', userId)
      .single()

    await supabase
      .from('users')
      .update({ karma_points: (user?.karma_points || 0) + karma })
      .eq('id', userId)

    // Stop active mining session for this pet
    await supabase
      .from('mining_sessions')
      .update({ status: 'paused' })
      .eq('pet_id', petId)
      .eq('status', 'active')

    return NextResponse.json({ ok: true, karma, petId, rarity: pet.rarity })
  } catch (err) {
    console.error('[pets/transcend]', err)
    return NextResponse.json({ error: 'Transcendence failed' }, { status: 500 })
  }
}
