export const dynamic = 'force-dynamic'
// src/app/api/crisis/sos/[sosId]/help/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { sosId: string } }
) {
  try {
    const { helperId } = await req.json()
    const supabase = createServiceClient()

    const { data: sos } = await supabase
      .from('sos_requests')
      .select('*')
      .eq('id', params.sosId)
      .eq('status', 'pending')
      .single()

    if (!sos) return NextResponse.json({ error: 'SOS not found or already resolved' }, { status: 404 })

    // Prevent the owner from helping themselves
    if (sos.owner_id === helperId) {
      return NextResponse.json({ error: "Can't help your own pet!" }, { status: 400 })
    }

    // Prevent duplicate help
    if (sos.helper_ids?.includes(helperId)) {
      return NextResponse.json({ alreadyHelped: true, count: sos.helper_count })
    }

    const newCount = sos.helper_count + 1
    const newHelpers = [...(sos.helper_ids || []), helperId]
    const isComplete = newCount >= 15

    await supabase.from('sos_requests').update({
      helper_count: newCount,
      helper_ids: newHelpers,
      status: isComplete ? 'ready' : 'pending',
    }).eq('id', params.sosId)

    if (isComplete) {
      // Auto-resolve crisis
      await supabase.from('pets').update({
        status: 'alive',
        crisis_type: null,
        crisis_started_at: null,
        crisis_ends_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', sos.pet_id)

      await supabase.from('sos_requests').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      }).eq('id', params.sosId)
    }

    return NextResponse.json({
      count: newCount,
      needed: 15,
      resolved: isComplete,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to help' }, { status: 500 })
  }
}
