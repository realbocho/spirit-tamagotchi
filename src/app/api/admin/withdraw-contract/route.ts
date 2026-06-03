export const dynamic = 'force-dynamic'
// src/app/api/admin/withdraw-contract/route.ts
// Sends a withdrawal tx to the treasury contract using owner wallet
import { NextRequest, NextResponse } from 'next/server'
import { TonClient, WalletContractV4, internal, toNano } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { beginCell, Address } from '@ton/core'

export async function POST(req: NextRequest) {
  try {
    const { key, op, amountTon, recipient } = await req.json()

    if (key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (![2, 3].includes(op)) {
      return NextResponse.json({ error: 'Invalid op (use 2=mudang_pool, 3=reward_pool)' }, { status: 400 })
    }
    if (!amountTon || amountTon <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const mnemonic = process.env.WALLET_MNEMONIC
    if (!mnemonic) {
      return NextResponse.json({ error: 'WALLET_MNEMONIC not set in env' }, { status: 500 })
    }

    const contractAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS
    if (!contractAddress) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_TREASURY_ADDRESS not set' }, { status: 500 })
    }

    // Build message body
    // op=3 (withdraw_pool): op(32) + amount(coins)
    // op=2 (withdraw_ops):  op(32) + amount(coins) + recipient(addr)
    const amountNano = toNano(amountTon.toString())
    let bodyBuilder = beginCell()
      .storeUint(op, 32)
      .storeCoins(amountNano)

    if (op === 2) {
      if (!recipient) {
        return NextResponse.json({ error: 'Recipient required for op 2' }, { status: 400 })
      }
      bodyBuilder = bodyBuilder.storeAddress(Address.parse(recipient))
    }
    const body = bodyBuilder.endCell()

    // Connect wallet
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '))
    const wallet  = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })

    const client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TONCENTER_API_KEY || '',
    })

    const walletContract = client.open(wallet)
    const seqno = await walletContract.getSeqno()

    await walletContract.sendTransfer({
      secretKey: keyPair.secretKey,
      seqno,
      messages: [
        internal({
          to: Address.parse(contractAddress),
          value: toNano('0.05'), // gas for the contract call
          body,
          bounce: true,
        })
      ],
    })

    const opName = op === 3 ? 'reward_pool' : 'mudang_pool'
    return NextResponse.json({
      ok: true,
      message: `Withdrawal of ${amountTon} TON from ${opName} sent. Check tonscan in ~30s.`,
      tonscan: `https://tonscan.org/address/${wallet.address.toString()}`,
    })

  } catch (err: any) {
    console.error('[withdraw-contract]', err)
    return NextResponse.json({ error: err.message || 'Withdrawal failed' }, { status: 500 })
  }
}
