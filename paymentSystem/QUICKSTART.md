# Quick Start Guide

Get your x402 payment system running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd paymentSystem
npm install
```

## Step 2: Get Coinbase CDP Credentials

1. Go to https://portal.cdp.coinbase.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **"Create API Key"**
5. Save the **API Key Name** and **API Key Private Key**

## Step 3: Create .env.local File

Create a file named `.env.local` in the `paymentSystem` directory:

```bash
# Coinbase CDP Credentials (from Step 2)
CDP_API_KEY_NAME=your-api-key-name-here
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
your-private-key-here
-----END EC PRIVATE KEY-----

# Your Agent API Endpoint
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute

# Optional - use defaults if not specified
AGENT_FEE_USDC=2.00
NETWORK_ID=base-sepolia
```

**That's it!** These are the only configurations you need.

## Step 4: Run the App

```bash
npm run dev
```

Open http://localhost:3000

## Step 5: Test It

1. Enter what you want to buy (e.g., "USB-C charger")
2. Enter a product price (e.g., "15.99")
3. Click "Request Agent Service"
4. You'll see a 402 response with payment details
5. Click "Simulate Payment"
6. Watch the magic:
   - ✅ Payment verified
   - ✅ Temporary Coinbase wallet created
   - ✅ Agent executes (calls your API or uses mock)
   - ✅ Results displayed with wallet info

## What Just Happened?

```
User Request
    ↓
402 Payment Required (Total = $2 fee + $15.99 product = $17.99)
    ↓
Payment Simulated
    ↓
Temporary Coinbase Wallet Created (address: 0x...)
    ↓
Agent API Called (or mock if not configured)
    ↓
Results Returned
```

## Next Steps

### Connect Your Real Agent

Replace the mock agent with your real purchasing agent:

1. Set `AGENT_API_ENDPOINT` in `.env.local` to your agent's URL
2. Your agent should accept POST requests with:
   ```json
   {
     "query": "user's purchase request",
     "productPrice": 15.99,
     "metadata": { "timestamp": "..." }
   }
   ```
3. Your agent should return:
   ```json
   {
     "status": "completed",
     "orderId": "...",
     "product": { ... },
     "proof": { ... }
   }
   ```

### Use Real x402 Payments

When you're ready for production:

1. Integrate real x402 facilitator (replace mock verification)
2. Connect real wallet to frontend (Coinbase Wallet, MetaMask, etc.)
3. Switch from `base-sepolia` to `base` network
4. Update `MERCHANT_WALLET_ADDRESS` to your production wallet

## Troubleshooting

### "Coinbase CDP credentials not configured"

Make sure `.env.local` has valid `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY`.

### "Agent API call failed"

If your `AGENT_API_ENDPOINT` is not reachable, the system falls back to mock responses. This is expected behavior during development.

### Wallet not created

Check the server console logs for detailed error messages. Ensure:
- CDP credentials are valid
- You have network connectivity
- Your CDP account has wallet creation permissions

## Documentation

- [ENV_SETUP.md](./ENV_SETUP.md) - Detailed environment configuration
- [COINBASE_SETUP.md](./COINBASE_SETUP.md) - Complete Coinbase CDP guide
- [README.md](./README.md) - Full documentation
- [x402 Docs](https://x402.gitbook.io/x402) - x402 protocol documentation

## Support

Questions? Check the docs or console logs for error details!

