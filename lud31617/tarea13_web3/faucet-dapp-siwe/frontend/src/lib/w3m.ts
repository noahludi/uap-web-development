'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { sepolia } from 'wagmi/chains'
import { wagmiConfig } from '@/lib/wagmi'

const pid = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Ejecutar SOLO en navegador y una sola vez
if (typeof window !== 'undefined' && pid) {
  const w = window as any
  if (!w.__W3M_INIT__) {
    w.__W3M_INIT__ = true
    createWeb3Modal({
      wagmiConfig,
      projectId: pid,
      defaultChain: sepolia,
      enableAnalytics: false
    })
  }
}

export {}
