import { Extension } from '@terra-money/terra.js'
import { ChainType } from 'const/chains'
import { Wallet } from '../Wallet'

const ext = new Extension()

export class StationWallet implements Wallet {
  isSupported(): boolean {
    // supported on chrome, firefox and edge (only on desktop)
    return (
      !navigator.userAgent.match(/Android|iPhone/i) &&
      !!navigator.userAgent.match(/chrome|chromium|firefox|edg/i)
    )
  }

  isInstalled(): boolean {
    return ext.isAvailable
  }

  async connect(chain: ChainType): Promise<{ address: string }> {
    if(!this.supportedChains.includes(chain)) {
        throw new Error(`${chain} is not supported by Station`)
    }

    const res = await ext.request('connect')
    return res.payload as any
  }

  supportedChains = [ChainType.terra]

  installLink = 'https://chrome.google.com/webstore/detail/terra-station-wallet/aiifbnbfobpmeekipheeijimdpnlpgpp'
}
