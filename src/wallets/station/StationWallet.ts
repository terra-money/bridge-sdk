import {
  Coin,
  CreateTxOptions,
  Extension,
  MsgTransfer,
} from '@terra-money/terra.js'
import { BridgeType } from 'const/bridges'
import { ChainType, ibcChannels } from 'const/chains'
import { getAxelarDepositAddress } from 'packages/axelar'
import { Tx, TxResult, Wallet } from '../Wallet'

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
        // @ts-expect-error
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
              // @ts-expect-error
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

      case BridgeType.axelar:
        const depositAddress = await getAxelarDepositAddress(tx.address, tx.src, tx.dst, tx.coin.denom)

        if(!depositAddress) return {
          success: false,
          error: 'Can\'t generate the Axelar deposit address'
        }

        const axlTx: CreateTxOptions = {
          msgs: [
            new MsgTransfer(
              'transfer',
              // @ts-expect-error
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
    icon: 'https://assets.terra.money/icon/station-extension/icon.png',
    installLink: 'https://setup-station.terra.money/',
  }
}
