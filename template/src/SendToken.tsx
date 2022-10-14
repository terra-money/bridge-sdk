import {
  BridgeType,
  ChainType,
  Token,
  Wallet,
  whitelist,
} from '@terra-money/bridge-sdk'
import React, { FunctionComponent, useState } from 'react'
import { useInput } from './hooks/useInput'

interface SendTokenProps {
  wallet: Wallet
  fromChain: ChainType
  bridge: BridgeType
}

interface TokenInfo {
  src: ChainType
  dst: ChainType
  fromToken: string
  fromTokenName: string
  bridgeType: BridgeType
}

const SendToken: FunctionComponent<SendTokenProps> = (props) => {
  const [infos, setState] = useState(() => getInfos(props))

  let [address, addressInput] = useInput({ type: 'text' })

  return (
    <React.Fragment>
      <div>Send {props.bridge}</div>

      {addressInput}

      {infos.map((info) => (
        <button
          style={{ marginTop: '10px', width: '100%' }}
          key={info.fromToken + '-' + info.dst}
          onClick={async () => {
            let result = await props.wallet.transfer({
              bridge: info.bridgeType,
              coin: { amount: 1, denom: info.fromToken },
              src: info.src,
              dst: info.dst,
              address: address,
            })
            console.log('result', result)
          }}
        >
          Send 1 u{info.fromTokenName} to {info.dst}
        </button>
      ))}
    </React.Fragment>
  )
}

export default SendToken

function getInfos(props: SendTokenProps) {
  let infos: TokenInfo[] = []
  if (props.fromChain !== ChainType.terra) {
    let tokens = whitelist[props.fromChain][props.bridge]
    console.log(
      '🚀 ~ file: SendToken.tsx ~ line 59 ~ getInfos ~ whitelist',
      whitelist,
    )
    if (tokens) {
      infos = Object.keys(tokens).map((terraToken) => {
        let fromToken = tokens[terraToken]

        let fromTokenName = Object.keys(Token).find(
          (a) => Token[a as keyof typeof Token] === fromToken,
        )
        return {
          src: props.fromChain,
          dst: ChainType.terra,
          fromToken: fromToken,
          bridgeType: props.bridge,
          fromTokenName,
        } as TokenInfo
      })
    }
  } else {
    for (let chain of Object.keys(whitelist)) {
      let tokens = whitelist[chain as ChainType][props.bridge]
      if (tokens) {
        infos.push(
          ...Object.keys(tokens).map((terraToken) => {
            let fromTokenName = Object.keys(Token).find(
              (a) => Token[a as keyof typeof Token] === terraToken,
            )
            console.log(
              '🚀 ~ file: SendToken.tsx ~ line 93 ~ ...Object.keys ~ fromTokenName',
              fromTokenName,
            )

            return {
              src: props.fromChain,
              dst: chain,
              fromToken: terraToken,
              bridgeType: props.bridge,
              fromTokenName,
            } as TokenInfo
          }),
        )
      }
    }
  }
  return infos
}
