# 💳 Top-Up Feature Testing Guide

## Overview
The top-up feature allows users to add ETH to their CDP wallet account by entering their phone number. The CDP wallet address becomes their account number.

## Architecture

### Flow
1. User enters phone number on `/topup-demo`
2. System fetches/creates CDP wallet via `/api/user/wallet`
3. User is redirected to `/top-up/[wallet_address]`
4. User connects their personal wallet and sends ETH to their CDP wallet

### Dynamic URL Structure
```
Base URL: http://localhost:3000
Entry Page: /topup-demo
Dynamic Route: /top-up/[cdp_wallet_address]

Example: /top-up/0x1234567890abcdef1234567890abcdef12345678
```

## Prerequisites

### 1. Environment Variables
Ensure these are set in `/paymentSystem/.env.local`:

```bash
# Coinbase CDP
CDP_API_KEY_NAME=your_cdp_key_name
CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Escrow Contract
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=your_escrow_address
```

### 2. Required Services
- ✅ Next.js app running (`npm run dev`)
- ✅ Supabase database setup and accessible
- ✅ CDP wallet service configured
- ✅ Escrow contract deployed on Base Sepolia

### 3. Required Browser Setup
- MetaMask or compatible wallet installed
- Connected to Base Sepolia testnet
- Some test ETH in your wallet

## Step-by-Step Testing

### Test 1: New User Flow (First Time)

1. **Start the Development Server**
   ```bash
   cd paymentSystem
   npm run dev
   ```

2. **Navigate to Top-Up Demo**
   - Open: `http://localhost:3000/topup-demo`
   - You should see a phone number input form

3. **Enter a Phone Number**
   - Enter any phone number (e.g., `+1234567890`)
   - Click "🚀 Go to Top-Up"
   - Watch the console logs

4. **Expected Result:**
   - Loading state shows "⏳ Loading Wallet..."
   - A new CDP wallet is created for this phone number
   - You're automatically redirected to `/top-up/0x...` (your new CDP wallet address)
   - Console should show: `✅ CDP Wallet found: 0x...`

5. **Verify the Top-Up Page**
   - Check that the CDP wallet address is displayed
   - Note: The account number IS the CDP wallet address
   - **Wallet Auto-Connect**: A popup should automatically appear asking to connect
   - You'll see a "🔗 Connecting Wallet..." message
   - Approve the connection in the popup

6. **Wallet Auto-Connected**
   - Your wallet should connect automatically (no need to click Connect button)
   - If auto-connect fails, you can manually click "Connect Wallet" button
   - Ensure you're on Base Sepolia network
   - Your connected wallet address will be shown in the Top-Up Information section

7. **Enter Top-Up Amount**
   - Enter an amount (e.g., `0.001` ETH)
   - Click "💸 Top-Up Now"

8. **Approve Transaction**
   - MetaMask popup should appear
   - Review the transaction details:
     - Sending to: Escrow Contract
     - Amount: Your entered amount
   - Approve the transaction

9. **Wait for Confirmation**
   - Status should change to "⏳ Processing"
   - Then "Confirming transaction on-chain..."
   - Finally "✅ Success" with transaction hash
   - Click "View on BaseScan" to verify

### Test 2: Existing User Flow (Returning User)

1. **Navigate to Top-Up Demo**
   - Open: `http://localhost:3000/topup-demo`

2. **Enter the SAME Phone Number**
   - Use the phone number from Test 1
   - Click "🚀 Go to Top-Up"

3. **Expected Result:**
   - System retrieves the EXISTING CDP wallet
   - You're redirected to the SAME `/top-up/0x...` address as before
   - No new wallet is created

4. **Proceed with Top-Up**
   - Follow steps 6-9 from Test 1

### Test 3: Direct URL Access

1. **Get a CDP Wallet Address**
   - From Test 1 or Test 2, copy the wallet address from the URL
   - Example: `0x1234567890abcdef1234567890abcdef12345678`

2. **Navigate Directly**
   - Open: `http://localhost:3000/top-up/0x1234567890abcdef1234567890abcdef12345678`
   - Replace with your actual CDP wallet address

3. **Expected Result:**
   - Page loads with the account information
   - You can top-up without going through `/topup-demo`

### Test 4: Multiple Users

1. **Test with Different Phone Numbers**
   - Use: `+1111111111`
   - Use: `+2222222222`
   - Use: `+3333333333`

