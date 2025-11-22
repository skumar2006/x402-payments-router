# Real USDC Payments Integration - Complete! ✅

Your x402 payment system now supports **real wallet connections** and **real USDC transactions** on Base Sepolia!

## What Changed

### Before (Demo Mode)
- ❌ "Simulate Payment" button
- ❌ Fake transaction signatures
- ❌ No actual blockchain interaction

### Now (Real Payments)
- ✅ **"Connect Wallet" button** (top right)
- ✅ **Real wallet popup** (Coinbase Wallet, MetaMask, Rainbow)
- ✅ **Real USDC transfers** on Base Sepolia
- ✅ **On-chain transaction confirmation**
- ✅ **Actual gas fees paid**

## Quick Setup

### 1. Install New Dependencies

```bash
cd paymentSystem
npm install
```

New packages added:
- `@rainbow-me/rainbowkit` - Wallet connection UI
- `wagmi` - React hooks for Ethereum
- `viem` - Ethereum interactions
- `@tanstack/react-query` - Data fetching

### 2. Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com/
2. Create project
3. Copy Project ID
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

### 3. Set Your Merchant Wallet

Where you want to receive USDC payments:

```bash
MERCHANT_WALLET_ADDRESS=0xYourWalletAddressHere
```

### 4. Get Test Funds

See [WALLET_SETUP.md](./WALLET_SETUP.md) for detailed instructions.

Quick version:
- Get test ETH: https://sepoliafaucet.com/
- Get test USDC: https://faucet.circle.com/ (select Base Sepolia)

## Complete .env.local

```bash
# Required
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
MERCHANT_WALLET_ADDRESS=0xYourMerchantWalletAddress

# Optional
AGENT_FEE_USDC=2.00
NETWORK_ID=base-sepolia

# Optional: Coinbase CDP (for automatic wallet creation)
# CDP_API_KEY_NAME=your-api-key-name
# CDP_API_KEY_PRIVATE_KEY=your-private-key
```

## How It Works Now

### User Flow

```
1. User opens app
   ↓
2. Clicks "Connect Wallet" (top right)
   ↓
3. Wallet popup appears (Coinbase Wallet/MetaMask)
   ↓
4. User connects & switches to Base Sepolia
   ↓
5. User enters product query
   ↓
6. System fetches price from agent ($12.99)
   ↓
7. 402 Payment Required shown ($14.99 = $12.99 + $2.00 fee)
   ↓
8. User clicks "Pay with USDC"
   ↓
9. Wallet popup: "Send 14.99 USDC to 0x..."
   ↓
10. User approves transaction
   ↓
11. Transaction confirmed on-chain
   ↓
12. Backend verifies transaction
   ↓
13. Agent executes purchase
   ↓
14. Results displayed!
```

### Technical Flow

```javascript
// 1. User connects wallet
<ConnectButton /> // RainbowKit

// 2. User initiates payment
writeContract({
  address: USDC_ADDRESS,
  abi: USDC_ABI,
  functionName: 'transfer',
  args: [merchantWallet, amount]
})

// 3. Wait for confirmation
const { isConfirmed, hash } = useWaitForTransactionReceipt()

// 4. Submit proof to backend
POST /api/agent/purchase
{
  paymentProof: {
    transactionHash: hash,
    from: userAddress
  }
}

// 5. Backend can verify on-chain
// Check transaction on Base Sepolia
// Confirm amount and recipient match
```

## Testing

### Start Everything

```bash
# Terminal 1: Agent
cd dummyAgent
npm start

# Terminal 2: Payment System
cd paymentSystem
npm run dev
```

### Test Flow

1. Go to http://localhost:3000
2. **Connect your wallet** (top right)
3. Switch to **Base Sepolia** network
4. Enter "USB-C charger"
5. Click "Request Agent Service"
6. See: **$14.99 USDC** ($12.99 product + $2.00 fee)
7. Click **"Pay with USDC"**
8. **Wallet pops up** - approve transaction
9. Wait for confirmation (~5 seconds)
10. See results!

### Check Transaction

Your transaction will appear on Base Sepolia:
```
https://sepolia.basescan.org/tx/YOUR_TX_HASH
```

You'll see:
- ✅ From: Your wallet
- ✅ To: Merchant wallet
- ✅ Amount: 14.99 USDC
- ✅ Gas paid
- ✅ Status: Success

## Features

### Wallet Support
- ✅ Coinbase Wallet
- ✅ MetaMask
- ✅ Rainbow Wallet
- ✅ WalletConnect (any compatible wallet)

### Network
- ✅ Base Sepolia (testnet)
- 🔜 Base Mainnet (coming soon)

### Tokens
- ✅ USDC (ERC-20)
- 🔜 Other tokens (ETH, DAI, etc.)

## Security Notes

### Current Implementation
- ✅ Real on-chain transactions
- ✅ User must approve each payment
- ✅ Cannot be spent without user consent
- ⚠️ Basic verification (trusts transaction hash)

### For Production
Need to add:
- [ ] Full on-chain verification (check sender, amount, recipient)
- [ ] x402 facilitator integration
- [ ] Replay attack prevention
- [ ] Transaction timeout handling
- [ ] Refund logic
- [ ] Dispute resolution

## Troubleshooting

### "Connect button not showing"
- Run `npm install` again
- Check console for errors
- Make sure `.env.local` has `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### "Wallet not connecting"
- Check you have a wallet extension installed
- Try different wallet (Coinbase Wallet recommended)
- Clear cache and retry

### "Transaction failing"
- Check you have ETH for gas (even small amount)
- Check you have enough USDC
- Check you're on Base Sepolia network (Chain ID: 84532)

### "Insufficient USDC balance"
- Get test USDC: https://faucet.circle.com/
- Select Base Sepolia network
- Enter your wallet address

## Next Steps

### Move to Mainnet

When ready for production:

1. Update config to use Base mainnet:
```bash
NETWORK_ID=base
MERCHANT_WALLET_ADDRESS=0xYourMainnetWallet
```

2. Update `wagmiConfig.ts`:
```typescript
import { base } from 'wagmi/chains';
chains: [base] // instead of baseSepolia
```

3. Use real USDC address for Base:
```typescript
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
```

4. Test with small amounts first!

## Resources

- [WALLET_SETUP.md](./WALLET_SETUP.md) - Complete wallet setup guide
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Wagmi Docs](https://wagmi.sh/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Circle USDC Faucet](https://faucet.circle.com/)

## You're Live! 🚀

Your x402 system now processes **real blockchain transactions**!

Users can:
- ✅ Connect real wallets
- ✅ Pay with real USDC
- ✅ See real on-chain confirmations
- ✅ Track transactions on block explorer

Next: Get test funds and try it yourself! See [WALLET_SETUP.md](./WALLET_SETUP.md)

