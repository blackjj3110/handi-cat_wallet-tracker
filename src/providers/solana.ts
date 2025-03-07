import { Connection, clusterApiUrl } from '@solana/web3.js'
import dotenv from 'dotenv'

dotenv.config()

// Important: If you use any provider other than Helius you will notice some missing notifications
const SOLANA_NETWORK = clusterApiUrl('mainnet-beta')
const HELIUS_NETWORK = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
const CHAINSTACK_NETWORK = process.env.CHAINSTACK_API_KEY ?? ''
const QUICKNODE_NETWORK = process.env.QUICKNODE_API_KEY ?? ''

export const logConnection = new Connection(HELIUS_NETWORK, {
  commitment: 'processed',
})
export const connection = new Connection(CHAINSTACK_NETWORK, 'confirmed')
