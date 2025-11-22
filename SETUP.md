# Complete Setup Guide

Get the entire x402 system running in minutes!

## Overview

This project has two main components:

1. **Dummy Agent** - Returns product prices (port 8000)
2. **Payment System** - Handles x402 payments + Coinbase wallets (port 3000)

## Quick Setup

### Step 1: Start the Dummy Agent

```bash
# Terminal 1
cd dummyAgent
npm install
npm start
```

You should see:
```
🚀 Dummy Agent API running on port 8000
📊 Health check: http://localhost:8000/health
```

### Step 2: Configure Payment System

Create `paymentSystem/.env.local`:

```bash
# Required: Point to your agent
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute

# Optional: Coinbase CDP (for wallet creation)
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key

# Optional: Other settings
AGENT_FEE_USDC=2.00
NETWORK_ID=base-sepolia
```

**Minimum config to test:** Just the `AGENT_API_ENDPOINT` line!

### Step 3: Start Payment System

```bash
# Terminal 2
cd paymentSystem
npm install
npm run dev
```

You should see:
```
✓ Ready on http://localhost:3000
```

### Step 4: Test It!

1. Open http://localhost:3000
2. Type: "USB-C charger"
3. Click "Request Agent Service"
4. Watch the magic:
   - ✅ Agent returns: $12.99
   - ✅ System adds agent fee: $2.00
   - ✅ Total payment: $14.99
5. Click "Simulate Payment"
6. See the results!

## How It Works

```
User: "I want a USB-C charger"
    ↓
Payment System asks Agent: "What's the price?"
    ↓
Agent: "$12.99"
    ↓
Payment System: "$12.99 + $2.00 fee = $14.99 total"
    ↓
User pays $14.99 (simulated)
    ↓
Coinbase wallet created (if configured)
    ↓
Agent executes purchase
    ↓
Done!
```

## Testing Different Products

The dummy agent knows these products:

- "USB-C charger" → $12.99
- "headphones" → $279.99
- "airpods" → $249.00
- "mouse" → $99.99
- "laptop" → $1,199.00
- And more... see `dummyAgent/README.md`

Try different queries and see the prices change!

## Optional: Add Coinbase Wallet Creation

To create real temporary wallets:

1. Get credentials from https://portal.cdp.coinbase.com/
2. Add to `paymentSystem/.env.local`:
   ```bash
   CDP_API_KEY_NAME=your-api-key-name
   CDP_API_KEY_PRIVATE_KEY=your-private-key
   ```
3. Restart payment system
4. Wallets will be created automatically on each payment!

See `paymentSystem/COINBASE_SETUP.md` for detailed instructions.

## Troubleshooting

### "Agent API call failed"

**Problem:** Payment system can't reach the agent.

**Solution:** Make sure dummy agent is running on port 8000.

```bash
# Check if agent is running
curl http://localhost:8000/health
```

### "Could not determine product price"

**Problem:** Agent couldn't find the product.

**Solution:** Try a simpler query like "charger" or "headphones". Or add your product to `dummyAgent/server.js`.

### "Coinbase CDP credentials not configured"

**Problem:** Wallet creation disabled (this is OK for testing!).

**Solution:** Either:
- Ignore it - everything works without wallets
- Or add CDP credentials to enable wallet creation

## Next Steps

### Replace Dummy Agent

Replace the dummy agent with your real purchasing agent:

1. Build your agent with the same API format
2. Update `AGENT_API_ENDPOINT` in `.env.local`
3. Done!

Your agent should:
- Accept: `POST /agent/execute` with `{"query": "..."}`
- Return: `{"product": {"price": 12.99, ...}}`

### Add Real x402 Payments

1. Integrate real x402 facilitator
2. Connect real wallet to frontend
3. Use real USDC on Base network
4. Deploy to production!

## File Structure

```
ethGlobalBA/
├── dummyAgent/
│   └── server.js         ← Returns product prices
├── paymentSystem/
│   ├── app/api/agent/purchase/route.ts  ← x402 payment logic
│   └── lib/coinbaseWallet.ts            ← Wallet creation
└── SETUP.md              ← This file
```

## Documentation

- **[SETUP.md](./SETUP.md)** (this file) - Quick start
- **[dummyAgent/README.md](./dummyAgent/README.md)** - Agent API docs
- **[paymentSystem/README.md](./paymentSystem/README.md)** - Payment system docs
- **[paymentSystem/QUICKSTART.md](./paymentSystem/QUICKSTART.md)** - 5-minute payment system setup
- **[paymentSystem/COINBASE_SETUP.md](./paymentSystem/COINBASE_SETUP.md)** - Coinbase wallet guide

## You're All Set! 🎉

You now have a working x402 payment system with automatic price lookup!

Just run both services and open http://localhost:3000 to test it out.

