import {
  Coin,
  CreateTxOptions,
  LCDClient,
  MsgTransfer,
  Wallet,
} from '@terra-money/terra.js'
import { LedgerKey } from "@terra-money/ledger-terra-js"
import BluetoothTransport from "@ledgerhq/hw-transport-web-ble"
import { BridgeType } from '../../const/bridges'
import { ChainType, ibcChannels } from '../../const/chains'
import { getAxelarDepositAddress } from '../../packages/axelar'
import { QueryResult, Tx, TxResult, Wallet as WalletInterface } from '../Wallet'


export class TerraLedgerWallet implements WalletInterface {
  private address: string = ''
  private key: LedgerKey | undefined = undefined

  isSupported(): boolean {
    // supported on chrome and edge (only on desktop)
    return (
      !navigator.userAgent.match(/Android|iPhone/i) &&
      !!navigator.userAgent.match(/chrome|chromium|edg/i)
    )
  }

  isInstalled(): boolean {
    return true
  }

  async connect(chain: ChainType, options?: { index?: number, bluetooth?: boolean }): Promise<{ address: string }> {
    if (!this.supportedChains.includes(chain)) {
      throw new Error(`${chain} is not supported by ${this.description.name}`)
    }

    const transport = options?.bluetooth
      ? await BluetoothTransport.create(120000)
      : undefined

    const key = await LedgerKey.create(transport, options?.index || 0)
    const address = (await key.showAddressAndPubKey()).bech32_address

    this.key = key
    this.address = address
    return { address }
  }

  async getBalance(
    token: string,
  ): Promise<QueryResult<number>> {
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
    if (!this.address || !this.key) {
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

    const lcd = new LCDClient({
      URL: 'https://phoenix-lcd.terra.dev',
      chainID: 'phoenix-1',
    })
    const wallet = new Wallet(lcd, this.key)

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

        const ibcRes = await lcd.tx.broadcastSync(await wallet.createAndSignTx(ibcTx))

        return {
          success: !!ibcRes.height,
          txhash: ibcRes.txhash,
          error: ibcRes.raw_log,
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

        const res = await lcd.tx.broadcastSync(await wallet.createAndSignTx(axlTx))

        return {
          success: !!res.height,
          txhash: res.txhash,
          error: res.raw_log,
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
    name: 'Terra Ledger',
    icon: 'https://assets.terra.money/bridge/ledgerTerra.png',
    installLink: 'https://ledger.com/',
  }
}
