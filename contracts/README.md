# X402 Escrow Smart Contract

Solidity smart contract for secure, trustless x402 payments with automatic refunds.

## 📁 Structure

```
contracts/
├── contracts/
│   └── X402Escrow.sol          ← Smart contract
├── scripts/
│   ├── deploy.js               ← Hardhat deployment (broken, use deploy-direct)
│   └── deploy-direct.js        ← Direct ethers deployment ✅
├── test/
│   └── X402Escrow.test.js      ← Contract tests
├── hardhat.config.js           ← Hardhat configuration
└── package.json                ← Dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Compile Contract

```bash
npx hardhat compile
```

### 3. Deploy to Base Sepolia

Make sure `../paymentSystem/.env.local` has:
```bash
MERCHANT_WALLET_ADDRESS=0xYourMerchantWallet
DEPLOYER_PRIVATE_KEY=your_private_key
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

Then deploy:
```bash
node scripts/deploy-direct.js
```

## 📄 Contract Details

### X402Escrow.sol

**Purpose:** Holds user payments in escrow until agent completes task or timeout occurs.

**Key Functions:**
- `createPayment(bytes32 orderId)` payable - User locks ETH
- `confirmPayment(bytes32 orderId)` - Release funds to merchant
- `refundExpiredPayment(bytes32 orderId)` - Refund after 15 min timeout

**Events:**
- `PaymentCreated(orderId, payer, amount)`
- `PaymentConfirmed(orderId, confirmer)`
- `PaymentRefunded(orderId)`

**Constants:**
- `TIMEOUT = 15 minutes` (900 seconds)

## 🧪 Testing

```bash
npx hardhat test
```

## 🔧 Development

### Compile
```bash
npx hardhat compile
```

### Clean
```bash
npx hardhat clean
```

### Deploy Locally
```bash
npx hardhat node  # Terminal 1
node scripts/deploy-direct.js --network localhost  # Terminal 2
```

## 📝 Notes

- Uses Hardhat 3.x with ESM modules
- Requires Node.js 22.12+ (LTS)
- Reads .env.local from `../paymentSystem/` directory
- Artifacts generated in `./artifacts/`

## 🌐 Networks

- **Base Sepolia** (Testnet) - chainId: 84532
- **Hardhat** (Local) - chainId: 31337
- **Localhost** - http://127.0.0.1:8545

## 🔗 Links

- **Deployed Contract:** 0x1D7AAADBb1430616CDBf5D76f9bB3Dc86A0569fB
- **BaseScan:** https://sepolia.basescan.org/address/0x1D7AAADBb1430616CDBf5D76f9bB3Dc86A0569fB
- **Base Faucet:** https://www.alchemy.com/faucets/base-sepolia

