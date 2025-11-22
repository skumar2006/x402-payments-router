# ✅ Converted to ETH Payments

The entire system has been updated to use **native ETH** instead of USDC tokens.

## What Changed

### Frontend (`paymentSystem/app/page.tsx`)
- ✅ Changed from `useWriteContract` (for ERC20 tokens) to `useSendTransaction` (for native ETH)
- ✅ Changed from `parseUnits(amount, 6)` (USDC decimals) to `parseEther(amount)` (18 decimals)
- ✅ Updated all UI text: "USDC" → "ETH"
- ✅ Updated button text: "Pay with USDC" → "Pay with ETH"
- ✅ Removed USDC contract imports
- ✅ Agent fee changed: $2.00 USDC → 0.001 ETH

### Backend (`paymentSystem/app/api/agent/purchase/route.ts`)
- ✅ Changed currency from "USDC" to "ETH"
- ✅ Changed token from "USDC" to "ETH"
- ✅ Changed payment method from "transferWithAuthorization" to "nativeTransfer"
- ✅ Updated decimal precision: `.toFixed(2)` → `.toFixed(6)` (more precision for ETH)
- ✅ Updated env var: `AGENT_FEE_USDC` → `AGENT_FEE_ETH`
- ✅ Default agent fee: 2.00 → 0.001 ETH

### Dummy Agent (`dummyAgent/server.js`)
- ✅ Added USD to ETH conversion: `1 ETH ≈ $3000 USD`
- ✅ All prices now returned in both ETH and USD
- ✅ Product database updated: `price` → `priceUSD`, added `priceETH`
- ✅ Added helper function: `usdToEth(usdPrice)`

## Pricing Examples

| Product | USD Price | ETH Price |
|---------|-----------|-----------|
| USB-C Charger | $12.99 | 0.004330 ETH |
| Headphones | $279.99 | 0.093330 ETH |
| Laptop | $1199.00 | 0.399667 ETH |

**With Agent Fee (0.001 ETH):**
- USB-C Charger: 0.004330 + 0.001 = **0.005330 ETH total**

## How It Works Now

1. **User Flow:**
   ```
   Enter phone number → Connect wallet → Search product
   → See price in ETH → Approve ETH transfer → ✅ Done!
   ```

2. **Payment Flow:**
   - User's connected wallet sends ETH directly (no token approval needed!)
   - ETH goes to user's CDP wallet address (stored in database)
   - Transaction confirmed on Base Sepolia
   - Agent workflow executes

3. **Example Transaction:**
   ```
   Product: USB-C Charger
   Product Price: 0.004330 ETH ($12.99)
   Agent Fee: 0.001 ETH
   Total: 0.005330 ETH
   ```

## Benefits of ETH Over USDC

✅ **Simpler UX** - No need to acquire USDC tokens first
✅ **No Token Approval** - Direct transfers, no ERC20 approve step
✅ **Easier Testing** - Get test ETH from any faucet
✅ **Native Currency** - Works out of the box on any EVM chain

## Testing

### Get Test ETH (Base Sepolia)
1. Go to: https://www.alchemy.com/faucets/base-sepolia
2. Enter your wallet address
3. Get free test ETH

### Make a Purchase
1. Start services:
   ```bash
   # Terminal 1 - Dummy Agent
   cd dummyAgent && npm start
   
   # Terminal 2 - Payment System
   cd paymentSystem && npm run dev
   ```

2. Go to http://localhost:3000
3. Enter your phone number
4. Connect your wallet (with Base Sepolia ETH)
5. Search for: "USB-C Charger"
6. See price: ~0.005330 ETH total
7. Click "Pay with ETH"
8. Approve in wallet
9. ✅ Transaction confirmed!

## Environment Variables

Update your `.env.local`:

```bash
# Changed from AGENT_FEE_USDC
AGENT_FEE_ETH=0.001

# Rest stays the same
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute
DATABASE_URL=postgresql://localhost/x402_payments
CDP_API_KEY_NAME=your-key-name
CDP_API_KEY_SECRET=your-secret
MERCHANT_WALLET_ADDRESS=0xYourMerchantWallet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

## Technical Details

### ETH vs USDC Technical Differences

| Aspect | USDC (Old) | ETH (New) |
|--------|-----------|----------|
| Type | ERC20 Token | Native Currency |
| Decimals | 6 | 18 |
| Contract Call | `transfer()` | Native send |
| Approval Needed | Yes | No |
| Gas Token | ETH | ETH (same) |
| Wagmi Hook | `useWriteContract` | `useSendTransaction` |
| Viem Function | `parseUnits(x, 6)` | `parseEther(x)` |

### Code Changes Summary

**Removed:**
- `USDC_ADDRESS` constant
- `USDC_ABI` constant
- `writeContract` hook
- `parseUnits(..., 6)` calls

**Added:**
- `useSendTransaction` hook
- `parseEther()` calls
- ETH decimal handling (6 decimal places for display)

**Modified:**
- All currency labels
- All decimal precision
- Payment method type
- Agent fee amount

## Ready to Go! 🚀

The system is now fully converted to ETH payments. Much simpler and easier to test!

### Quick Start:
```bash
# Get Base Sepolia ETH from faucet
# Start both services
cd dummyAgent && npm start &
cd paymentSystem && npm run dev &
# Go to http://localhost:3000
# Make a purchase with ETH!
```

Enjoy seamless ETH payments! ⚡

