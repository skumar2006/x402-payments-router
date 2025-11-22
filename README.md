# 🤖 x402 Purchasing Agent with Smart Contract Escrow

A complete implementation of the x402 payment protocol with **smart contract escrow** for secure, trustless agent payments.

## 🎯 What Is This?

This is a full-stack Web3 application that:
1. **User searches** for a product (e.g., "USB-C charger")
2. **Agent finds** the product and price
3. **User pays** via smart contract escrow (ETH on Base Sepolia)
4. **Agent purchases** the product
5. **Backend confirms** → Smart contract releases funds to merchant
6. **If agent fails** → Automatic refund after 15 minutes

## 🔐 Smart Contract Escrow

Payments are secured by an on-chain escrow contract:
- ✅ Funds locked until agent completes task
- ✅ Automatic refunds if no confirmation
- ✅ Trustless - no single party controls funds
- ✅ 15-minute timeout protection

## 📁 Project Structure

```
ethGlobalBA/
├── contracts/              ← Smart contracts (Hardhat)
│   ├── contracts/          ← Solidity files
│   ├── scripts/            ← Deployment scripts
│   └── test/               ← Contract tests
├── paymentSystem/          ← Main Next.js application
│   ├── app/                ← Next.js frontend & API routes
│   ├── lib/                ← Utilities (Supabase, CDP, escrow)
│   └── ...                 ← Config & docs
└── dummyAgent/             ← Mock agent API (for testing)
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/skumar2006/x402-payments-router.git
cd ethGlobalBA/paymentSystem
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in `paymentSystem/`:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Coinbase CDP (User Wallets)
CDP_API_KEY_NAME=organizations/your-org/apiKeys/your-key
CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----
...
-----END EC PRIVATE KEY-----

# Escrow Contract
MERCHANT_WALLET_ADDRESS=0xYourMerchantWallet
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
BACKEND_PRIVATE_KEY=your_backend_private_key
BASE_SEPOLIA_RPC=https://sepolia.base.org

# After deployment:
ESCROW_CONTRACT_ADDRESS=0xDeployedContractAddress
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xDeployedContractAddress

# Agent Configuration
AGENT_API_URL=http://localhost:8000/price
AGENT_FEE_ETH=0.001
NETWORK_ID=base-sepolia
NODE_ENV=development
```

### 3. Set Up Database

See `paymentSystem/SUPABASE_MIGRATION.md` for database setup.

### 4. Deploy Smart Contract

**Option A: Direct Deploy (Recommended)**
```bash
cd contracts
npm install
node scripts/deploy-direct.js
```

**Option B: Remix**
1. Go to https://remix.ethereum.org
2. Copy `contracts/contracts/X402Escrow.sol`
3. Compile and deploy with your `MERCHANT_WALLET_ADDRESS`

### 5. Start Dummy Agent

```bash
cd dummyAgent
npm install
npm start
# Runs on http://localhost:8000
```

### 6. Start Payment System

```bash
cd paymentSystem
npm run dev
# Open http://localhost:3000
```

## 🎮 How to Use

1. **Enter Phone Number** → Creates your CDP wallet
2. **Connect Wallet** → MetaMask or Coinbase Wallet
3. **Search Product** → "Buy me a USB-C charger"
4. **Pay** → ETH locked in escrow contract
5. **Wait** → Agent finds and "purchases" product
6. **Complete** → Funds released to merchant!

## 🏗️ Architecture

### Payment Flow

```
┌─────────┐         ┌──────────────┐         ┌──────────┐
│  User   │         │   Escrow     │         │ Merchant │
│ Wallet  │         │  Contract    │         │  Wallet  │
└────┬────┘         └──────┬───────┘         └────┬─────┘
     │                     │                      │
     │ createPayment()    │                      │
     ├────────────────────>│                      │
     │   (ETH locked)     │                      │
     │                     │                      │
     │                     │   Agent completes    │
     │                     │   Backend confirms   │
     │                     │                      │
     │                     │  confirmPayment()    │
     │                     ├─────────────────────>│
     │                     │   (ETH released)     │
     │                     │                      │
```

### Tech Stack

**Frontend:**
- Next.js 14
- React
- RainbowKit (wallet connection)
- Wagmi (Ethereum interactions)
- Viem (blockchain utilities)

**Backend:**
- Next.js API Routes
- Coinbase CDP SDK (user wallets)
- Supabase (database)
- Viem (smart contract interactions)

**Blockchain:**
- Solidity 0.8.20
- Base Sepolia Testnet
- Hardhat (development)

**Agent:**
- Express.js (mock API)
- Product price lookup

## 📚 Documentation

Comprehensive guides in `paymentSystem/`:

- **ESCROW_INTEGRATION_COMPLETE.md** - Full escrow overview
- **ESCROW_SETUP.md** - Detailed deployment guide
- **SUPABASE_JS_SETUP.md** - Database configuration
- **HARDHAT_README.md** - Smart contract development
- **CONFIGURATION.md** - General configuration
- **QUICKSTART.md** - Quick reference

## 🔑 Key Features

### 1. Smart Contract Escrow
- Trustless payment holding
- Automatic refunds
- On-chain verification

### 2. CDP User Wallets
- Persistent wallets per phone number
- Stored in Supabase
- Non-custodial via Coinbase CDP

### 3. Real ETH Payments
- Base Sepolia testnet
- Native ETH transfers
- Gas-optimized contract

### 4. Agent Integration
- RESTful API interface
- Price discovery
- Proof of completion

### 5. Full Web3 Stack
- Wallet connection (RainbowKit)
- Transaction signing
- On-chain confirmation

## 🛠️ Development

### Build for Production

```bash
cd paymentSystem
npm run build
npm start
```

### Run Tests

```bash
# Smart contract tests (requires Node 22+)
npx hardhat test

# Build test
npm run build
```

### Deploy to Vercel

```bash
vercel deploy
```

Add environment variables in Vercel dashboard.

## 🔐 Security

- ✅ Private keys in environment variables
- ✅ Smart contract holds funds, not backend
- ✅ Automatic timeout refunds
- ✅ On-chain transaction verification
- ✅ No custodial wallet risks

**Important:** Never commit `.env.local` to git!

## 📊 Environment Variables

See `paymentSystem/ESCROW_SETUP.md` for complete list and explanations.

## 🐛 Troubleshooting

### Common Issues:

**"ESCROW_CONTRACT_ADDRESS not configured"**
→ Deploy contract and add address to `.env.local`

**"Failed to create wallet"**
→ Check CDP API credentials

**"Transaction failed"**
→ Ensure backend wallet has Base Sepolia ETH

**Port 3000 already in use**
→ `lsof -ti:3000 | xargs kill -9`

See individual docs for detailed troubleshooting.

## 🎓 Learn More

- **x402 Protocol**: https://x402.gitbook.io/x402
- **Coinbase CDP**: https://portal.cdp.coinbase.com/
- **Base**: https://base.org/
- **Viem**: https://viem.sh/
- **RainbowKit**: https://rainbowkit.com/

## 📝 License

MIT

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve!

## 🎉 Acknowledgments

- x402 Protocol Team
- Coinbase CDP
- Base Network
- ETHGlobal Buenos Aires

---

**Built with ❤️ for ETHGlobal Buenos Aires**

🚀 **Ready to deploy? Check out `paymentSystem/ESCROW_INTEGRATION_COMPLETE.md`**
