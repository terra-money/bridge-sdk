# Bridge SDK

## Basic usage

Install from npm:
```bash
npm i @terra-money/bridge-sdk
```

Connect station:
```js
import { StationWallet, ChainType, BridgeType, isValidAddress } from '@terra-money/bridge-sdk'

const wallet = new StationWallet()

if (!wallet.isSupported()) {
  console.log(
    `${wallet.description.name} is not supported on your device, please try from a different wallet.`,
  )
} else if (!wallet.isInstalled()) {
  console.log(`You can install ${wallet.description.name} here: ${wallet.description.installLink}`)
}

wallet
  .connect(ChainType.terra)
  .then(({ address }) => console.log(address))
```

Get the balance (wallet must be already connected):
```js
wallet
  .getBalance('uluna')
  .then((res) => {
    res.success
      ? console.log(`Balance: ${res.data} uluna`)
      : console.log(`Error: ${res.error}`
  })
```

Send tx from station (wallet must be already connected):

```js
const destinationAddress = 'osmo1...'

// validate destination address
if(!isValidAddress(destinationAddress, ChainType.osmosis)) {
  console.log('Error: invalid address')
  return
}

// transfer
wallet
  .transfer({
    src: ChainType.terra,
    dst: ChainType.osmosis,
    bridge: BridgeType.ibc,
    address: destinationAddress,
    coin: {
      amount: 100_000,
      denom: 'uluna',
    },
  })
  .then((res) => {
    res.success
      ? console.log(`TX hash: ${res.txhash}`)
      : console.log(`Error: ${res.error}`
  })
```

> You can use the same functions on the `KeplrWallet` and `MetaMaskWallet` to send a tx from those wallets
> 
> You can find more info about the available functions on the [Wallet inteface](/src/wallets/Wallet.ts#25)


## Coming soon

- More IBC chains

- Support for wormhole

- Other wallets: (Station mobile, Coinbase wallet, BSC, WalletConnect, Keplr Mobile)

- Function `estimateBridgeFee()` to calculate the fee that the user will pay on the transfer.

- Function `waitForTx()`to wait until the tx is confirmed on-chain.

- Functions `onAccountChange()` and `onNetworkChange()` to trigger actions when the user switch account or networ.
