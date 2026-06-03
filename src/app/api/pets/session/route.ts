export const dynamic = 'force-dynamic'
// src/app/api/pets/session/route.ts
// Returns the active mining session start time for a pet
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const petId  = req.nextUrl.searchParams.get('petId')
  const userId = req.nextUrl.searchParams.get('userId')
  if (!petId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: session } = await supabase
    .from('mining_sessions')
    .select('started_at, multiplier')
    .eq('pet_id', petId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    // Create a new session if none exists
    const { data: pet } = await supabase
      .from('pets')
      .select('base_mining_rate')
      .eq('id', petId)
      .single()

    const now = new Date().toISOString()
    const { data: newSession } = await supabase
      .from('mining_sessions')
      .insert({
        id: uuidv4(),
        pet_id: petId,
        user_id: userId,
        started_at: now,
        amount: 0,
        multiplier: 1.0,
        status: 'active',
      })
      .select('started_at, multiplier')
      .single()

    return NextResponse.json({ started_at: newSession?.started_at || now, multiplier: 1.0 })
  }

  return NextResponse.json({ started_at: session.started_at, multiplier: session.multiplier })
}
