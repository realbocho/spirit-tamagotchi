// contracts/wrappers/MudangTreasury.ts
import {
  Address, beginCell, Cell, Contract, contractAddress,
  ContractProvider, Sender, SendMode, toNano
} from '@ton/core'

export type TreasuryConfig = {
  ownerAddress: Address
  opsAddress:   Address
}

export function treasuryConfigToCell(config: TreasuryConfig): Cell {
  return beginCell()
    .storeAddress(config.ownerAddress)
    .storeAddress(config.opsAddress)
    .storeCoins(0n) // reward_pool
    .storeCoins(0n) // mudang_pool
    .storeCoins(0n) // total_received
    .endCell()
}

export class MudangTreasury implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new MudangTreasury(address)
  }

  static createFromConfig(config: TreasuryConfig, code: Cell, workchain = 0) {
    const data = treasuryConfigToCell(config)
    const init = { code, data }
    return new MudangTreasury(contractAddress(workchain, init), init)
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    })
  }

  async sendDeposit(provider: ContractProvider, via: Sender, value: bigint, comment?: string) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(), // empty body = auto deposit
    })
  }

  async sendWithdrawPool(
    provider: ContractProvider,
    via: Sender,
    opts: { value: bigint; withdrawAmount: bigint }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x3, 32) // op::withdraw_pool
        .storeCoins(opts.withdrawAmount)
        .endCell(),
    })
  }

  async getTreasuryData(provider: ContractProvider) {
    const result = await provider.get('get_treasury_data', [])
    return {
      ownerAddress: result.stack.readAddress(),
      opsAddress:   result.stack.readAddress(),
      rewardPool:   result.stack.readBigNumber(),
      mudangPool:   result.stack.readBigNumber(),
      totalReceived: result.stack.readBigNumber(),
    }
  }

  async getRewardPool(provider: ContractProvider): Promise<bigint> {
    const res = await provider.get('get_reward_pool', [])
    return res.stack.readBigNumber()
  }
}
