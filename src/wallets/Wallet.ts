import { ChainType } from 'const/chains'

export interface Wallet {
  isSupported(): boolean
  isInstalled(): boolean
  connect(chain: ChainType): Promise<{ address: string }>

  supportedChains: ChainType[]
  installLink: string

  // TODO
  // onAccountChange(action: (accont: string) => void): void
  // onNetworkChange(action: (network: string) => void): void
  // broadcast(tx: Tx): Promise<Result>
}
