# Environment Configuration

Create a `.env.local` file in the `paymentSystem` directory with the following variables:

## Required: Coinbase Developer Platform Credentials

Get these from: https://portal.cdp.coinbase.com/

```bash
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-api-key-private-key
```

## Required: Agent API Endpoint

```bash
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute
```

## Optional Configuration

```bash
# Agent service fee in USDC (default: 2.00)
AGENT_FEE_USDC=2.00

# Facilitator URL (default uses x402 facilitator)
FACILITATOR_URL=https://facilitator.x402.org

# Network for wallet creation (base-sepolia for testnet, base for mainnet)
NETWORK_ID=base-sepolia

# Agent API authentication (if needed)
AGENT_API_KEY=
```

## How to Get Coinbase CDP Credentials

1. Go to https://portal.cdp.coinbase.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy the API Key Name and Private Key
6. Paste them into your `.env.local` file

