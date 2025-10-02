const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function getSiweMessage(address: string) {
  const r = await fetch(`${API}/auth/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<{ message: string; nonce: string }>
}

export async function signin(address: string, message: string, signature: string) {
  const r = await fetch(`${API}/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, message, signature }) })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<{ token: string; address: string }>
}

export async function claim(token: string) {
  const r = await fetch(`${API}/faucet/claim`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<{ txHash: `0x${string}`; success: boolean }>
}

export async function status(token: string, address: string) {
  const r = await fetch(`${API}/faucet/status/${address}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<{ hasClaimed: boolean; balance: string; users: string[]; amount: string; token: { name: string; symbol: string; decimals: number } }>
}
