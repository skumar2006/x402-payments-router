# Coinbase Developer Platform Setup

This guide explains how to set up Coinbase CDP to enable automatic wallet creation for receiving x402 payments.

## Overview

When a payment is received via x402, the system automatically creates a temporary Coinbase wallet to receive the funds. This provides:

- ✅ **Automatic fund management** - Each payment gets its own wallet
- ✅ **Auditability** - Clear tracking of which wallet received which payment
- ✅ **Flexibility** - Can transfer funds to main wallet or keep separate
- ✅ **Security** - Isolated wallets reduce risk

## Setup Steps

### 1. Create Coinbase Developer Account

1. Go to https://portal.cdp.coinbase.com/
2. Sign up or log in with your Coinbase account
3. Complete any required verification

### 2. Generate API Credentials

1. Navigate to the **API Keys** section in the CDP portal
2. Click **"Create API Key"**
3. Give it a name (e.g., "x402 Payment System")
4. Copy the following credentials:
   - **API Key Name**
   - **API Key Private Key** (shown only once - save it securely!)

### 3. Configure Environment Variables

Create a `.env.local` file in the `paymentSystem` directory:

```bash
# Coinbase CDP Credentials
CDP_API_KEY_NAME=your-api-key-name-here
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
your-private-key-here
-----END EC PRIVATE KEY-----

# Network (use base-sepolia for testing, base for production)
NETWORK_ID=base-sepolia

# Other required config
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute
AGENT_FEE_USDC=2.00
```

**Important:** Keep your private key secure! Never commit it to git.

### 4. Install Dependencies

```bash
npm install
```

The `@coinbase/coinbase-sdk` package is already included in `package.json`.

### 5. Test the Integration

Start the development server:

```bash
npm run dev
```

Test a payment:
1. Go to http://localhost:3000
2. Enter a product query and price
3. Click "Request Agent Service"
4. Click "Simulate Payment"
5. Check the console logs - you should see wallet creation messages

## How It Works

### Payment Flow with Wallet Creation

```
1. User requests purchase
   ↓
2. System returns 402 Payment Required
   ↓
3. User pays (simulated in demo)
   ↓
4. Payment verified
   ↓
5. 🆕 Temporary Coinbase wallet created
   ↓
6. Wallet address logged and stored
   ↓
7. Agent executes purchase
   ↓
8. Result returned (includes wallet info)
```

### Code Example

The wallet creation happens automatically in the payment route:

```typescript
// After payment verification
const wallet = await createTemporaryWallet(paymentId);

// Returns:
{
  walletId: "abc123...",
  address: "0x1234...",
  network: "base-sepolia",
  createdAt: "2024-..."
}
```

## API Endpoints

### Check Wallet Balance

```bash
GET /api/wallet/balance?walletId=YOUR_WALLET_ID
```

Returns the balance of a temporary wallet.

### Response Format

When a payment is completed, the response includes wallet information:

```json
{
  "success": true,
  "paymentId": "uuid",
  "amount": "17.99",
  "wallet": {
    "address": "0x1234...",
    "network": "base-sepolia",
    "walletId": "abc123..."
  },
  "result": { ... }
}
```

## Network Configuration

### Testnet (Recommended for Development)

```bash
NETWORK_ID=base-sepolia
```

- Free test USDC available from faucets
- No real funds at risk
- Same functionality as mainnet

### Mainnet (Production)

```bash
NETWORK_ID=base
```

- Real USDC required
- Use only after thorough testing
- Ensure proper security measures

## Security Best Practices

### ✅ DO:
- Store CDP credentials in `.env.local` (gitignored)
- Use environment variables for all sensitive data
- Test thoroughly on testnet before mainnet
- Implement proper error handling
- Log wallet creation for audit trail

### ❌ DON'T:
- Commit `.env.local` to version control
- Share your private key
- Use mainnet for development
- Skip error handling for wallet creation

## Troubleshooting

### "Coinbase CDP credentials not configured"

**Solution:** Add `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY` to your `.env.local` file.

### "Failed to create temporary wallet"

**Possible causes:**
1. Invalid API credentials
2. Network connectivity issues
3. Insufficient CDP account permissions

**Solution:** Check your credentials and ensure your CDP account has wallet creation permissions.

### "Wallet created but no balance"

This is expected! The temporary wallet is created **to receive** funds, not with funds already in it. The wallet address is where the x402 payment should be sent.

## Advanced Usage

### Consolidating Funds

You can transfer funds from temporary wallets to a main wallet:

```typescript
import { transferFromWallet } from '@/lib/coinbaseWallet';

await transferFromWallet(
  walletId,
  mainWalletAddress,
  amount,
  'usdc'
);
```

### Exporting Wallet Data

For backup or migration:

```typescript
import { exportWalletData } from '@/lib/coinbaseWallet';

const walletData = await exportWalletData(walletId);
// Store securely!
```

## Resources

- [Coinbase CDP Documentation](https://docs.cdp.coinbase.com/)
- [CDP SDK GitHub](https://github.com/coinbase/coinbase-sdk-nodejs)
- [Base Network Documentation](https://docs.base.org/)
- [x402 Protocol Documentation](https://x402.gitbook.io/x402)

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your CDP credentials
3. Ensure you're using the correct network ID
4. Review the Coinbase CDP documentation
5. Check that your CDP account has necessary permissions

