import { TerraLedgerWallet, ChainType } from '@terra-money/bridge-sdk'
import { useState } from 'react'

export default function LedgerTerraWallet() {
  const [address, setAddress] = useState<string | undefined>()
  const [balance, setBalance] = useState<number>(0)
  const wallet = new TerraLedgerWallet()

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
