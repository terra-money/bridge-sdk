import { KeplrWallet, ChainType } from '@terra-money/bridge-sdk'
import { useState } from 'react'

export default function Keplr() {
  const [address, setAddress] = useState<string | undefined>()
  const [balance, setBalance] = useState<number>(0)
  const [chain, setChain] = useState<ChainType | undefined>()
  const wallet = new KeplrWallet()

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
          <p>
            Balance: {balance} {chain === ChainType.osmosis && 'uosmo'}
            {chain === ChainType.cosmos && 'uatom'}
          </p>
        </>
      ) : (
        <>
          <p className='red'>
            <b>Not connected</b>
          </p>
          <button
            onClick={async () => {
              setChain(ChainType.osmosis)
              setAddress((await wallet.connect(ChainType.osmosis)).address)
              const balResult = await wallet.getBalance('uosmo')
              if (balResult.success) {
                setBalance(balResult.data)
              }
            }}
          >
            Connect Osmosis
          </button>
          <button
            onClick={async () => {
              setChain(ChainType.cosmos)
              setAddress((await wallet.connect(ChainType.cosmos)).address)
              const balResult = await wallet.getBalance('uatom')
              if (balResult.success) {
                setBalance(balResult.data)
              }
            }}
          >
            Connect Cosmos
          </button>
        </>
      )}
    </section>
  )
}
