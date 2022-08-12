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