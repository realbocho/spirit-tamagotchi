// src/app/api/crisis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// POST /api/crisis/exorcise — resolve a crisis via TON payment or SOS
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, petId, method, txHash } = body
    // method: 'talisman' | 'sos_complete' | 'mudang_self'

    const supabase = createServiceClient()

    const { data: pet } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .eq('owner_id', userId)
      .single()

    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    if (!pet.crisis_type) return NextResponse.json({ error: 'Pet is not in crisis' }, { status: 400 })

    const now = new Date()

    if (method === 'talisman') {
      if (!txHash) return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 })

      // Verify tx not reused
      const { data: existingTx } = await supabase
        .from('transactions').select('id').eq('tx_hash', txHash).single()
      if (existingTx) return NextResponse.json({ error: 'Transaction already used' }, { status: 400 })

      const cost = 0.5 // TON
      await supabase.from('transactions').insert({
        id: uuidv4(),
        user_id: userId,
        type: 'talisman',
        amount_ton: cost,
        tx_hash: txHash,
        status: 'confirmed',
        metadata: { pet_id: petId, crisis_type: pet.crisis_type },
        created_at: now.toISOString(),
      })

      // Revenue split
      await supabase.from('revenue_splits').insert({
        id: uuidv4(),
        source_tx_hash: txHash,
        total_ton: cost,
        reward_pool: cost * 0.6,
        ops_fund: cost * 0.3,
        mudang_pool: cost * 0.1,
        created_at: now.toISOString(),
      })

    } else if (method === 'sos_complete') {
      // Verify SOS counter reached 15
      const { data: sosRecord } = await supabase
        .from('sos_requests')
        .select('*')
        .eq('pet_id', petId)
        .eq('status', 'pending')
        .single()

      if (!sosRecord || sosRecord.helper_count < 15) {
        return NextResponse.json({ error: 'Not enough helpers yet. Need 15.' }, { status: 400 })
      }

      await supabase.from('sos_requests').update({ status: 'resolved', resolved_at: now.toISOString() }).eq('id', sosRecord.id)

    } else if (method === 'mudang_self') {
      // User has a mudang pet — costs 10% of that pet's purchase cost in MUDANG
      const { data: mudangPet } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .in('rarity', ['mudang', 'grand_mudang'])
        .eq('status', 'alive')
        .limit(1)
        .single()

      if (!mudangPet) return NextResponse.json({ error: 'No Shaman pet available' }, { status: 400 })

      // Deduct MUDANG balance (600 for mudang, 1500 for grand)
      const cost = mudangPet.rarity === 'grand_mudang' ? 1500 : 600
      await supabase.rpc('deduct_mudang_balance', { p_user_id: userId, p_amount: cost })
    }

    // Resolve crisis: restore mining
    await supabase.from('pets').update({
      status: 'alive',
      crisis_type: null,
      crisis_started_at: null,
      crisis_ends_at: null,
      updated_at: now.toISOString(),
    }).eq('id', petId)

    // Restart mining session with 10% boost for talisman
    const boostMultiplier = method === 'talisman' ? 1.1 : 1.0
    await supabase.from('mining_sessions').insert({
      id: uuidv4(),
      pet_id: petId,
      user_id: userId,
      started_at: now.toISOString(),
      amount: 0,
      multiplier: boostMultiplier,
      status: 'active',
    })

    return NextResponse.json({ success: true, message: '煞 resolved. Mining resumed.' })
  } catch (err) {
    console.error('Exorcism error:', err)
    return NextResponse.json({ error: 'Failed to resolve crisis' }, { status: 500 })
  }
}

// POST /api/crisis/sos — create an SOS request
export async function PUT(req: NextRequest) {
  try {
    const { userId, petId } = await req.json()
    const supabase = createServiceClient()

    // Check pet is in crisis
    const { data: pet } = await supabase
      .from('pets').select('*').eq('id', petId).eq('owner_id', userId).single()
    if (!pet || !pet.crisis_type) return NextResponse.json({ error: 'Pet not in crisis' }, { status: 400 })

    // Create/update SOS
    const { data: existing } = await supabase
      .from('sos_requests').select('*').eq('pet_id', petId).eq('status', 'pending').single()

    if (existing) {
      return NextResponse.json({ sos: existing })
    }

    const { data: sos } = await supabase.from('sos_requests').insert({
      id: uuidv4(),
      pet_id: petId,
      owner_id: userId,
      helper_count: 0,
      helper_ids: [],
      status: 'pending',
      created_at: new Date().toISOString(),
    }).select().single()

    return NextResponse.json({ sos })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create SOS' }, { status: 500 })
  }
}
