import { BridgeType } from './bridges'

export enum ChainType {
  terra = 'terra',
  cosmos = 'cosmos',
  osmosis = 'osmosis',
  ethereum = 'ethereum',
}

export const chainIDs: Record<ChainType, string> = {
  [ChainType.terra]: 'phoenix-1',
  [ChainType.cosmos]: 'cosmoshub-4',
  [ChainType.osmosis]: 'osmosis-1',
  [ChainType.ethereum]: '0x1',
}

export const ibcChannels: Record<
  string,
  Record<string | BridgeType.axelar, string>
> = {
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
