# 🔐 X402 Escrow Smart Contract Setup

This guide will help you deploy and configure the escrow smart contract for x402 payments.

## 📋 What Is the Escrow Contract?

The escrow contract holds user payments securely until the agent completes the task:
- ✅ **User pays** → Funds locked in smart contract
- ✅ **Agent completes** → Backend confirms → Funds released to merchant
- ✅ **No confirmation after 15 min** → Funds automatically refunded to user

## 🚀 Quick Start

### Step 1: Compile the Contract

```bash
cd paymentSystem
npx hardhat compile
```

### Step 2: Run Tests (Optional but Recommended)

```bash
npx hardhat test
```

You should see all tests passing:
```
✓ Should create payment with correct details
✓ Should confirm payment and send to merchant
✓ Should refund after timeout
```

### Step 3: Configure Environment Variables

Add these to your `.env.local`:

```bash
# Merchant wallet (where confirmed payments go)
MERCHANT_WALLET_ADDRESS=0xYourMerchantWalletAddress

# Deployer wallet (for deploying the contract)
DEPLOYER_PRIVATE_KEY=your-private-key-here

# Backend wallet (for confirming payments)
BACKEND_PRIVATE_KEY=your-backend-private-key-here

# Network RPC
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Will be filled after deployment:
ESCROW_CONTRACT_ADDRESS=

# For frontend access:
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=
```

### Step 4: Get Test ETH

Get Base Sepolia testnet ETH from:
- https://www.alchemy.com/faucets/base-sepolia
- https://docs.base.org/tools/network-faucets

Send to your deployer and backend wallet addresses.

### Step 5: Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

Output:
```
🚀 Deploying X402Escrow...
   Merchant Wallet: 0x...
   Network: baseSepolia

✅ X402Escrow deployed to: 0xABC123...

📝 Add to .env.local:
ESCROW_CONTRACT_ADDRESS=0xABC123...
```

### Step 6: Update `.env.local`

Add the contract address:

```bash
ESCROW_CONTRACT_ADDRESS=0xABC123...
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xABC123...
```

### Step 7: Restart Your Dev Server

```bash
npm run dev
```

## 🎯 How It Works

### User Flow:

```
1. User searches for product → Backend returns 402 Payment Required
   ↓
2. User connects wallet → Pays escrow contract
   - Contract emits: PaymentCreated(orderId, user, amount)
   - Funds locked for 15 minutes
   ↓
3. Backend detects payment → Calls agent API
   ↓
4. Agent completes task → Returns proof
   ↓
5. Backend confirms on-chain → Calls: confirmPayment(orderId)
   - Contract sends ETH to MERCHANT_WALLET_ADDRESS
   - Contract emits: PaymentConfirmed(orderId, backend)
   ↓
6. ✅ Success! User receives product
```

### Timeout Flow:

```
1. User pays → Funds locked
   ↓
2. Agent fails or backend doesn't confirm
   ↓
3. 15 minutes pass
   ↓
4. Anyone calls: refundExpiredPayment(orderId)
   ↓
5. Contract sends ETH back to user
   ↓
6. ✅ User gets refund
```

## 🔧 Contract Functions

### `createPayment(bytes32 orderId)` payable
- **Called by**: User's frontend
- **Does**: Locks ETH in escrow
- **Emits**: `PaymentCreated(orderId, payer, amount)`

### `confirmPayment(bytes32 orderId)`
- **Called by**: Your backend (after agent completes)
- **Does**: Sends ETH to merchant wallet
- **Emits**: `PaymentConfirmed(orderId, confirmer)`

### `refundExpiredPayment(bytes32 orderId)`
- **Called by**: Anyone (after 15 min timeout)
- **Does**: Returns ETH to original payer
- **Emits**: `PaymentRefunded(orderId)`

### `getPayment(bytes32 orderId)`
- **Returns**: Payment details (payer, amount, timestamp, completed)

