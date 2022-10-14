import { BridgeType } from './bridges'
import { ChainType } from './chains'

export enum Token {
  Luna = 'uluna',

  ampLuna = 'terra1ecgazyd0waaj3g7l9cmy5gulhxkps2gmxu9ghducvuypjq68mq2s5lvsct',
  ampLunaOnJuno = 'ibc/EC324F1CEEA2587DC6D6A3D2ABDE04B37F2EDC3945553FF7B3F8D03FA5E5576D',
  ampLunaOnOsmosis = 'ibc/3CB43B244957F7CB0A8C0C7F81ADEA524A2AC57E48716B6F8F781286D96830D2',
  ampLunaOnKujira = 'ibc/F33B313325B1C99B646B1B786F1EA621E3794D787B90C204C30FE1D4D45970AE',

  ampJuno = 'juno1a0khag6cfzu5lrwazmyndjgvlsuk7g4vn9jd8ceym8f4jf6v2l9q6d348a',
  ampJunoOnTerra = 'ibc/F2F160FCF854896FAE3E846C5D936F1FDD8413646F2A780A1DE1CF35F2E8504C',
}

// full whitelist
// mapping is always between [Terra]: [DestinationChain]
export const whitelist: Record<
  ChainType,
  Record<string, Record<string, string>>
> = {
  [ChainType.cosmos]: {
    [BridgeType.ibc]: {
      [Token.Luna]:
        'ibc/34CEF8B6A6424C45FE3CCC4A02C9DF9BB38BACC323E08DFFEFE9E4B18BB89AC4',
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2':
        'uatom',
    },
  },
  [ChainType.ethereum]: {
    [BridgeType.axelar]: {
      'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4':
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'ibc/CBF67A2BCF6CAE343FDF251E510C8E18C361FC02B23430C121116E0811835DEF':
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'ibc/05D299885B07905B6886F554B39346EA6761246076A1120B1950049B92B922DD':
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      'ibc/BC8A77AFBD872FDC32A348D3FB10CC09277C266CFE52081DE341C7EC6752E674':
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  //   [ChainType.avalanche]: {
  //     [BridgeType.axelar]: {
  //       'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4':
  //         '0xfaB550568C688d5D8A52C7d794cb93Edc26eC0eC',
  //     },
  //   },
  [ChainType.osmosis]: {
    [BridgeType.ibc]: {
      [Token.Luna]:
        'ibc/785AFEC6B3741100D15E7AF01374E3C4C36F24888E96479B1C33F5C71F364EF9',
      'ibc/0471F1C4E7AFD3F07702BEF6DC365268D64570F7C1FDC98EA6098DD6DE59817B':
        'uosmo',
    },
    [BridgeType.ics20]: {
      [Token.ampLuna]: Token.ampLunaOnOsmosis,
    },
  },
  //   [ChainType.scrt]: {
  //     [BridgeType.ibc]: {
  //       uluna:
  //         'ibc/28DECFA7FB7E3AB58DC3B3AEA9B11C6C6B6E46356DCC26505205DAD3379984F5',
  //       'ibc/10BD6ED30BA132AB96F146D71A23B46B2FC19E7D79F52707DC91F2F3A45040AD':
  //         'uscrt',
  //     },
  //   },
  [ChainType.juno]: {
    [BridgeType.ibc]: {
      [Token.Luna]:
        'ibc/107D152BB3176FAEBF4C2A84C5FFDEEA7C7CB4FE1BBDAB710F1FD25BCD055CBF',
      'ibc/4CD525F166D32B0132C095F353F4C6F033B0FF5C49141470D1EFDA1D63303D04':
        'ujuno',
    },
    [BridgeType.ics20]: {
      [Token.ampLuna]: Token.ampLunaOnJuno,
      [Token.ampJunoOnTerra]: Token.ampJuno,
    },
  },
  //   [ChainType.crescent]: {
  //     [BridgeType.ibc]: {
  //       uluna:
  //         'ibc/177904239844D7D0E59D04F864D1278C07A80688EA67BCFA940E954FFA4CF699',
  //       'ibc/B090DC21658BD57698522880590CA53947B8B09355764131AA94EC75517D46A5':
  //         'ucre',
  //     },
  //   },
  [ChainType.kujira]: {
    [BridgeType.ibc]: {
      [Token.Luna]:
        'ibc/DA59C009A0B3B95E0549E6BF7B075C8239285989FF457A8EDDBB56F10B2A6986',
      'ibc/B22B4DD21586965DAEF42A7600BA371EA77C02E90FC8A7F2330BF9F9DE129B07':
        'ukuji',
    },
    [BridgeType.ics20]: {
      [Token.ampLuna]: Token.ampLunaOnKujira,
    },
    [BridgeType.axelar]: {
      'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4':
        'ibc/295548A78785A1007F232DE286149A6FF512F180AF5657780FC89C009E2C348F',
      'ibc/CBF67A2BCF6CAE343FDF251E510C8E18C361FC02B23430C121116E0811835DEF':
        'ibc/F2331645B9683116188EF36FC04A809C28BD36B54555E8705A37146D0182F045',
    },
  },
  //   // not yet supported on terra2
  //   [ChainType.bsc]: {},
  //   [ChainType.fantom]: {},
  //   [ChainType.inj]: {},
  //   [ChainType.polygon]: {},
  //   [ChainType.moonbeam]: {},
  //   // other chains
  //   [ChainType.axelar]: {},
  [ChainType.terra]: {},
}
