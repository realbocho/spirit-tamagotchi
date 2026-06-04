export const dynamic = 'force-dynamic'
// src/app/api/pets/[petId]/claim/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// POST /api/pets/:petId/claim — claim accumulated mining rewards
export async function POST(
  req: NextRequest,
  { params }: { params: { petId: string } }
) {
  try {
    const { userId, clientMined } = await req.json()
    const supabase = createServiceClient()

    // Get pet
    const { data: pet } = await supabase
      .from('pets')
      .select('*')
      .eq('id', params.petId)
      .eq('owner_id', userId)
      .single()

    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    if (pet.status === 'cursed') return NextResponse.json({ error: 'Pet is under a curse. Resolve crisis first.' }, { status: 400 })
    if (pet.status === 'dead') return NextResponse.json({ error: 'Pet has passed on.' }, { status: 400 })

    // Check lifecycle
    const now = new Date()
    if (new Date(pet.dies_at) < now) {
      await supabase.from('pets').update({ status: 'dead' }).eq('id', pet.id)
      return NextResponse.json({ error: 'Pet has reached end of life. Perform 薦度齋 (Transcendence).' }, { status: 400 })
    }

    // Get active mining session (use limit+maybeSingle to avoid error on multiple rows)
    const { data: sessionRows } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('pet_id', pet.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
    const session = sessionRows?.[0] || null

    // If no session exists, create one starting NOW (nothing to claim yet)
    if (!session) {
      await supabase.from('mining_sessions').insert({
        id: uuidv4(),
        pet_id: pet.id,
        user_id: userId,
        started_at: now.toISOString(),
        amount: 0,
        multiplier: 1.0,
        status: 'active',
      })
      return NextResponse.json({ error: 'Nothing to claim yet' }, { status: 400 })
    }

    // Calculate earned amount (server-side)
    const sessionStart = new Date(session.started_at)
    const hoursElapsed = (now.getTime() - sessionStart.getTime()) / 3600000
    const serverEarned = Math.floor(hoursElapsed * pet.base_mining_rate * session.multiplier)

    // Use server calculation as source of truth
    // Only use clientMined as fallback when serverEarned is 0 (< 1 minute sessions)
    // Cap clientMined to max 2x serverEarned to prevent manipulation
    const maxAllowed = serverEarned > 0 ? serverEarned * 2 : pet.base_mining_rate // max 1hr if no server data
    // If server says 0 but client shows amount, trust client (short session < 1min or clock skew)
    const earned = serverEarned > 0
      ? serverEarned
      : (clientMined && clientMined > 0 ? Math.min(Math.floor(clientMined), pet.base_mining_rate * 24) : 0)

    console.log('[claim] hoursElapsed:', hoursElapsed.toFixed(4), 'serverEarned:', serverEarned, 'clientMined:', clientMined, 'earned:', earned)

    if (earned <= 0) return NextResponse.json({ error: 'Nothing to claim yet — mine for a bit longer!' }, { status: 400 })

    // Apply 7-day lockup (stored in pending_withdrawals, can use immediately for in-game)
    const lockedAmount = earned
    const lockupEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Update session to claimed
    await supabase.from('mining_sessions').update({
      status: 'claimed',
      claimed_at: now.toISOString(),
      amount: earned,
    }).eq('id', session.id)

    // Create new session
    await supabase.from('mining_sessions').insert({
      id: uuidv4(),
      pet_id: pet.id,
      user_id: userId,
      started_at: now.toISOString(),
      amount: 0,
      multiplier: session.multiplier,
      status: 'active',
    })

    // Add to locked balance (7-day lockup for withdrawal)
    await supabase.from('pending_withdrawals').insert({
      id: uuidv4(),
      user_id: userId,
      pet_id: pet.id,
      amount: lockedAmount,
      lockup_ends_at: lockupEnds.toISOString(),
      status: 'locked',
      created_at: now.toISOString(),
    })

    // Update user's in-game balance (immediately usable for in-game)
    await supabase.rpc('add_mudang_balance', {
      p_user_id: userId,
      p_amount: lockedAmount,
    })

    // Update pet total_mined + XP
    const newXp = pet.xp + Math.floor(earned / 10)
    const xpToNext = pet.xp_to_next
    const levelUp = newXp >= xpToNext
    
    await supabase.from('pets').update({
      total_mined: pet.total_mined + earned,
      xp: levelUp ? newXp - xpToNext : newXp,
      current_level: levelUp ? pet.current_level + 1 : pet.current_level,
      xp_to_next: levelUp ? Math.floor(xpToNext * 1.5) : xpToNext,
      updated_at: now.toISOString(),
    }).eq('id', pet.id)

    return NextResponse.json({
      claimed: earned,
      locked_until: lockupEnds.toISOString(),
      level_up: levelUp,
      new_level: levelUp ? pet.current_level + 1 : pet.current_level,
    })
  } catch (err) {
    console.error('Claim error:', err)
    return NextResponse.json({ error: 'Failed to claim' }, { status: 500 })
  }
}
