export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const petId  = req.nextUrl.searchParams.get('petId')
  const userId = req.nextUrl.searchParams.get('userId')
  if (!petId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createServiceClient()

  // Get ALL active sessions for this pet
  const { data: sessions } = await supabase
    .from('mining_sessions')
    .select('id, started_at, multiplier')
    .eq('pet_id', petId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (!sessions || sessions.length === 0) {
    // No session — create one starting now
    const now = new Date().toISOString()
    await supabase.from('mining_sessions').insert({
      id: uuidv4(),
      pet_id: petId,
      user_id: userId,
      started_at: now,
      amount: 0,
      multiplier: 1.0,
      status: 'active',
    })
    return NextResponse.json({ started_at: now, multiplier: 1.0 })
  }

  // If multiple active sessions exist, keep only the newest one
  const newest = sessions[0]
  if (sessions.length > 1) {
    const oldIds = sessions.slice(1).map(s => s.id)
    await supabase
      .from('mining_sessions')
      .update({ status: 'orphaned' })
      .in('id', oldIds)
  }

  return NextResponse.json({ started_at: newest.started_at, multiplier: newest.multiplier })
}
