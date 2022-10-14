import { StationWallet, ChainType, BridgeType } from '@terra-money/bridge-sdk'
import { useState } from 'react'
import SendToken from './SendToken'

export default function Station() {
  const [address, setAddress] = useState<string | undefined>()
  const [balance, setBalance] = useState<number>(0)
  const [wallet] = useState(new StationWallet())

  return (
    <section>
      <h3>
        <img src={wallet.description.icon} alt={wallet.description.name} />
        {wallet.description.name}
      </h3>

      <p>
        Supported:{' '}
        {wallet.isSupported() ? (
          <b className='green'>Yes</b>
        ) : (
          <b className='red'>No</b>
        )}
      </p>
      <p>
        Installed:{' '}
        {wallet.isInstalled() ? (
          <b className='green'>Yes</b>
        ) : (
          <b className='red'>No</b>
        )}
      </p>
      {address ? (
        <>
          <p className='blue'>
            <b>{address}</b>
          </p>
          <p>Balance: {balance} uluna</p>

          {
            <SendToken
              wallet={wallet}
              fromChain={ChainType.terra}
              bridge={BridgeType.ics20}
            ></SendToken>
          }
        </>
      ) : (
        <>
          <p className='red'>
            <b>Not connected</b>
          </p>
          <button
            onClick={async () => {
              setAddress((await wallet.connect(ChainType.terra)).address)
              const balResult = await wallet.getBalance('uluna')
              if (balResult.success) {
                setBalance(balResult.data)
              }
            }}
          >
            Connect
          </button>
        </>
      )}
    </section>
  )
}
