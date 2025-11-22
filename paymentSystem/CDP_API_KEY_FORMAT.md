# Coinbase CDP API Key Configuration

## 🚨 CRITICAL: API Key Format Requirements

The 401 authentication error you're seeing is likely due to incorrect API key format. Here's what you need:

### 1. Create API Key with ECDSA Algorithm

When creating your CDP API key at https://portal.cdp.coinbase.com/:
- ✅ **SELECT: ECDSA** signature algorithm
- ❌ **DO NOT SELECT: Ed25519** (not supported by CDP SDK)

### 2. API Key Name Format

Your `CDP_API_KEY_NAME` should look like:
```
organizations/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/apiKeys/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Private Key Format

Your `CDP_API_KEY_SECRET` must be the **FULL PEM-formatted private key**, including headers and newlines:

```
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIE...
...your-private-key-content...
...multiple-lines...
-----END EC PRIVATE KEY-----
```

### 4. Correct .env.local Format

In your `/Users/shivamkumar/ethGlobalBA/paymentSystem/.env.local` file:

```bash
# API Key Name (one line)
CDP_API_KEY_NAME=organizations/your-org-id/apiKeys/your-key-id

# Private Key (multi-line, wrapped in quotes)
CDP_API_KEY_SECRET="-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIE...your-private-key-here...
-----END EC PRIVATE KEY-----"

# Other required variables
NETWORK_ID=base-sepolia
DATABASE_URL=postgresql://user:password@localhost:5432/x402_payments
AGENT_API_ENDPOINT=http://localhost:8000
MERCHANT_WALLET_ADDRESS=0xYourMerchantWalletAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### 5. Common Mistakes

❌ **Wrong**: Using only the key ID or part of the private key
❌ **Wrong**: Using Ed25519 algorithm key
❌ **Wrong**: Breaking the private key incorrectly or removing newlines
❌ **Wrong**: Not including the BEGIN/END headers

✅ **Correct**: Full PEM format with BEGIN/END headers and all newlines
✅ **Correct**: ECDSA algorithm key
✅ **Correct**: Full organizations/xxx/apiKeys/xxx format for key name

### 6. How to Fix

1. Go to https://portal.cdp.coinbase.com/
2. Create a NEW API key
3. **SELECT ECDSA** as the signature algorithm
4. Copy the FULL key name (should start with `organizations/`)
5. Copy the ENTIRE private key (including `-----BEGIN EC PRIVATE KEY-----` and `-----END EC PRIVATE KEY-----`)
6. Update your `.env.local` file with the correct format above
7. Restart your dev server: `npm run dev`

### 7. Test Your Configuration

After updating your `.env.local`, the logs should show:
```
✅ Coinbase SDK configured successfully
```

If you still see a 401 error, double-check:
- The API key algorithm is ECDSA (not Ed25519)
- The private key is complete with headers
- There are no extra spaces or missing newlines
- The key name includes the full `organizations/.../apiKeys/...` path

