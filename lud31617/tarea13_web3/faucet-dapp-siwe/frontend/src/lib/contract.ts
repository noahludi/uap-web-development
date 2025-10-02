export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  ('0x3e2117c19a921507ead57494bbf29032f33c7412' as const)

// ABI mínima según la consigna
export const faucetAbi = [
  // Faucet
  { "type":"function","name":"claimTokens","inputs":[],"outputs":[],"stateMutability":"nonpayable" },
  { "type":"function","name":"hasAddressClaimed","inputs":[{"name":"addr","type":"address"}],"outputs":[{"type":"bool"}],"stateMutability":"view" },
  { "type":"function","name":"getFaucetUsers","inputs":[],"outputs":[{"type":"address[]"}],"stateMutability":"view" },
  { "type":"function","name":"getFaucetAmount","inputs":[],"outputs":[{"type":"uint256"}],"stateMutability":"view" },

  // ERC20 relevantes
  { "type":"function","name":"name","inputs":[],"outputs":[{"type":"string"}],"stateMutability":"view" },
  { "type":"function","name":"symbol","inputs":[],"outputs":[{"type":"string"}],"stateMutability":"view" },
  { "type":"function","name":"decimals","inputs":[],"outputs":[{"type":"uint8"}],"stateMutability":"view" },
  { "type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"type":"uint256"}],"stateMutability":"view" }
] as const