2. **Verify Each Gets Unique Wallet**
   - Each phone number should get a different CDP wallet address
   - URLs should be different: `/top-up/0xAAA...`, `/top-up/0xBBB...`, etc.

## Verification Checklist

### Database Verification
Check your Supabase `user_wallets` table:

```sql
SELECT phone_number, wallet_address, created_at 
FROM user_wallets 
ORDER BY created_at DESC;
```

Expected columns:
- `phone_number`: The phone number entered
- `wallet_address`: The CDP wallet address (account number)
- `wallet_id`: CDP wallet ID
- `created_at`: Timestamp

### Blockchain Verification

1. **Check Escrow Contract**
   - Visit: `https://sepolia.basescan.org/address/[ESCROW_CONTRACT_ADDRESS]`
   - Look for recent transactions
   - Verify `createPayment` function calls

2. **Check CDP Wallet Balance**
   - Visit: `https://sepolia.basescan.org/address/[CDP_WALLET_ADDRESS]`
   - Should show the escrow contract interactions
   - Note: Funds are held in escrow, not directly in CDP wallet

## Common Issues & Solutions

### Issue 1: "Failed to get wallet"
**Solution:**
- Check CDP API credentials in `.env.local`
- Verify Supabase connection
- Check console for detailed error messages

### Issue 2: Wallet doesn't auto-connect
**Solution:**
- Check that you have a wallet extension installed (MetaMask, Coinbase Wallet, etc.)
- Look for the connection popup and approve it
- If popup is blocked, manually click "Connect Wallet" button
- Ensure your wallet is unlocked
- Switch to Base Sepolia network

### Issue 2b: "Please connect your wallet first"
**Solution:**
- If auto-connect failed, click "Connect Wallet" button manually
- Ensure MetaMask/Coinbase Wallet is installed
- Switch to Base Sepolia network

### Issue 3: "Transaction failed"
**Solution:**
- Check you have enough ETH for gas + amount
- Verify escrow contract address is correct
- Check you're on Base Sepolia network

### Issue 4: Wallet not redirecting
**Solution:**
- Check browser console for errors
- Verify `/api/user/wallet` endpoint is working
- Test endpoint directly: `POST http://localhost:3000/api/user/wallet`

## Testing the API Endpoint Directly

### Create/Get Wallet
```bash
curl -X POST http://localhost:3000/api/user/wallet \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

Expected response:
```json
{
  "wallet": {
    "address": "0x...",
    "walletId": "...",
    "isNewWallet": true
  }
}
```

## Production Considerations

When deploying to production, ensure:

1. **Secure Phone Number Validation**
   - Add phone number verification (SMS/OTP)
   - Implement rate limiting

2. **Account Security**
   - Add authentication layer
   - Implement session management

3. **Shareable Links**
   - Users can share: `https://yoursite.com/top-up/0x...`
   - Anyone can top-up any account by knowing the wallet address

4. **Escrow Management**
   - Funds are in escrow until released
   - Implement release/refund mechanisms

## Quick Test Script

Create a test file `test-topup.sh`:

```bash
#!/bin/bash

echo "Testing Top-Up Flow..."

# Test 1: Create wallet for new user
echo "\n1. Creating wallet for +1111111111..."
curl -s -X POST http://localhost:3000/api/user/wallet \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1111111111"}' | jq

# Test 2: Get wallet for existing user
echo "\n2. Getting wallet for +1111111111 again..."
curl -s -X POST http://localhost:3000/api/user/wallet \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1111111111"}' | jq

# Test 3: Create wallet for different user
echo "\n3. Creating wallet for +2222222222..."
curl -s -X POST http://localhost:3000/api/user/wallet \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2222222222"}' | jq

echo "\nDone! Check the wallet addresses are different."
```

Run it:
```bash
chmod +x test-topup.sh
./test-topup.sh
```

## Success Indicators

✅ Phone number → CDP wallet mapping works
✅ Same phone number returns same wallet
✅ Different phone numbers get different wallets
✅ URL structure is `/top-up/[wallet_address]`
✅ Wallet connection works
✅ ETH transactions go through
✅ BaseScan shows transactions
✅ Escrow contract records payments

## Next Steps

After successful testing, consider:
1. Add wallet balance display
2. Show transaction history
3. Implement release mechanism from escrow
4. Add email/SMS notifications
5. Create admin dashboard for escrow management

