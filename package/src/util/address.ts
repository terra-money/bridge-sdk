import { ChainType } from '../const/chains'
import { bech32 } from 'bech32'
import { ethers } from 'ethers'

export const addressPrefix: Record<ChainType, string> = {
  [ChainType.ethereum]: '0x',
  [ChainType.terra]: 'terra1',
  [ChainType.cosmos]: 'cosmos1',
  [ChainType.osmosis]: 'osmo1',
  [ChainType.kujira]: 'kujira1',
  [ChainType.juno]: 'juno1',
}

export function isValidAddress(address: string, chain: ChainType): boolean {
  if (!address.startsWith(addressPrefix[chain])) return false

  if (chain === ChainType.ethereum) {
    // EVM address
    try {
      const checkedAddress = ethers.utils.getAddress(address)
      return address.toLowerCase() === checkedAddress.toLowerCase()
    } catch {
      return false
    }
  } else {
    // bech32 address
    try {
      bech32.decode(address) // throw error if checksum is invalid
      return true
    } catch {
      return false
    }
  }
}
