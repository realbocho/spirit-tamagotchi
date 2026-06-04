export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const petId  = req.nextUrl.searchParams.get('petId')
  const userId = req.nextUrl.searchParams.get('userId')
  if (!petId || !userId) return NextResponse.json({ mined: 0 })

  const supabase = createServiceClient()

  const { data: sessions } = await supabase
    .from('mining_sessions')
    .select('started_at, multiplier')
    .eq('pet_id', petId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)

  const session = sessions?.[0]
  if (!session) return NextResponse.json({ mined: 0 })

  const { data: pet } = await supabase
    .from('pets')
    .select('base_mining_rate')
    .eq('id', petId)
    .single()

  if (!pet) return NextResponse.json({ mined: 0 })

  const hoursElapsed = (Date.now() - new Date(session.started_at).getTime()) / 3600000
  const mined = Math.floor(hoursElapsed * pet.base_mining_rate * session.multiplier)

  return NextResponse.json({ mined, started_at: session.started_at })
}
