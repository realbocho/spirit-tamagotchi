export const dynamic = 'force-dynamic'
// src/app/api/auth/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, walletAddress } = await req.json()
    const supabase = createServiceClient()

    // Check wallet not already linked to another user
    const { data: existing } = await supabase
      .from('users')
      .select('id, telegram_id')
      .eq('wallet_address', walletAddress)
      .neq('id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Wallet already linked to another account' }, { status: 400 })
    }

    await supabase.from('users').update({ wallet_address: walletAddress }).eq('id', userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 })
  }
}
