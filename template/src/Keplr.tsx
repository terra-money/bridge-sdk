import {
  KeplrWallet,
  ChainType,
  BridgeType,
  Wallet,
} from '@terra-money/bridge-sdk'
import { useState } from 'react'
import SendToken from './SendToken'

export default function Keplr() {
  const [address, setAddress] = useState<string | undefined>()
  const [balance, setBalance] = useState<number>(0)
  const [chain, setChain] = useState<ChainType | undefined>()
  const [wallet] = useState<Wallet>(new KeplrWallet())

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
            {chain === ChainType.kujira && 'ukuji'}
            {chain === ChainType.juno && 'ujuno'}
          </p>
          {!!chain && (
            <SendToken
              wallet={wallet}
              fromChain={chain}
              bridge={BridgeType.ics20}
            ></SendToken>
          )}
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
          <button
            onClick={async () => {
              setChain(ChainType.juno)
              setAddress((await wallet.connect(ChainType.juno)).address)
              const balResult = await wallet.getBalance('ujuno')
              if (balResult.success) {
                setBalance(balResult.data)
              }
            }}
          >
            Connect Juno
          </button>
          <button
            onClick={async () => {
              setChain(ChainType.kujira)
              setAddress((await wallet.connect(ChainType.kujira)).address)
              const balResult = await wallet.getBalance('ukuji')
              if (balResult.success) {
                setBalance(balResult.data)
              }
            }}
          >
            Connect Kujira
          </button>
        </>
      )}
    </section>
  )
}
