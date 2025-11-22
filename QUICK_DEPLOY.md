# 🚀 Quick Deploy Checklist

## Prerequisites
- [ ] Node.js installed
- [ ] Git repository cloned
- [ ] Base Sepolia testnet ETH in 3 wallets:
  - Deployer wallet (for contract deployment)
  - Backend wallet (for confirmations)
  - Merchant wallet (to receive payments)

## 1. Database Setup (5 min)

```bash
# 1. Create Supabase project: https://supabase.com
# 2. Go to SQL Editor, run:

CREATE TABLE user_wallets (
  phone_number TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

# 3. Get credentials from Settings → API
```

## 2. Environment Variables (10 min)

Create `paymentSystem/.env.local`:

```bash
# From Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# From https://portal.cdp.coinbase.com/
CDP_API_KEY_NAME=organizations/xxx/apiKeys/xxx
CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----
...
-----END EC PRIVATE KEY-----

# Your wallets
MERCHANT_WALLET_ADDRESS=0xYourMerchantWallet
DEPLOYER_PRIVATE_KEY=abc123...
BACKEND_PRIVATE_KEY=def456...

# Network
BASE_SEPOLIA_RPC=https://sepolia.base.org
NETWORK_ID=base-sepolia

# Agent
AGENT_API_URL=http://localhost:8000/price
AGENT_FEE_ETH=0.001
NODE_ENV=development

# Will fill after Step 3:
ESCROW_CONTRACT_ADDRESS=
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=
```

## 3. Deploy Smart Contract (5 min)

### Option A: Remix (Easiest)
```
1. Go to https://remix.ethereum.org
2. Create file: X402Escrow.sol
3. Copy from: paymentSystem/contracts/X402Escrow.sol
4. Compile: Solidity 0.8.20
5. Deploy:
   - Environment: Injected Provider - MetaMask
   - Network: Base Sepolia
   - Constructor arg: YOUR_MERCHANT_WALLET_ADDRESS
6. Copy deployed address
```

### Option B: Hardhat (Node 22+ required)
```bash
cd paymentSystem
npx hardhat run scripts/deploy.js --network baseSepolia
```

## 4. Update Contract Address (1 min)

Add to `.env.local`:
```bash
ESCROW_CONTRACT_ADDRESS=0xYourDeployedAddress
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xYourDeployedAddress
```

## 5. Start Services (2 min)

### Terminal 1: Dummy Agent
```bash
cd dummyAgent
npm install
npm start
```

### Terminal 2: Payment System
```bash
cd paymentSystem
npm install
npm run dev
```

## 6. Test (5 min)

```
1. Open http://localhost:3000
2. Enter phone: +1234567890
3. Connect MetaMask (Base Sepolia)
4. Search: "USB-C charger"
5. Pay → Approve transaction
6. Wait for confirmation
7. ✅ Success!
```

## Verify on BaseScan

```
https://sepolia.basescan.org/address/YOUR_ESCROW_CONTRACT_ADDRESS
```

## Total Time: ~30 minutes

---

## Troubleshooting One-Liners

```bash
# Port 3000 in use
lsof -ti:3000 | xargs kill -9

# Port 8000 in use
lsof -ti:8000 | xargs kill -9

# Check config
cd paymentSystem && node check-config.js

# Rebuild
npm run build

# Check wallet balance
# Go to: https://sepolia.basescan.org/address/YOUR_ADDRESS
```

---

## Production Checklist

Before mainnet:
- [ ] Test full flow 3+ times
- [ ] Test timeout refunds
- [ ] Secure private keys (use env vault)
- [ ] Deploy to Base mainnet (change RPC)
- [ ] Update all addresses
- [ ] Set up monitoring
- [ ] Create backup of keys
- [ ] Document recovery process

---

**Ready? Start with Step 1!** 🚀

