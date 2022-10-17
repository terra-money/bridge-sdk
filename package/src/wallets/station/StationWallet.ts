import {
  Coin,
  CreateTxOptions,
  Extension,
  LCDClient,
  MsgExecuteContract,
  MsgTransfer,
} from '@terra-money/terra.js'
import { isValidAddress } from '../../util/address'
import { BridgeType } from '../../const/bridges'
import { ChainType, ibcChannels, ics20Channels } from '../../const/chains'
import { getAxelarDepositAddress } from '../../packages/axelar'
import { QueryResult, Tx, TxResult, Wallet } from '../Wallet'

const ext = new Extension()

export class StationWallet implements Wallet {
  private address: string = ''

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
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`${chain} is not supported by ${this.description.name}`)
    }

    const res = (await ext.request('connect')).payload as { address: string }

    this.address = res.address
    return res
  }

  async getBalance(token: string): Promise<QueryResult<number>> {
    if (!this.address) {
      return {
        success: false,
        error: `You must connect the wallet before the query`,
      }
    }

    const lcd = new LCDClient({
      URL: 'https://phoenix-lcd.terra.dev',
      chainID: 'phoenix-1',
    })

    if (token.startsWith('terra1')) {
      const result = (await lcd.wasm.contractQuery(token, {
        balance: {
          address: this.address,
        },
      })) as {
        data: {
          balance: string
        }
      }

      return {
        success: true,
        data: parseInt(result.data.balance),
      }
    } else {
      const result = await lcd.bank.balance(this.address)
      const coin = result[0].get(token)

      return {
        success: true,
        data: coin?.amount?.toNumber() || 0,
      }
    }
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
      case BridgeType.ibc:
        if (!ibcChannels[tx.src]?.[tx.dst]) {
          return {
            success: false,
            error: `One of the chains is not supported by IBC, select a different bridge`,
          }
        }

        const ibcTx: CreateTxOptions = {
          msgs: [
            new MsgTransfer(
              'transfer',
              ibcChannels[tx.src][tx.dst],
              new Coin(tx.coin.denom, tx.coin.amount),
              this.address,
              tx.address,
              undefined,
              (Date.now() + 120 * 1000) * 1e6,
            ),
          ],
        }
        const ibcRes = (await ext.request(
          'post',
          JSON.parse(JSON.stringify(ibcTx)),
        )) as any

        return {
          success: ibcRes.success,
          txhash: ibcRes.result?.txhash,
          error: ibcRes.error?.message,
        }

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

          const ibcTx: CreateTxOptions = {
            msgs: [
              new MsgTransfer(
                'transfer',
                channelConfig.counterparty,
                new Coin(tx.coin.denom, tx.coin.amount),
                this.address,
                tx.address,
                undefined,
                (Date.now() + 120 * 1000) * 1e6,
              ),
            ],
          }

          let isClassic = false
          const ibcRes = (
            await ext.request('post', {
              msgs: ibcTx.msgs.map((a) => a.toJSON(isClassic)),
            })
          ).payload as any

          return {
            success: ibcRes.success,
            txhash: ibcRes.result?.txhash,
            error: ibcRes.error?.message,
          }
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

          const icsTx: CreateTxOptions = {
            msgs: [
              new MsgExecuteContract(
                this.address,
                tx.coin.denom,
                {
                  send: {
                    contract: chainConfig.contract,
                    amount: tx.coin.amount.toFixed(0),
                    msg: Buffer.from(
                      JSON.stringify({
                        channel: channelConfig.origin,
                        remote_address: tx.address,
                        timeout: 120,
                      }),
                    ).toString('base64'),
                  },
                },
                undefined,
              ),
            ],
          }

          let isClassic = false
          const icsRes = (
            await ext.request('post', {
              msgs: icsTx.msgs.map((a) => a.toJSON(isClassic)),
            })
          ).payload as any
          
          return {
            success: icsRes.success,
            txhash: icsRes.result?.txhash,
            error: icsRes.error?.message,
          }
        } else {
          return {
            success: false,
            error: `One of the assets is not supported by ICS-20, select a different bridge`,
          }
        }

      case BridgeType.axelar:
        const depositAddress = await getAxelarDepositAddress(
          tx.address,
          tx.src,
          tx.dst,
          tx.coin.denom,
        )

        if (!depositAddress)
          return {
            success: false,
            error: "Can't generate the Axelar deposit address",
          }

        const axlTx: CreateTxOptions = {
          msgs: [
            new MsgTransfer(
              'transfer',
              ibcChannels[tx.src]?.axelar,
              new Coin(tx.coin.denom, tx.coin.amount),
              this.address,
              depositAddress,
              undefined,
              (Date.now() + 120 * 1000) * 1e6,
            ),
          ],
        }

        const res = (await ext.request(
          'post',
          JSON.parse(JSON.stringify(axlTx)),
        )) as any

        return {
          success: res.success,
          txhash: res.result?.txhash,
          error: res.error?.message,
        }

      case BridgeType.wormhole:
        // TODO: handle wormhole

        return {
          success: false,
          error: 'wormole is not yet supported',
        }
    }
  }

  supportedChains = [ChainType.terra]

  description = {
    name: 'Terra Station',
    icon: 'https://assets.terra.money/bridge/station.png',
    installLink: 'https://setup-station.terra.money/',
  }
}
