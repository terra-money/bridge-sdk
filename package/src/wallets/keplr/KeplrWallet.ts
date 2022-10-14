import { SigningStargateClient } from '@cosmjs/stargate'
import { wasmTypes } from '@cosmjs/cosmwasm-stargate/build/modules/wasm/messages'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx'
import { BridgeType } from '../../const/bridges'
import {
  ChainType,
  chainIDs,
  ibcChannels,
  ics20Channels,
} from '../../const/chains'
import { QueryResult, Tx, TxResult, Wallet } from '../Wallet'
import { getAxelarDepositAddress } from '../../packages/axelar'
import { isValidAddress } from '../../util/address'

type KeplrChain =
  | ChainType.cosmos
  | ChainType.osmosis
  | ChainType.kujira
  | ChainType.juno

const keplrRpc: Record<KeplrChain, string> = {
  [ChainType.cosmos]: 'https://cosmos-mainnet-rpc.allthatnode.com:26657/',
  [ChainType.osmosis]: 'https://rpc.osmosis.zone/',
  [ChainType.juno]: 'https://rpc.juno.omniflix.co/',
  // [ChainType.juno]: 'https://juno-rpc.polkachu.com/',
  [ChainType.kujira]: 'https://rpc.kaiyo.kujira.setten.io/',
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
    ).catch((e) => {
      console.error(
        'Error during the connection with the RPC, try using a different one',
        e,
      )
      throw new Error(
        'Error during the connection with the RPC, try using a different one',
      )
    })

    return { address: accounts[0].address }
  }

  async getBalance(token: string): Promise<QueryResult<number>> {
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
            sourceChannel: ibcChannels[tx.src][tx.dst],
            sender: this.address,
            receiver: tx.address,
            token: {
              amount: tx.coin.amount.toFixed(0),
              denom: tx.coin.denom,
            },
            timeoutHeight: undefined,
            timeoutTimestamp: (Date.now() + 120 * 1000) * 1e6,
          },
        })
        break

      case BridgeType.ics20:
        if (tx.coin.denom.startsWith('ibc/')) {
          // we are transfering an cw20 token (as an ibc coin) from the counterparty back to the origin
          // ibc (counterparty) -> ibc transfer -> cw20 (origin)
          let chainConfig = ics20Channels[tx.dst]
          let channelConfig = chainConfig?.channels[tx.src]

          if (!chainConfig || !channelConfig || !channelConfig.counterparty) {
            return {
              success: false,
              error: `One of the chains is not supported by ICS20, select a different bridge`,
            }
          }

          // compose MsgTransfer
          msgs.push({
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            value: MsgTransfer.fromPartial({
              sourcePort: 'transfer',
              sourceChannel: channelConfig.counterparty,
              sender: this.address,
              receiver: tx.address,
              token: {
                amount: tx.coin.amount.toFixed(0),
                denom: tx.coin.denom,
              },
              timeoutHeight: undefined,
              timeoutTimestamp: (Date.now() + 120 * 1000) * 1e6,
            }),
          })

          break
        } else if (isValidAddress(tx.coin.denom, tx.src)) {
          // we are transfering an cw20 token to another chain
          // cw20 (origin) -> through contract -> ibc (counterparty)
          let chainConfig = ics20Channels[tx.src]
          let channelConfig = chainConfig?.channels[tx.dst]
          if (!chainConfig || !channelConfig) {
            return {
              success: false,
              error: `One of the chains is not supported by ICS-20, select a different bridge`,
            }
          }

          msgs.push({
            typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
            value: {
              sender: this.address,
              contract: tx.coin.denom,
              msg: Buffer.from(
                JSON.stringify({
                  send: {
                    contract: chainConfig.contract,
                    amount: tx.coin.amount.toFixed(0),
                    msg: Buffer.from(
                      JSON.stringify({
                        channel: channelConfig.origin,
                        remote_address: tx.address,
                        timeout: 120 * 5,
                      }),
                    ).toString('base64'),
                  },
                }),
              ).toString('base64'),
              funds: [],
            },
          })
          break
        } else {
          return {
            success: false,
            error: `One of the assets is not supported by ICS-20, select a different bridge`,
          }
        }

      case BridgeType.axelar:
        // @ts-expect-error
        if (!ibcChannels[tx.src]?.axelar) {
          return {
            success: false,
            error: `The source chain is not supported by Axelar, select a different bridge`,
          }
        }

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

        msgs.push({
          typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          value: {
            sourcePort: 'transfer',
            // @ts-expect-error
            sourceChannel: ibcChannels[tx.src].axelar,
            sender: this.address,
            receiver: axlAddress,
            token: {
              amount: tx.coin.amount.toFixed(0),
              denom: tx.coin.denom,
            },
            timeoutHeight: undefined,
            timeoutTimestamp: (Date.now() + 120 * 1000) * 1e6,
          },
        })
        break
      case BridgeType.wormhole:
        // TODO: implement wormhole
        break
    }

    for (let element of wasmTypes) {
      this.signer.registry.register(element[0], element[1])
    }

    // get account info
    const account = await this.signer.getSequence(this.address)
    // create tx
    const signedTx = await this.signer.sign(
      this.address,
      msgs,
      {
        amount: [],
        // this is not good
        gas: '250000',
        // gas: '150000',
      },
      '', // memo
      {
        chainId: await this.signer.getChainId(),
        accountNumber: account.accountNumber,
        sequence: account.sequence,
      },
    )

    // broadcast tx
    const result = await this.signer.broadcastTx(
      TxRaw.encode(signedTx).finish(),
    )

    return {
      success: !result.code,
      error: (result.code && result.rawLog) || '',
      txhash: result.transactionHash,
    }
  }

  supportedChains = [
    ChainType.osmosis,
    ChainType.cosmos,
    ChainType.kujira,
    ChainType.juno,
  ]

  description = {
    name: 'Keplr',
    icon: 'https://assets.terra.money/bridge/keplr.png',
    installLink: 'https://www.keplr.app/',
  }
}
