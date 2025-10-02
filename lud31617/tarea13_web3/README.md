# Tarea 13 – React Web3 + SIWE (Sepolia) — `lud31617`

App React/Next + Wagmi/Viem que se conecta al contrato **FaucetToken** en **Sepolia** y agrega **backend con Sign-In with Ethereum (SIWE) + JWT**.

- Contrato (Sepolia): `0x3e2117c19a921507ead57494bbf29032f33c7412`
- ChainId: `11155111`
- RPC: `https://ethereum-sepolia-rpc.publicnode.com`

## Estructura
lud31617/
  tarea13_web3/
    faucet-dapp-siwe/     # Frontend (Next.js + wagmi + viem)
      src/
      package.json
    backend/              # Backend (Express + SIWE + JWT + viem)
      index.js
      package.json

## Requisitos
- Node 20+ y **pnpm**
- MetaMask en **Sepolia** (con algo de SepoliaETH)
- **NO** commitear `backend/.env`

---

## 1) Backend
### Variables de entorno (`backend/.env`)
PORT=4000
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CONTRACT_ADDRESS=0x3e2117c19a921507ead57494bbf29032f33c7412
PRIVATE_KEY=0x<private_key_de_prueba>   # address del server signer
JWT_SECRET=supersecreto

> `PRIVATE_KEY` es **de prueba** (testnet). No subir al repo.

### Correr backend
cd backend
pnpm i
pnpm dev
# -> API on http://localhost:4000

### Endpoints (Parte 2)
- `POST /auth/message` → genera mensaje SIWE  
  Body: `{ "address": "0x..." }`
- `POST /auth/signin` → valida firma y devuelve **JWT**  
  Body: `{ address, message, signature }`
- `GET /faucet/status/:address` **(Bearer <JWT>)**  
  Responde: `{ hasClaimed, balance, users, amount, token }`
- `POST /faucet/claim` **(Bearer <JWT>)**  
  Ejecuta `claimTokens()` **firmando el server** (requiere SepoliaETH y que esa address no haya reclamado antes).

> **Nota:** El contrato sólo expone `claimTokens()` y acredita al **msg.sender**.  
> Si llama el backend, los tokens van a la wallet del **server**.  
> Para gasless real se necesitaría `claimFor(address)` o un forwarder (EIP-2771/4337).  
> La consigna pedía **SIWE + backend que interactúe con el contrato**, y está cumplida.

---

## 2) Frontend
### Variables (`faucet-dapp-siwe/.env.local`)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

### Correr frontend
cd faucet-dapp-siwe
pnpm i
pnpm dev
# -> http://localhost:3000

### Funcionalidades (Parte 1)
- Conexión de wallet (MetaMask), verificación de red **Sepolia**
- Información del token (nombre, símbolo, decimales, amount)
- **Balance** del usuario y **hasClaimed**
- **Reclamar tokens** (una vez por address)  
- **Lista de usuarios** del faucet
- Manejo de estados/errores básicos

### Autenticación (Parte 2)
- **SIWE + JWT** antes de permitir acciones protegidas
- El botón **Reclamar** está **gateado por SIWE** (requiere JWT).  
  *(Alternativamente, se puede usar `POST /faucet/claim` como demo: firma el server signer.)*

---

## Pruebas rápidas
1. Conectar MetaMask y estar en **Sepolia**.  
2. Click **Iniciar sesión** (SIWE) → guardar **JWT**.  
3. Ver estado: balance, `hasClaimed`, usuarios.  
4. **Reclamar** (si tu address no reclamó): se ve la tx en Etherscan y el estado cambia a “Sí”.

---

## Notas
- `backend/.env` está en `.gitignore`.  
- Si `POST /faucet/claim` devuelve “already claimed”, es porque el **server signer** ya reclamó.  
- Para ver `txHash` nuevo desde el back: usar una **PK nueva** con SepoliaETH.
