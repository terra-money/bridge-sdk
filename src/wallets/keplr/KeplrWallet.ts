import { ChainType, chainIDs } from 'const/chains'
import { Wallet } from '../Wallet'

declare global {
  interface Window {
    keplr: any
  }
}

export class KeplrWallet implements Wallet {
  isSupported(): boolean {
    // supported on chrome and edge (only on desktop)
    return (
      !navigator.userAgent.match(/Android|iPhone/i) &&
      !!navigator.userAgent.match(/chrome|chromium|edg/i)
    )
  }

  isInstalled(): boolean {
    return !!window.keplr
  }

  async connect(chain: ChainType): Promise<{ address: string }> {
    if(!this.supportedChains.includes(chain)) {
        throw new Error(`${chain} is not supported by Keplr`)
    }

    const keplr = window.keplr

    keplr.enable(chainIDs[chain])
    const keplrOfflineSigner = await keplr.getOfflineSignerAuto(chainIDs[chain])
    const accounts = await keplrOfflineSigner.getAccounts()
    return { address: accounts[0].address }
  }

  supportedChains = [ChainType.osmosis, ChainType.cosmos]

  installLink = 'https://www.keplr.app/'
}
