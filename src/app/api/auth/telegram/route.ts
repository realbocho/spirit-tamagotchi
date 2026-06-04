export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramInitData, generateReferralCode } from '@/lib/telegram-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { initData, deviceUuid, referralCode, tgUser: clientTgUser } = body

    console.log('[auth] initData length:', initData?.length || 0)
    console.log('[auth] clientTgUser:', JSON.stringify(clientTgUser))

    let tgUser: any = clientTgUser || null
    let telegramId: number | null = tgUser?.id || null

    // Try HMAC validation
    if (initData) {
      const result = validateTelegramInitData(initData)
      console.log('[auth] validation result:', result.valid, 'user:', result.user?.id)
      if (result.user) {
        tgUser = result.user
        telegramId = result.user.id
      }
    }

    // Parse initData manually as last resort
    if (!telegramId && initData) {
      try {
        const params = new URLSearchParams(initData)
        const userStr = params.get('user')
        if (userStr) {
          const parsed = JSON.parse(decodeURIComponent(userStr))
          if (parsed?.id) { tgUser = parsed; telegramId = parsed.id }
        }
      } catch (e) {
        console.log('[auth] manual parse failed:', e)
      }
    }

    console.log('[auth] final telegramId:', telegramId)

    if (!telegramId) {
      return NextResponse.json({
        error: 'No Telegram user found',
        debug: {
          hasInitData: !!initData,
          initDataLen: initData?.length,
          hasClientUser: !!clientTgUser,
        }
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (existingUser) {
      await supabase
        .from('users')
        .update({
          last_active: new Date().toISOString(),
          telegram_name: tgUser?.first_name
            ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
            : existingUser.telegram_name,
          photo_url: tgUser?.photo_url || existingUser.photo_url,
          ...(deviceUuid && !existingUser.device_uuid ? { device_uuid: deviceUuid } : {}),
        })
        .eq('id', existingUser.id)

      // Re-fetch to get absolutely latest balance (avoid stale cache)
      const { data: freshUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', existingUser.id)
        .single()

      return NextResponse.json({ user: freshUser || existingUser })
    }

    // New user
    const newUser = {
      id: uuidv4(),
      telegram_id: telegramId,
      telegram_username: tgUser?.username || null,
      telegram_name: tgUser?.first_name
        ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
        : `User${telegramId}`,
      photo_url: tgUser?.photo_url || null,
      device_uuid: deviceUuid || null,
      mudang_balance: 0,
      total_earned: 0,
      referral_code: generateReferralCode(telegramId),
      referred_by: null as string | null,
      karma_points: 0,
      has_free_egg: true,
      tutorial_complete: false,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    }

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id, karma_points')
        .eq('referral_code', referralCode)
        .single()
      if (referrer) {
        newUser.referred_by = referrer.id
        await supabase.from('users')
          .update({ karma_points: (referrer.karma_points || 0) + 100 })
          .eq('id', referrer.id)
      }
    }

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (error) {
      console.error('[auth] user creation error:', error)
      return NextResponse.json({ error: 'Failed to create user', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: createdUser })
  } catch (err: any) {
    console.error('[auth] exception:', err)
    return NextResponse.json({ error: 'Auth failed', detail: err.message }, { status: 500 })
  }
}

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
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
