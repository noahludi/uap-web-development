'use client'
import { useAccount } from 'wagmi'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getToken } from '@/lib/auth'
import { claim, status } from '@/lib/api'
import { CONTRACT_ADDRESS } from '@/lib/contract'
import { formatUnits } from 'viem'

const short = (a?: `0x${string}`) => (a ? `${a.slice(0,6)}…${a.slice(-4)}` : '')

export default function Faucet() {
  const { address, isConnected } = useAccount()
  const [jwt, setJwt] = useState<string | null>(null)

  const [name, setName] = useState<string>('—')
  const [symbol, setSymbol] = useState<string>('—')
  const [decimals, setDecimals] = useState<number>(18)
  const [amount, setAmount] = useState<string>('0')
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [users, setUsers] = useState<string[]>([])

  const [txHash, setTxHash] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => setJwt(getToken()), [])

  async function load() {
    if (!jwt || !address) return
    const s = await status(jwt, address)
    setHasClaimed(s.hasClaimed)
    setBalance(s.balance)
    setUsers(s.users)
    setAmount(s.amount)
    setName(s.token.name)
    setSymbol(s.token.symbol)
    setDecimals(Number(s.token.decimals))
  }

  useEffect(() => { load().catch(console.error) }, [jwt, address])

  const prettyAmount = useMemo(() => formatUnits(BigInt(amount || '0'), decimals), [amount, decimals])
  const prettyBalance = useMemo(() => formatUnits(BigInt(balance || '0'), decimals), [balance, decimals])
  const canClaim = isConnected && !!jwt && hasClaimed === false && !sending

  async function handleClaim() {
    if (!jwt) return alert('Primero iniciá sesión (SIWE)')
    setSending(true); setErr(null); setTxHash(null)
    try {
      const { txHash } = await claim(jwt)
      setTxHash(txHash)
      // pequeña espera y refrescamos estado
      setTimeout(load, 5000)
    } catch (e: any) {
      setErr(e?.message || 'Error en reclamo')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="p-4 grid gap-4 md:grid-cols-2">
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Información del Token</h2>
        <div className="text-sm space-y-1">
          <div><span className="opacity-70">Nombre:</span> {name}</div>
          <div><span className="opacity-70">Símbolo:</span> {symbol}</div>
          <div><span className="opacity-70">Decimales:</span> {decimals}</div>
          <div><span className="opacity-70">Faucet amount:</span> {prettyAmount} {symbol}</div>
          <div><span className="opacity-70">Contrato:</span>{' '}
            <Link className="underline" href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank">
              {short(CONTRACT_ADDRESS)}
            </Link>
          </div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Tu Estado</h2>
        {!isConnected ? (
          <p className="text-sm">Conectá tu wallet.</p>
        ) : !jwt ? (
          <p className="text-sm text-amber-500">Iniciá sesión (SIWE) desde el header para ver y reclamar.</p>
        ) : (
          <div className="text-sm space-y-1">
            <div><span className="opacity-70">Dirección:</span> {short(address)}</div>
            <div><span className="opacity-70">Balance:</span> {prettyBalance} {symbol}</div>
            <div><span className="opacity-70">¿Ya reclamaste?</span> {hasClaimed === null ? '—' : hasClaimed ? 'Sí' : 'No'}</div>
          </div>
        )}
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Reclamar Tokens</h2>
        <button
          disabled={!canClaim}
          onClick={handleClaim}
          className={`px-4 py-2 rounded border ${canClaim ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
        >
          {sending ? 'Enviando…' : 'Reclamar'}
        </button>

        <div className="mt-3 text-sm space-y-1">
          {err && <div className="text-red-600">Error: {err}</div>}
          {txHash && (
            <div>TX:{' '}
              <Link className="underline" target="_blank" href={`https://sepolia.etherscan.io/tx/${txHash}`}>
                {short(txHash as `0x${string}`)}
              </Link>
            </div>
          )}
          {hasClaimed && <div className="text-green-700">Ya reclamaste; el botón se desactiva.</div>}
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Usuarios del Faucet</h2>
        {!users?.length ? <p className="text-sm opacity-70">Sin usuarios todavía.</p> : (
          <ul className="text-sm list-disc pl-5 space-y-1 max-h-56 overflow-auto">
            {users.map((u) => <li key={u}>{u}</li>)}
          </ul>
        )}
      </div>
    </section>
  )
}
