// src/app/api/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: withdrawals } = await supabase
    .from('pending_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['locked', 'unlocked'])
    .order('created_at', { ascending: false })

  return NextResponse.json({ withdrawals: withdrawals || [] })
}

// POST — mark unlocked withdrawals as "processing"
export async function POST(req: NextRequest) {
  try {
    const { userId, withdrawalIds } = await req.json()
    if (!userId || !withdrawalIds?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify all belong to user and are unlocked
    const { data: items } = await supabase
      .from('pending_withdrawals')
      .select('id, status, amount')
      .eq('user_id', userId)
      .in('id', withdrawalIds)
      .eq('status', 'unlocked')

    if (!items?.length) {
      return NextResponse.json({ error: 'No unlocked withdrawals found' }, { status: 400 })
    }

    const totalAmount = items.reduce((s, w) => s + w.amount, 0)

    // Mark as processing
    await supabase
      .from('pending_withdrawals')
      .update({ status: 'processing' })
      .in('id', items.map(w => w.id))

    // Deduct from mudang_balance
    await supabase.rpc('deduct_mudang_balance', { p_user_id: userId, p_amount: totalAmount })

    return NextResponse.json({ ok: true, totalAmount, count: items.length })
  } catch (err) {
    console.error('[withdraw POST]', err)
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 })
  }
}
