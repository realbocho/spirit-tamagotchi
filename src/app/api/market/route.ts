export const dynamic = 'force-dynamic'
// src/app/api/market/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const MIN_PRICES: Record<string, number> = {
  common: 0.5, blessed: 1.5, mudang: 5, grand_mudang: 15
}

// GET - fetch active listings
export async function GET() {
  const supabase = createServiceClient()
  const { data: listings } = await supabase
    .from('nft_listings')
    .select(`
      id, price_ton, created_at,
      pet:pets(*),
      seller:users(telegram_name)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ listings: listings || [] })
}

// POST - list a pet
export async function POST(req: NextRequest) {
  try {
    const { userId, petId, priceTon } = await req.json()
    const supabase = createServiceClient()

    const { data: pet } = await supabase.from('pets').select('*').eq('id', petId).eq('owner_id', userId).single()
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    if (pet.status === 'cursed') return NextResponse.json({ error: 'Cannot list a cursed pet' }, { status: 400 })

    const minPrice = MIN_PRICES[pet.rarity] || 0.5
    if (priceTon < minPrice) {
      return NextResponse.json({ error: `Minimum price is ${minPrice} TON` }, { status: 400 })
    }

    const { data: listing } = await supabase.from('nft_listings').insert({
      id: uuidv4(),
      pet_id: petId,
      seller_id: userId,
      price_ton: priceTon,
      status: 'active',
      created_at: new Date().toISOString(),
    }).select().single()

    return NextResponse.json({ listing })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to list' }, { status: 500 })
  }
}