### `isExpired(bytes32 orderId)`
- **Returns**: True if payment can be refunded

## 🔑 Environment Variables Explained

### `MERCHANT_WALLET_ADDRESS`
Where confirmed payments go. This is YOUR wallet that receives ETH after successful transactions.

### `DEPLOYER_PRIVATE_KEY`
Private key used to deploy the contract. Only needed once for deployment.

### `BACKEND_PRIVATE_KEY`
Private key your backend uses to call `confirmPayment()`. Keep this secure on your server!

### `ESCROW_CONTRACT_ADDRESS`
The deployed contract address. Copied from deployment output.

### `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS`
Same as above, but with `NEXT_PUBLIC_` prefix so frontend can access it.

## 📊 Testing the Flow

### 1. Test Payment Creation (Frontend)
```typescript
// User pays
const orderId = generateOrderId(paymentId);
await writeContract({
  address: escrowContractAddress,
  abi: escrowABI,
  functionName: 'createPayment',
  args: [orderId],
  value: parseEther('0.01')
});
```

### 2. Check Payment in Contract
```bash
npx hardhat console --network baseSepolia
```
```javascript
const escrow = await ethers.getContractAt("X402Escrow", "0xYourContractAddress");
const orderId = ethers.id("your-payment-id");
const payment = await escrow.getPayment(orderId);
console.log(payment);
```

### 3. Test Confirmation (Backend)
After agent completes, your backend automatically calls:
```typescript
await confirmPaymentOnChain(paymentId);
```

### 4. Check Merchant Balance
```bash
npx hardhat console --network baseSepolia
```
```javascript
const balance = await ethers.provider.getBalance("0xYourMerchantWallet");
console.log(ethers.formatEther(balance));
```

## 🛡️ Security Considerations

### ✅ What's Secure:
- Funds locked in auditable smart contract
- Automatic refunds after timeout
- No single party controls the funds
- All transactions on-chain and verifiable

### ⚠️ What to Protect:
- **BACKEND_PRIVATE_KEY**: Keep this secret! Anyone with this can confirm payments
- **DEPLOYER_PRIVATE_KEY**: Only needed for deployment, can be stored offline after
- **MERCHANT_WALLET_ADDRESS**: Public, but make sure you control it

### 🔐 Best Practices:
1. Use separate wallets for deployer, backend, and merchant
2. Store private keys in secure environment variables
3. Never commit private keys to git
4. Use hardware wallets for merchant wallet
5. Monitor contract events for suspicious activity

## 🐛 Troubleshooting

### "ESCROW_CONTRACT_ADDRESS not configured"
- Make sure you added both `ESCROW_CONTRACT_ADDRESS` and `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS` to `.env.local`
- Restart your dev server after updating `.env.local`

### "BACKEND_PRIVATE_KEY not configured"
- Add your backend wallet's private key to `.env.local`
- Make sure it has some Base Sepolia ETH for gas

### "Transfer failed"
- Check that `MERCHANT_WALLET_ADDRESS` is a valid address
- Make sure it's not a smart contract (unless it can receive ETH)

### "Not expired yet"
- You can only refund after 15 minutes
- Use `isExpired(orderId)` to check

### Payment confirmed but merchant didn't receive funds
- Check the transaction on BaseScan
- Verify `MERCHANT_WALLET_ADDRESS` in the contract
- Call `escrow.merchantWallet()` to confirm

## 📚 Additional Resources

- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Hardhat Docs**: https://hardhat.org/docs
- **Viem Docs**: https://viem.sh/
- **x402 Protocol**: https://x402.gitbook.io/x402

## 🎉 Next Steps

Once deployed and configured:
1. Test the full flow end-to-end
2. Monitor contract events
3. Consider deploying to mainnet when ready
4. Set up monitoring/alerting for failed confirmations

---

**Your x402 payment system is now secured by smart contracts!** 🚀

