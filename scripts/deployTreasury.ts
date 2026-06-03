// scripts/deployTreasury.ts
import { toNano, Address } from '@ton/core'
import { MudangTreasury } from '../contracts/wrappers/MudangTreasury'
import { compile, NetworkProvider } from '@ton/blueprint'

export async function run(provider: NetworkProvider) {
  const ownerAddress = provider.sender().address!

  // Ops fund address — replace with your actual ops wallet
  const opsAddress = Address.parse(process.env.OPS_WALLET_ADDRESS || ownerAddress.toString())

  const treasury = provider.open(
    MudangTreasury.createFromConfig(
      { ownerAddress, opsAddress },
      await compile('mudang_treasury')
    )
  )

  console.log('Deploying MudangTreasury to:', treasury.address.toString())

  await treasury.sendDeploy(provider.sender(), toNano('0.05'))
  await provider.waitForDeploy(treasury.address)

  console.log('✅ Treasury deployed:', treasury.address.toString())
  console.log('Set NEXT_PUBLIC_TREASURY_ADDRESS =', treasury.address.toString())

  // Verify
  const data = await treasury.getTreasuryData(provider.provider(treasury.address))
  console.log('Treasury data:', data)
}
