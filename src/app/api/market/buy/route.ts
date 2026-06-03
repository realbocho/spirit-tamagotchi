export const dynamic = 'force-dynamic'
// src/app/api/market/buy/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { buyerId, listingId, txHash } = await req.json()
    if (!buyerId || !listingId || !txHash) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch listing
    const { data: listing } = await supabase
      .from('nft_listings')
      .select('*, pet:pets(*)')
      .eq('id', listingId)
      .eq('status', 'active')
      .single()

    if (!listing) return NextResponse.json({ error: 'Listing not found or already sold' }, { status: 404 })
    if (listing.seller_id === buyerId) return NextResponse.json({ error: 'Cannot buy your own pet' }, { status: 400 })

    // Verify tx hasn't been used before
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('tx_hash', txHash)
      .single()
    if (existingTx) return NextResponse.json({ error: 'Transaction already used' }, { status: 400 })

    const now = new Date().toISOString()
    const PLATFORM_FEE = 0.10 // 10%
    const sellerReceives = listing.price_ton * (1 - PLATFORM_FEE)
    const bornAt = new Date(now)
    const diesAt = new Date(bornAt.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

    // Transfer: update pet owner, reset lifespan, mark listing sold
    const [petResult, listingResult] = await Promise.all([
      supabase.from('pets').update({
        owner_id: buyerId,
        born_at: now,
        dies_at: diesAt,
        updated_at: now,
      }).eq('id', listing.pet_id),

      supabase.from('nft_listings').update({
        status: 'sold',
        sold_at: now,
        buyer_id: buyerId,
      }).eq('id', listingId),
    ])

    // Record transaction
    await supabase.from('transactions').insert({
      id: uuidv4(),
      user_id: buyerId,
      type: 'nft_buy',
      amount_ton: listing.price_ton,
      tx_hash: txHash,
      status: 'confirmed',
      metadata: {
        listing_id: listingId,
        pet_id: listing.pet_id,
        seller_id: listing.seller_id,
        seller_receives: sellerReceives,
      },
      created_at: now,
    })

    return NextResponse.json({ ok: true, petId: listing.pet_id })
  } catch (err) {
    console.error('[market/buy]', err)
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
  }
}
