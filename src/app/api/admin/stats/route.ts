// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const [
    { count: total_users },
    { count: active_pets },
    { data: minedData },
    { count: pending_count },
    { data: pendingAmounts },
    { count: active_listings },
    { count: open_sos },
    { data: revenueData },
    { data: top_users },
    { data: recent_txs },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('pets').select('*', { count: 'exact', head: true }).in('status', ['alive', 'cursed']),
    supabase.from('users').select('total_earned'),
    supabase.from('pending_withdrawals').select('*', { count: 'exact', head: true }).in('status', ['locked', 'unlocked']),
    supabase.from('pending_withdrawals').select('amount').in('status', ['locked', 'unlocked']),
    supabase.from('nft_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sos_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('revenue_splits').select('reward_pool_amount, ops_amount, mudang_pool_amount'),
    supabase.from('users').select('telegram_name, total_earned, karma_points').order('total_earned', { ascending: false }).limit(10),
    supabase.from('transactions').select('type, amount_ton, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  const total_mined = (minedData || []).reduce((s: number, u: any) => s + (u.total_earned || 0), 0)
  const pending_withdrawals_amount = (pendingAmounts || []).reduce((s: number, w: any) => s + (w.amount || 0), 0)
  const revenue = (revenueData || []).reduce(
    (acc: any, r: any) => ({
      reward_pool: acc.reward_pool + (r.reward_pool_amount || 0),
      ops: acc.ops + (r.ops_amount || 0),
      mudang_pool: acc.mudang_pool + (r.mudang_pool_amount || 0),
      total: acc.total + (r.reward_pool_amount || 0) + (r.ops_amount || 0) + (r.mudang_pool_amount || 0),
    }),
    { reward_pool: 0, ops: 0, mudang_pool: 0, total: 0 }
  )

  return NextResponse.json({
    total_users: total_users || 0,
    active_pets: active_pets || 0,
    total_mined,
    pending_withdrawals_count: pending_count || 0,
    pending_withdrawals_amount,
    active_listings: active_listings || 0,
    open_sos: open_sos || 0,
    revenue,
    top_users: top_users || [],
    recent_transactions: recent_txs || [],
  })
}
