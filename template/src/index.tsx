import React from 'react'
import ReactDOM from 'react-dom/client'
import LogoPng from './bridge-sdk-logo.png'
import './index.css'
import Keplr from './Keplr'
import Metamask from './Metamask'
import Station from './Station'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <header>
      <img src={LogoPng} alt='Bridge SDK' />
      <a href='https://github.com/terra-money/bridge-sdk' target='_blank' rel='noreferrer'>GitHub</a>
    </header>
    <Station />
    <Keplr />
    <Metamask />
  </React.StrictMode>,
)
