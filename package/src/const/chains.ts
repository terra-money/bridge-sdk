import { PartialRecord } from './../util/types'
import { BridgeType } from './bridges'

export enum ChainType {
  terra = 'terra',
  cosmos = 'cosmos',
  osmosis = 'osmosis',
  ethereum = 'ethereum',
  kujira = 'kujira',
  juno = 'juno',
}

export const chainIDs: Record<ChainType, string> = {
  [ChainType.terra]: 'phoenix-1',
  [ChainType.cosmos]: 'cosmoshub-4',
  [ChainType.osmosis]: 'osmosis-1',
  [ChainType.ethereum]: '0x1',
  [ChainType.kujira]: 'kaiyo-1',
  [ChainType.juno]: 'juno-1',
}

export const ibcChannels = {
  [ChainType.terra]: {
    [ChainType.cosmos]: 'channel-0',
    [ChainType.osmosis]: 'channel-1',
    [BridgeType.axelar]: 'channel-6',
  },
  [ChainType.cosmos]: {
    [ChainType.terra]: 'channel-339',
    [ChainType.osmosis]: 'channel-141',
    [BridgeType.axelar]: 'channel-293',
  },
  [ChainType.osmosis]: {
    [ChainType.terra]: 'channel-251',
    [ChainType.cosmos]: 'channel-0',
    [BridgeType.axelar]: 'channel-208',
  },
}

export const ics20Channels: PartialRecord<
  ChainType,
  {
    contract: string
    channels: PartialRecord<ChainType, { origin: string; counterparty: string }>
  }
> = {
  // this is the configuration for CW20 coins with origin terra
  // it is best to have a single contract for all cw20 tokens
  [ChainType.terra]: {
    contract:
      'terra1e0mrzy8077druuu42vs0hu7ugguade0cj65dgtauyaw4gsl4kv0qtdf2au',
    channels: {
      [ChainType.osmosis]: {
        origin: 'channel-26',
        counterparty: 'channel-341',
      },
      [ChainType.kujira]: {
        origin: 'channel-28',
        counterparty: 'channel-36',
      },
      [ChainType.juno]: {
        origin: 'channel-32',
        counterparty: 'channel-153',
      },
    },
  },
  [ChainType.juno]: {
    contract: 'juno1v4887y83d6g28puzvt8cl0f3cdhd3y6y9mpysnsp3k8krdm7l6jqgm0rkn',
    channels: {
      [ChainType.terra]: {
        origin: 'channel-154',
        counterparty: 'channel-33',
      },
    },
  },
}

// export enum Token {
//   ampLUNA,
//   ampJUNO
// }

// export const cw20Tokens: {
//   [ChainType.terra]: {
//     [Token.ampLUNA]: {
//       cw20: 'terra1ecgazyd0waaj3g7l9cmy5gulhxkps2gmxu9ghducvuypjq68mq2s5lvsct',
//       logo: '',
//       name: '',
//       symbol: '',
//       chain: {
//         [ChainType.osmosis]: 'ibc/3CB43B244957F7CB0A8C0C7F81ADEA524A2AC57E48716B6F8F781286D96830D2'
//       }
//     }
//   },
//   [ChainType.juno] : {
//     [Token.ampJUNO]: {

//     }
//   }
// }
