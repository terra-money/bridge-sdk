import { SigningStargateClient } from '@cosmjs/stargate'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
import { BridgeType } from '../../const/bridges'
import { ChainType, chainIDs, ibcChannels } from '../../const/chains'
import { QueryResult, Tx, TxResult, Wallet } from '../Wallet'
import { getAxelarDepositAddress } from '../../packages/axelar'

type KeplrChain = ChainType.cosmos | ChainType.osmosis

const keplrRpc: Record<KeplrChain, string> = {
  [ChainType.cosmos]: 'https://cosmos-mainnet-rpc.allthatnode.com:26657/',
  [ChainType.osmosis]: 'https://rpc.osmosis.zone/',
}

declare global {
  interface Window {
    keplr: any
  }
}

export class KeplrWallet implements Wallet {
  private address: string = ''
  private signer: SigningStargateClient | null = null
  private chain: ChainType | null = null

  isSupported(): boolean {
    // supported on chrome, edge and firefox (only on desktop)
    return (
      !navigator.userAgent.match(/Android|iPhone/i) &&
      !!navigator.userAgent.match(/chrome|chromium|firefox|edg/i)
    )
  }

  isInstalled(): boolean {
    return !!window.keplr
  }

  async connect(chain: ChainType, rpc?: string): Promise<{ address: string }> {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`${chain} is not supported by ${this.description.name}`)
    }

    const keplr = window.keplr

    keplr.enable(chainIDs[chain])
    const keplrOfflineSigner = await keplr.getOfflineSignerAuto(chainIDs[chain])
    const accounts = await keplrOfflineSigner.getAccounts()

    this.address = accounts[0].address
    this.chain = chain
    this.signer = await SigningStargateClient.connectWithSigner(
      rpc || keplrRpc[chain as KeplrChain],
      keplrOfflineSigner,
    ).catch(() => {
      console.error(
        'Error during the connection with the RPC, try using a different one',
      )
      throw new Error(
        'Error during the connection with the RPC, try using a different one',
      )
    })

    return { address: accounts[0].address }
  }

  async getBalance(
    token: string,
  ): Promise<QueryResult<number>> {
    if (!this.signer) {
      return {
        success: false,
        error: `You must connect the wallet before the query`,
      }
    }

    const res = await this.signer.getBalance(this.address, token)
    return {
      success: true,
      data: parseInt(res.amount),
    }
  }

  async transfer(tx: Tx): Promise<TxResult> {
    if (!this.address || !this.signer) {
      return {
        success: false,
        error: `You must connect the wallet before the transfer`,
      }
    }
    if (tx.src !== this.chain) {
      return {
        success: false,
        error: `You must connect to ${tx.src} before the transfer`,
      }
    }
    if (tx.src === tx.dst) {
      return {
        success: false,
        error: `Source chain and destination chain must be different`,
      }
    }

    const msgs = []

    switch (tx.bridge) {
      case BridgeType.ibc:
        // @ts-expect-error
        if (!ibcChannels[tx.src]?.[tx.dst]) {
          return {
            success: false,
            error: `One of the chains is not supported by IBC, select a different bridge`,
          }
        }
        // compose MsgTransfer
        msgs.push({
          typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          value: {
            sourcePort: 'transfer',
            // @ts-expect-error
            sourceChannel: !ibcChannels[tx.src][tx.dst],
            sender: this.address,
            receiver: tx.address,
            token: tx.coin,
            timeoutHeight: undefined,
            timeoutTimestamp: (Date.now() + 120 * 1000) * 1e6,
          },
        })
        break
      case BridgeType.axelar:
        // @ts-expect-error
        if (!ibcChannels[tx.src]?.axelar) {
          return {
            success: false,
            error: `The source chain is not supported by Axelar, select a different bridge`,
          }
        }

        const axlAddress = await getAxelarDepositAddress(tx.address, tx.src, tx.dst, tx.coin.denom)

        if(!axlAddress) return {
          success: false,
          error: 'Can\'t generate the Axelar deposit address'
        }
        
        msgs.push({
          typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          value: {
            sourcePort: 'transfer',
            // @ts-expect-error
            sourceChannel: !ibcChannels[tx.src].axelar,
            sender: this.address,
            receiver: axlAddress,
            token: tx.coin,
            timeoutHeight: undefined,
            timeoutTimestamp: (Date.now() + 120 * 1000) * 1e6,
          },
        })
        break
      case BridgeType.wormhole:
        // TODO: implement wormhole
        break
    }

    // get account info
    const account = await this.signer.getSequence(this.address)
    // create tx
    const signedTx = await this.signer.sign(
      this.address,
      msgs,
      {
        amount: [],
        gas: '150000',
      },
      '', // memo
      {
        chainId: await this.signer.getChainId(),
        accountNumber: account.accountNumber,
        sequence: account.sequence,
      }
    )

    // broadcast tx
    const result = await this.signer.broadcastTx(
      TxRaw.encode(signedTx).finish()
    )
    
    return {
      success: !result.code,
      error: (result.code && result.rawLog) || '',
      txhash: result.transactionHash
    }
  }

  supportedChains = [ChainType.osmosis, ChainType.cosmos]

  description = {
    name: 'Keplr',
    icon: 'https://assets.terra.money/bridge/keplr.png',
    installLink: 'https://www.keplr.app/',
  }
}
