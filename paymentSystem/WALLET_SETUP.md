# Wallet Setup for Base Sepolia Testing

Complete guide to test real USDC payments on Base Sepolia testnet.

## Prerequisites

- Browser wallet extension (Coinbase Wallet, MetaMask, or Rainbow)
- A wallet address on Base Sepolia network

## Step 1: Install a Wallet

Choose one:

### Option A: Coinbase Wallet (Recommended)
1. Install [Coinbase Wallet Extension](https://www.coinbase.com/wallet/downloads)
2. Create or import a wallet
3. Done!

### Option B: MetaMask
1. Install [MetaMask Extension](https://metamask.io/download/)
2. Create or import a wallet
3. Add Base Sepolia network (see below)

### Option C: Rainbow Wallet
1. Install [Rainbow](https://rainbow.me/)
2. Create wallet
3. Done!

## Step 2: Add Base Sepolia Network (MetaMask Only)

If using MetaMask, add Base Sepolia network:

**Network Details:**
- Network Name: `Base Sepolia`
- RPC URL: `https://sepolia.base.org`
- Chain ID: `84532`
- Currency Symbol: `ETH`
- Block Explorer: `https://sepolia.basescan.org`

Or visit https://chainlist.org/ and search for "Base Sepolia" to add automatically.

## Step 3: Get Test ETH

You need ETH for gas fees.

### Get Sepolia ETH:
1. Go to https://sepoliafaucet.com/
2. Enter your wallet address
3. Get test ETH

### Bridge to Base Sepolia:
1. Go to https://bridge.base.org/
2. Switch to Sepolia testnet
3. Bridge ETH from Sepolia → Base Sepolia
4. Wait ~1 minute for confirmation

**Or use Base Sepolia Faucet directly:**
- https://www.coinbase.com/faucets/base-sepolia-faucet

## Step 4: Get Test USDC

You need USDC to make payments.

### Option A: Circle Faucet (Recommended)
1. Go to https://faucet.circle.com/
2. Select "Base Sepolia"
3. Enter your wallet address
4. Get 10 test USDC

### Option B: Uniswap (if you have Sepolia ETH)
1. Go to Uniswap on Base Sepolia
2. Swap some test ETH for USDC

## Step 5: Configure Payment System

Update `paymentSystem/.env.local`:

```bash
# Your wallet address (where you want to receive USDC payments)
MERCHANT_WALLET_ADDRESS=0xYourWalletAddressHere

# Agent endpoint
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute

# Other settings
AGENT_FEE_USDC=2.00
NETWORK_ID=base-sepolia
```

**Important:** Set `MERCHANT_WALLET_ADDRESS` to YOUR wallet address where you want to receive the USDC payments!

## Step 6: Get WalletConnect Project ID

For the wallet connection to work:

1. Go to https://cloud.walletconnect.com/
2. Sign up / log in
3. Create a new project
4. Copy the Project ID
5. Add to `paymentSystem/.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

## Step 7: Test It!

### Start the services:

```bash
# Terminal 1: Dummy Agent
cd dummyAgent
npm start

# Terminal 2: Payment System
cd paymentSystem
npm install  # Install new wallet dependencies
npm run dev
```

### Test the flow:

1. Go to http://localhost:3000
2. Click **"Connect Wallet"** in the top right
3. Connect your wallet (Coinbase Wallet, MetaMask, etc.)
4. Switch to **Base Sepolia** network when prompted
5. Enter a product query (e.g., "USB-C charger")
6. Click "Request Agent Service"
7. See the 402 response with price
8. Click **"Pay with USDC"**
9. Approve the transaction in your wallet popup
10. Wait for confirmation
11. See the results!

## Troubleshooting

### "Wallet not connecting"
- Make sure you're on Base Sepolia network
- Try refreshing the page
- Clear browser cache and reconnect

### "Insufficient funds"
- Get more test ETH from faucet (for gas)
- Get test USDC from Circle faucet

### "Transaction failed"
- Check you have enough ETH for gas (~$0.01)
- Check you have enough USDC for payment
- Try increasing gas limit

### "Wrong network"
- Switch to Base Sepolia in your wallet
- Network ID should be 84532

## Check Your Balance

View your wallet on Base Sepolia block explorer:
```
https://sepolia.basescan.org/address/YOUR_ADDRESS
```

You should see:
- ✅ ETH balance (for gas)
- ✅ USDC balance (for payments)

## Test USDC Contract

Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

View it: https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e

## Resources

- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
- [Circle USDC Faucet](https://faucet.circle.com/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Base Bridge](https://bridge.base.org/)
- [WalletConnect](https://cloud.walletconnect.com/)

## You're Ready! 🎉

Once you have:
- ✅ Wallet installed and connected
- ✅ Base Sepolia network added
- ✅ Test ETH (for gas)
- ✅ Test USDC (for payments)
- ✅ WalletConnect Project ID configured

You can make real on-chain USDC payments through the x402 system!

