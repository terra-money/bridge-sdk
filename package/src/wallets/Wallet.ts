import { BridgeType } from '../const/bridges'
import { ChainType } from '../const/chains'

export interface Tx {
  src: ChainType
  dst: ChainType
  bridge: BridgeType
  address: string
  coin: {
    amount: number
    denom: string
  }
}

export type TxResult =
  | {
      success: true
      txhash: string
    }
  | {
      success: false
      error: string
    }

export type QueryResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
    }

export interface Wallet {
  isSupported(): boolean
  isInstalled(): boolean
  connect(chain: ChainType): Promise<{ address: string }>
  getBalance(token: string): Promise<QueryResult<number>>
  transfer(tx: Tx): Promise<TxResult>

  supportedChains: ChainType[]
  description: {
    name: string
    icon: string
    installLink: string
  }

  // TODO:
  // estimateBridgeFee(tx: Tx): Promise<{ amount: number, denom: string }>
  // waitForTx(hash: string): Promise<void>
  // onAccountChange(action: (accont: string) => void): void
  // onNetworkChange(action: (network: string) => void): void
}
