'use client'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { getSiweMessage, signin } from '@/lib/api'
import { getToken, setToken, clearToken } from '@/lib/auth'

const short = (a?: `0x${string}`) => (a ? `${a.slice(0,6)}…${a.slice(-4)}` : '')

export default function Header() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { connectors, connectAsync, isPending } = useConnect()
  const { signMessageAsync } = useSignMessage()

  // MetaMask (injected) – sin Web3Modal
  const injected = connectors.find(c => c.id === 'injected')

  const [jwt, setJwt] = useState<string | null>(null)
  useEffect(() => setJwt(getToken()), [])

  // Evitar doble solicitud a MetaMask
  const connectingRef = useRef(false)
  async function handleConnect() {
    if (!injected || isPending || connectingRef.current) return
    connectingRef.current = true
    try {
      await connectAsync({ connector: injected })
    } catch (err: any) {
      const code = err?.code ?? err?.cause?.code
      if (code === -32002) {
        alert('MetaMask ya tiene una solicitud abierta. Abrí el icono y aceptá/cancelá esa notificación.')
      } else {
        alert(err?.shortMessage || err?.message || 'No se pudo conectar')
      }
    } finally {
      connectingRef.current = false
    }
  }

  async function handleSiwe() {
    if (!address) return
    const { message } = await getSiweMessage(address)
    const signature = await signMessageAsync({ message })
    const { token } = await signin(address, message, signature)
    setToken(token)
    setJwt(token)
  }

  const onSepolia = chainId === Number(process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID ?? 11155111)

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg font-semibold">FaucetToken dApp</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border
            ${onSepolia ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
            {onSepolia ? 'Sepolia' : 'Switch a Sepolia'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              {jwt ? (
                <button className="inline-flex items-center rounded-lg border border-white/10 px-3 py-1 bg-white/5 hover:bg-white/10"
                        onClick={() => { clearToken(); setJwt(null) }}>
                  Cerrar sesión
                </button>
              ) : (
                <button className="inline-flex items-center rounded-lg border border-white/10 px-3 py-1 bg-white/5 hover:bg-white/10"
                        onClick={handleSiwe}>
                  Iniciar sesión
                </button>
              )}
              <span className="hidden sm:inline text-sm text-zinc-400">{short(address)}</span>
              <button className="inline-flex items-center rounded-lg border border-white/10 px-3 py-1 bg-white/5 hover:bg-white/10"
                      onClick={() => disconnect()}>
                Desconectar
              </button>
            </>
          ) : (
            <button
              className="inline-flex items-center rounded-lg border border-emerald-600/20 px-3 py-1 bg-emerald-600/90 hover:bg-emerald-600 text-white"
              onClick={handleConnect}
              disabled={!injected || isPending || connectingRef.current}
            >
              {isPending || connectingRef.current ? 'Conectando…' : 'Conectar MetaMask'}
            </button>
          )}
        </div>
      </div>
      
    </header>
  )
}
