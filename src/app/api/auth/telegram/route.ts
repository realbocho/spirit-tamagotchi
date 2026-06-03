// src/app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramInitData, generateReferralCode } from '@/lib/telegram-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { initData, deviceUuid, referralCode } = body

    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // Validate Telegram signature
    const { valid, user: tgUser } = validateTelegramInitData(initData)
    
    // In development, allow mock user
    if (!valid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 })
    }

    const telegramId = tgUser?.id || (process.env.NODE_ENV === 'development' ? 123456789 : null)
    if (!telegramId) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (existingUser) {
      // Device UUID check: if device already linked to a different account, flag it
      if (deviceUuid && existingUser.device_uuid && existingUser.device_uuid !== deviceUuid) {
        // Check if this device is used by another account
        const { data: deviceConflict } = await supabase
          .from('users')
          .select('id')
          .eq('device_uuid', deviceUuid)
          .neq('telegram_id', telegramId)
          .single()

        if (deviceConflict) {
          // Log suspicious activity but don't block (just flag)
          await supabase.from('security_events').insert({
            type: 'device_conflict',
            user_id: existingUser.id,
            device_uuid: deviceUuid,
            metadata: { existing_user: deviceConflict.id },
          })
        }
      }

      // Update last_active and optionally device
      const updates: Record<string, unknown> = {
        last_active: new Date().toISOString(),
        telegram_name: tgUser?.first_name || existingUser.telegram_name,
        photo_url: tgUser?.photo_url || existingUser.photo_url,
      }
      if (deviceUuid && !existingUser.device_uuid) {
        updates.device_uuid = deviceUuid
      }

      await supabase.from('users').update(updates).eq('id', existingUser.id)

      return NextResponse.json({ user: { ...existingUser, ...updates }, isNew: false })
    }

    // New user — find referrer if code provided
    let referredById: string | null = null
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single()
      if (referrer) referredById = referrer.id
    }

    const newUser = {
      id: uuidv4(),
      telegram_id: telegramId,
      telegram_username: tgUser?.username,
      telegram_name: tgUser?.first_name || 'Spirit Walker',
      photo_url: tgUser?.photo_url,
      device_uuid: deviceUuid,
      mudang_balance: 0,
      total_earned: 0,
      referral_code: generateReferralCode(telegramId),
      referred_by: referredById,
      karma_points: 0,
      has_free_egg: true,
      tutorial_complete: false,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    }

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (error) throw error

    // Reward referrer
    if (referredById) {
      await supabase
        .from('users')
        .update({ karma_points: supabase.rpc('increment', { x: 50 }) })
        .eq('id', referredById)
    }

    return NextResponse.json({ user: createdUser, isNew: true })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — save birth date for saju calculation
export async function PATCH(req: NextRequest) {
  try {
    const { userId, birthYear, birthMonth, birthDay } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('users')
      .update({ birth_year: birthYear, birth_month: birthMonth, birth_day: birthDay })
      .eq('id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ user: data })
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
