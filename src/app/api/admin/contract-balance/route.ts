export const dynamic = 'force-dynamic'
// src/app/api/admin/contract-balance/route.ts
// Reads contract state via toncenter
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const address = process.env.NEXT_PUBLIC_TREASURY_ADDRESS
  if (!address) return NextResponse.json({ error: 'No treasury address' }, { status: 500 })

  try {
    const apiKey = process.env.TONCENTER_API_KEY || ''
    // Get account info (balance)
    const accountRes = await fetch(
      `https://toncenter.com/api/v2/getAddressInformation?address=${address}&api_key=${apiKey}`
    )
    const accountData = await accountRes.json()
    const balanceNano = accountData?.result?.balance || '0'
    const balanceTon = (parseInt(balanceNano) / 1e9).toFixed(4)

    // Run get methods to get pool breakdown
    // get_reward_pool
    const rewardRes = await fetch(
      `https://toncenter.com/api/v2/runGetMethod?address=${address}&method=get_reward_pool&stack=%5B%5D&api_key=${apiKey}`
    )
    const rewardData = await rewardRes.json()
    const rewardNano = rewardData?.result?.stack?.[0]?.[1] || '0x0'
    const rewardTon = (parseInt(rewardNano, 16) / 1e9).toFixed(4)

    // get_mudang_pool
    const mudangRes = await fetch(
      `https://toncenter.com/api/v2/runGetMethod?address=${address}&method=get_mudang_pool&stack=%5B%5D&api_key=${apiKey}`
    )
    const mudangData = await mudangRes.json()
    const mudangNano = mudangData?.result?.stack?.[0]?.[1] || '0x0'
    const mudangTon = (parseInt(mudangNano, 16) / 1e9).toFixed(4)

    return NextResponse.json({
      address,
      balance_ton: balanceTon,
      reward_pool_ton: rewardTon,
      mudang_pool_ton: mudangTon,
      tonscan_url: `https://tonscan.org/address/${address}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
