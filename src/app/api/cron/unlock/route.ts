// src/app/api/cron/unlock/route.ts
// Called daily by cron-job.org
// Schedule: 0 0 * * * (midnight UTC)
// URL: POST https://your-app.vercel.app/api/cron/unlock
// Header: x-cron-secret: YOUR_CRON_SECRET

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()
  const results: Record<string, number> = {}

  // 1. Unlock pending withdrawals past lockup period
  const { data: unlockedData } = await supabase
    .from('pending_withdrawals')
    .update({ status: 'unlocked' })
    .eq('status', 'locked')
    .lt('lockup_ends_at', now)
    .select('id')

  results.unlocked_withdrawals = unlockedData?.length || 0

  // 2. Mark expired pets as dead
  const { data: expiredPets } = await supabase
    .from('pets')
    .update({ status: 'dead', updated_at: now })
    .in('status', ['alive', 'cursed'])
    .lt('dies_at', now)
    .select('id, owner_id')

  results.expired_pets = expiredPets?.length || 0

  // 3. Pause mining for dead pets
  if (expiredPets?.length) {
    const petIds = expiredPets.map(p => p.id)
    await supabase
      .from('mining_sessions')
      .update({ status: 'paused' })
      .in('pet_id', petIds)
      .eq('status', 'active')
  }

  // 4. Expire SOS requests older than 7 days
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: expiredSOSData } = await supabase
    .from('sos_requests')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', weekAgo)
    .select('id')

  results.expired_sos = expiredSOSData?.length || 0

  // 5. Distribute mudang_pool to grand_mudang holders (weekly)
  const dayOfWeek = new Date().getDay()
  if (dayOfWeek === 0) { // Sunday
    // TODO: distribute accumulated mudang_pool to grand_mudang holders
    // This requires querying total mudang_pool and splitting among holders
    results.pool_distribution = 0
  }

  console.log('[CRON] unlock results:', results)
  return NextResponse.json({ ok: true, ...results })
}
