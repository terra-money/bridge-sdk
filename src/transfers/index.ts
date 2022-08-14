import { Msg } from '@terra-money/terra.js'
import { ChainType } from 'const/chains'
import { Coin } from 'const/coin'
import { WalletType } from 'const/wallet'

type TransferType =
  | {
      wallet: WalletType.station
      tx: Msg[]
    }
  | {
      wallet: WalletType.metamask
      tx: Object
    }
  | {
      wallet: WalletType.keplr
      tx: Object
    }

export async function transfer(
  fromChain: ChainType,
  toChain: ChainType,
  toAddress: string,
  coin: Coin,
) {}
