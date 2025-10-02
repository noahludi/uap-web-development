// backend/index.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { generateNonce, SiweMessage } from 'siwe'
import { createPublicClient, createWalletClient, http, getAddress, formatEther } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const app = express()
app.use(express.json())
app.use(cors({ origin: ['http://localhost:3000'], credentials: false }))

// --- Blockchain clients ---
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const publicClient = createPublicClient({ chain: sepolia, transport: http(process.env.RPC_URL) })
const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(process.env.RPC_URL) })
console.log('Server signer:', account.address)

// --- Faucet ABI (mínimo) ---
const faucetAbi = [
  { type: 'function', name: 'claimTokens', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'hasAddressClaimed', inputs: [{ name: 'addr', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'getFaucetUsers', inputs: [], outputs: [{ type: 'address[]' }], stateMutability: 'view' },
  { type: 'function', name: 'getFaucetAmount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }
]

// --- SIWE (nonce por address en memoria) ---
const nonces = new Map()


app.post('/auth/message', async (req, res) => {
  try {
    const { address } = req.body
    if (!address) return res.status(400).json({ error: 'address requerido' })

    const addr = getAddress(address)   // <- Normaliza a checksum (o tira error)
    const nonce = generateNonce()
    nonces.set(addr.toLowerCase(), nonce)

    const origin = req.headers.origin || 'http://localhost:3000'
    const domain = new URL(origin).hostname
    const uri = origin

    const message = new SiweMessage({
      domain,
      address: addr,                   // <- usamos la checksummed
      statement: 'Sign-In with Ethereum para Faucet dApp',
      uri,
      version: '1',
      chainId: sepolia.id,
      nonce
    }).prepareMessage()

    res.json({ message, nonce })
  } catch (e) {
    console.error('[/auth/message] ERROR:', e)
    res.status(500).json({ error: e.message })
  }
})

app.post('/auth/signin', async (req, res) => {
  try {
    const { address, message, signature } = req.body
    if (!address || !message || !signature) {
      return res.status(400).json({ error: 'address, message y signature requeridos' })
    }

    const addr = getAddress(address)   // <- normalizamos acá también
    const expected = nonces.get(addr.toLowerCase())
    if (!expected) return res.status(400).json({ error: 'nonce no encontrado, pedí /auth/message' })

    const origin = req.headers.origin || 'http://localhost:3000'
    const domain = new URL(origin).hostname

    const siwe = new SiweMessage(message)
    const { success } = await siwe.verify({ signature, nonce: expected, domain })
    if (!success) return res.status(401).json({ error: 'SIWE inválido' })

    nonces.delete(addr.toLowerCase())
    const token = jwt.sign({ address: addr }, process.env.JWT_SECRET, { expiresIn: '1h' })
    res.json({ token, address: addr })
  } catch (e) {
    console.error('[/auth/signin] ERROR:', e)
    res.status(401).json({ error: e.message })
  }
})

// --- Middleware JWT ---
function auth(req, res, next) {
  const hdr = req.headers.authorization || ''
  const [, token] = hdr.split(' ')
  if (!token) return res.status(401).json({ error: 'Missing Bearer token' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'JWT inválido/expirado' })
  }
}

// --- Endpoints protegidos ---
app.post('/faucet/claim', auth, async (req, res) => {
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: faucetAbi,
      functionName: 'claimTokens'
    })
    res.json({ txHash: hash, success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: e.shortMessage || e.message })
  }
})

app.get('/debug/signer', async (req, res) => {
  const bal = await publicClient.getBalance({ address: account.address })
  res.json({
    address: account.address,
    balanceWei: bal.toString(),
    balanceEth: formatEther(bal)
  })
})


app.get('/faucet/status/:address', auth, async (req, res) => {
  try {
    const addr = /** @type {`0x${string}`} */ (req.params.address)
    const [hasClaimed, balance, users, amount, name, symbol, decimals] = await Promise.all([
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'hasAddressClaimed', args: [addr] }),
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'balanceOf', args: [addr] }),
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'getFaucetUsers' }),
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'getFaucetAmount' }),
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'name' }),
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'symbol' }),
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: faucetAbi, functionName: 'decimals' })
    ])
    res.json({ hasClaimed, balance: balance.toString(), users, amount: amount.toString(), token: { name, symbol, decimals } })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.listen(process.env.PORT, () => {
  console.log(`API on http://localhost:${process.env.PORT}`)
})
