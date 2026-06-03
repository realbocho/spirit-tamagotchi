// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServiceClient()

  // Top 50 by total_mined, joined with best pet
  const { data: users } = await supabase
    .from('users')
    .select('id, telegram_name, photo_url, total_earned')
    .order('total_earned', { ascending: false })
    .limit(50)

  if (!users?.length) return NextResponse.json({ entries: [] })

  // Fetch best pet for each user
  const userIds = users.map(u => u.id)
  const { data: pets } = await supabase
    .from('pets')
    .select('owner_id, rarity, current_level, total_mined')
    .in('owner_id', userIds)
    .in('status', ['alive', 'cursed'])
    .order('current_level', { ascending: false })

  // Build lookup: best pet per user
  const bestPet: Record<string, { rarity: string; level: number; mined: number }> = {}
  const rarityRank: Record<string, number> = { grand_mudang: 4, mudang: 3, blessed: 2, common: 1 }
  for (const pet of pets || []) {
    const existing = bestPet[pet.owner_id]
    if (!existing || rarityRank[pet.rarity] > rarityRank[existing.rarity]) {
      bestPet[pet.owner_id] = { rarity: pet.rarity, level: pet.current_level, mined: pet.total_mined }
    }
  }

  const entries = users.map((u, i) => ({
    rank: i + 1,
    user_id: u.id,
    telegram_name: u.telegram_name,
    photo_url: u.photo_url,
    total_mined: u.total_earned,
    pet_rarity: bestPet[u.id]?.rarity || 'common',
    pet_level: bestPet[u.id]?.level || 1,
  }))

  return NextResponse.json({ entries })
}
