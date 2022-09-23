import { AxelarAssetTransfer, Environment } from '@axelar-network/axelarjs-sdk'
import axios from 'axios'

import { ChainType } from 'const/chains'

const sdk = new AxelarAssetTransfer({
  environment: Environment.MAINNET,
  auth: 'local',
})

export async function getAxelarDepositAddress(
  destinationAddress: string,
  fromBlockChain: ChainType,
  toBlockChain: ChainType,
  coin: string,
): Promise<string | undefined> {
  return await sdk.getDepositAddress(
    fromBlockChain,
    toBlockChain,
    destinationAddress,
    // TODO: may have to convert it to destination token address
    coin,
  )
}

export async function getAxelarFee(
  fromBlockChain: ChainType,
  toBlockChain: ChainType,
  coin: string,
  amount: number,
): Promise<string> {
  const result = await axios.get(
    `https://api-1.axelar.nodes.guru/axelar/nexus/v1beta1/transfer_fee?source_chain=${
      fromBlockChain === ChainType.terra ? 'terra-2' : fromBlockChain
    }&destination_chain=${
      toBlockChain === ChainType.terra ? 'terra-2' : toBlockChain
    }&amount=${amount}${coin}`,
  )

  return result.data.fee.amount
}
