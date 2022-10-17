import MetaMaskOnboarding from '@metamask/onboarding'
import { BridgeType } from '../../const/bridges'
import { chainIDs, ChainType } from '../../const/chains'
import { getAxelarDepositAddress } from '../../packages/axelar'
import { QueryResult, Tx, TxResult, Wallet } from '../Wallet'
import { ethers } from 'ethers'
import abi from './abi'

declare global {
  interface Window {
    ethereum: any
  }
}

export class MetaMaskWallet implements Wallet {
  private address = ''

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

  async getBalance(token: string): Promise<QueryResult<number>> {
    if (!this.address) {
      return {
        success: false,
        error: `You must connect the wallet before the query`,
      }
    }

    const contract = new ethers.Contract(token, abi, window.ethereum)

    const result = await contract.balanceOf(this.address)

    return {
      success: true,
      data: result.toNumber(),
    }
  }

  async connect(chain: ChainType): Promise<{ address: string }> {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`${chain} is not supported by ${this.description.name}`)
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
    this.address = (accounts && accounts[0]) || ''

    return { address: this.address }
  }

  async transfer(tx: Tx): Promise<TxResult> {
    if (!this.address) {
      return {
        success: false,
        error: `You must connect the wallet before the transfer`,
      }
    }
    if (!this.supportedChains.includes(tx.src)) {
      return {
        success: false,
        error: `${tx.src} is not supported by ${this.description.name}`,
      }
    }
    if (tx.src === tx.dst) {
      return {
        success: false,
        error: `Source chain and destination chain must be different`,
      }
    }

    switch (tx.bridge) {
      case BridgeType.axelar:
        const axlAddress = await getAxelarDepositAddress(
          tx.address,
          tx.src,
          tx.dst,
          tx.coin.denom,
        )

        if (!axlAddress)
          return {
            success: false,
            error: "Can't generate the Axelar deposit address",
          }

        const token = new ethers.Contract(tx.coin.denom, abi, window.ethereum)
        const signer = window.ethereum.getSigner()
        const withSigner = token.connect(signer)

        const result = await withSigner.transfer(axlAddress, tx.coin.amount)

        return { success: true, txhash: result.hash }

      case BridgeType.ibc:
        // not supported by EVM chains
        return {
          success: false,
          error:
            'IBC is not supported by EVM chains, choose a different bridge type',
        }

      case BridgeType.ics20:
        // not supported by EVM chains
        return {
          success: false,
          error:
            'ICS20 is not supported by EVM chains, choose a different bridge type',
        }

      case BridgeType.wormhole:
        // TODO: integrate axelar and wormhole
        return {
          success: false,
          error: 'axelar and wormhole are not yet integrated on Metamask',
        }
    }
  }

  // TODO: support connection with Terra, and other cosmos sdk chains
  supportedChains = [ChainType.ethereum]

  description = {
    name: 'MetaMask',
    icon: 'https://assets.terra.money/bridge/metamask.png',
    installLink: 'https://metamask.io/',
  }
}
