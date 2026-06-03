// src/app/api/fortune/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateDailyFortune } from '@/lib/fortune-engine'
import { v4 as uuidv4 } from 'uuid'

// GET /api/fortune?user_id=xxx — get or create today's fortune, also trigger crisis check
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id')
    if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    const supabase = createServiceClient()
    const today = new Date().toISOString().split('T')[0]

    // Check if fortune already generated today
    const { data: existing } = await supabase
      .from('daily_fortunes')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existing) return NextResponse.json({ fortune: existing, isNew: false })

    // Get user
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Calculate fortune
    const result = calculateDailyFortune(
      user.telegram_id,
      user.birth_year || 1990,
      user.birth_month || 1,
      user.birth_day || 1,
    )

    const fortune = {
      id: uuidv4(),
      user_id: userId,
      date: today,
      score: result.score,
      label: result.label,
      mining_multiplier: result.miningMultiplier,
      element_of_day: result.elementOfDay,
      stem_branch: result.stemBranch,
      advisory_text: result.advisoryText,
      crisis_probability: result.crisisProbability,
      created_at: new Date().toISOString(),
    }

    await supabase.from('daily_fortunes').insert(fortune)

    // Update mining sessions for user's pets with today's multiplier
    const { data: pets } = await supabase
      .from('pets')
      .select('id')
      .eq('owner_id', userId)
      .eq('status', 'alive')

    if (pets?.length) {
      await supabase
        .from('mining_sessions')
        .update({ multiplier: result.miningMultiplier })
        .eq('user_id', userId)
        .eq('status', 'active')
    }

    // Crisis check — roll for each alive pet
    if (result.crisisProbability > 0 && pets?.length) {
      const crisisRoll = Math.random()
      if (crisisRoll < result.crisisProbability) {
        // Pick a random non-cursed pet
        const { data: alivePets } = await supabase
          .from('pets')
          .select('*')
          .eq('owner_id', userId)
          .eq('status', 'alive')

        if (alivePets?.length) {
          const target = alivePets[Math.floor(Math.random() * alivePets.length)]
          const crisisType = Math.random() < 0.5 ? 'sal' : 'samjae'
          const crisisEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days

          await supabase.from('pets').update({
            status: 'cursed',
            crisis_type: crisisType,
            crisis_started_at: new Date().toISOString(),
            crisis_ends_at: crisisEnd.toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', target.id)

          // Stop mining
          await supabase
            .from('mining_sessions')
            .update({ status: 'paused' })
            .eq('pet_id', target.id)
            .eq('status', 'active')

          return NextResponse.json({
            fortune: { ...fortune },
            isNew: true,
            crisis: {
              petId: target.id,
              petName: target.name,
              crisisType,
            },
          })
        }
      }
    }

    return NextResponse.json({ fortune, isNew: true })
  } catch (err) {
    console.error('Fortune error:', err)
    return NextResponse.json({ error: 'Failed to generate fortune' }, { status: 500 })
  }
}
