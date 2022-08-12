import MetaMaskOnboarding from '@metamask/onboarding'
import { chainIDs, ChainType } from 'const/chains'
import { Wallet } from '../Wallet'

declare global {
  interface Window {
    ethereum: any
  }
}

export class MetaMaskWallet implements Wallet {
  isSupported(): boolean {
    // supported on chrome, firefox and edge (only on desktop)
    return (
      !navigator.userAgent.match(/Android|iPhone/i) &&
      !!navigator.userAgent.match(/chrome|chromium|firefox|edg/i)
    )
  }

  isInstalled(): boolean {
    return MetaMaskOnboarding.isMetaMaskInstalled()
  }

  async connect(chain: ChainType): Promise<{ address: string }> {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`${chain} is not supported by Metamask`)
    }

    if (window.ethereum?.networkVersion !== chainIDs[chain]) {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: chainIDs[chain],
          },
        ],
      })
      // TODO: handle non-default chains with wallet_addEthereumChain
    }

    const method = 'eth_requestAccounts'
    const accounts = await window.ethereum?.request({ method })
    const address = (accounts && accounts[0]) || ''

    return { address }
  }

  // TODO: support connection with Terra, and other cosmos sdk chains
  supportedChains = [ChainType.ethereum]

  installLink = 'https://metamask.io/'
}
