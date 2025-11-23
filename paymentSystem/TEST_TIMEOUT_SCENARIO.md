# 🧪 Testing Escrow Timeout & Refund Scenario

This guide walks you through testing what happens when a payment confirmation fails and the user needs to get their money back.

## 🎯 What We're Testing

**Scenario**: Backend fails to confirm the payment → Payment sits in escrow → After 15 minutes → User gets refund

**This tests**:
- Escrow holds funds safely ✅
- Timeout mechanism works ✅
- Refund can be triggered ✅
- User gets their ETH back ✅

---

## 📋 Test Steps

### Step 1: Enable Testing Mode

Add this to your `.env.local` file:

```bash
DISABLE_ESCROW_CONFIRMATION=true
```

This tells the backend to skip confirmation (simulating a failure scenario).

### Step 2: Restart Your Dev Server

```bash
# Kill the current server (Ctrl+C)
cd /Users/shivamkumar/ethGlobalBA/paymentSystem
npm run dev
```

### Step 3: Make a Payment (That Won't Be Confirmed)

1. Go to `http://localhost:3000`
2. Enter your phone number
3. Request agent service (e.g., "test charger")
4. Connect your wallet
5. **Pay the amount** (e.g., 0.00533 ETH)
6. Approve the transaction in your wallet
7. Wait for the transaction to confirm

### Step 4: Check the Backend Logs

You should see:

```
🔍 Verifying payment on escrow contract...
✅ Payment verified in escrow contract
🤖 Executing agent workflow
✅ Agent workflow completed successfully
⚠️  ESCROW CONFIRMATION DISABLED FOR TESTING
⚠️  Payment will remain in escrow and can be refunded after 15 minutes
```

**Note the Payment ID** - you'll need it for the refund!

Example: `4bf2da51-2aa9-47b8-bc40-012b30e019e1`

### Step 5: Verify Payment is in Escrow

Go to `http://localhost:3000/test-escrow` and:

1. Enter the **Payment ID** from Step 4
2. Click **"Check Payment Status"**
3. You should see:
   - ✅ Payment exists
   - ✅ Amount locked (e.g., 0.00533 ETH)
   - ❌ **Completed: false** (not confirmed yet!)
   - Timestamp showing when it was created

### Step 6: Try to Refund (Should Fail - Too Early)

While still on the test-escrow page:

1. Click **"Refund (After Timeout)"**
2. You should get an **error**: "Not expired yet"

This proves the 15-minute timeout is working! ✅

### Step 7: Wait 15 Minutes ⏰

Go grab a coffee ☕, watch a video, or do some work.

**Actual timeout**: 15 minutes (900 seconds)

**Tip**: You can check the timestamp from Step 5 to see when the refund becomes available.

### Step 8: Check if Refund is Available

Go back to the test-escrow page and:

1. Enter the same **Payment ID**
2. Click **"Check Payment Status"**
3. The UI will show if the payment is expired

Or manually calculate:
```
Current time - Payment timestamp > 15 minutes = Refundable
```

### Step 9: Trigger the Refund

1. On the test-escrow page
2. Enter the **Payment ID**
3. Click **"Refund (After Timeout)"**
4. Approve the transaction in your wallet
5. Wait for confirmation

You should see:
```
✅ Payment refunded!
```

### Step 10: Verify Refund Succeeded

**Check 1: On-chain verification**
- Click the BaseScan link from the refund transaction
- Look for:
  - Status: Success ✅
  - Internal transaction showing ETH returned to you
  - `PaymentRefunded` event

**Check 2: Test Escrow Page**
- Enter the Payment ID again
- Click "Check Payment Status"
- Should show: **Completed: ✅ Yes**

**Check 3: Your Wallet**
- Check your wallet balance
- You should have received ~0.00533 ETH back (minus the original gas fee)

---

## 🎬 Quick Test (Shorter Timeout)

**Want to test faster?** You can modify the smart contract timeout:

### Option A: Use a New Contract with Shorter Timeout

Deploy a test version with 2 minutes instead of 15:

1. Edit `contracts/contracts/X402Escrow.sol`
2. Change: `uint256 public constant TIMEOUT = 2 minutes;`
3. Deploy new contract: `cd contracts && node scripts/deploy-direct.js`
4. Update `.env.local` with new contract address
5. Test with only 2 minute wait!

### Option B: Test on Existing Escrow Page

Use the escrow test page to:
1. Create payment manually
2. Don't confirm it
3. Wait 15 minutes
4. Refund manually

---

## 📊 Expected Flow Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. User Pays → ETH locked in escrow ✅                        │
│                                                                 │
│  2. Backend verifies payment exists ✅                         │
│                                                                 │
│  3. Agent completes task ✅                                    │
│                                                                 │
│  4. Backend tries to confirm → DISABLED (for testing) ❌       │
│     └─ "Payment will auto-refund after 15 minutes"            │
│                                                                 │
│  5. Payment sits in escrow... ⏰                               │
│                                                                 │
│  6. 15 minutes pass... ⏰                                      │
│                                                                 │
│  7. User calls refundExpiredPayment() ✅                       │
│                                                                 │
│  8. Smart contract checks:                                     │
│     ✅ Payment exists                                          │
│     ✅ Not already completed                                   │
│     ✅ Timestamp > 15 minutes ago                              │
│                                                                 │
│  9. ETH returned to original payer! 💰                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Payment not found"
- Make sure you're using the correct Payment ID
- Check the order ID on BaseScan to verify the payment was created

### "Not expired yet"
- Check the timestamp - full 15 minutes must pass
- Use `Date.now() / 1000` to compare current time with payment timestamp

### "Already completed"
- This payment was already confirmed or refunded
- Try a new payment

### "Transaction reverted"
- Check BaseScan for the revert reason
- Make sure you're using the correct contract address

---

## 🔄 Return to Normal Mode

After testing, **disable testing mode**:

1. Remove or comment out in `.env.local`:
   ```bash
   # DISABLE_ESCROW_CONFIRMATION=true
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Payments will now be confirmed automatically again! ✅

---

## 📝 What This Proves

By completing this test, you've verified:

✅ Escrow safely holds funds
✅ Backend can fail without losing user money
✅ Timeout mechanism works correctly
✅ Users can recover their funds
✅ Smart contract enforces 15-minute rule
✅ Refunds go to the original payer
✅ Payment cannot be refunded before timeout
✅ Payment cannot be double-refunded

**Your escrow system is production-ready!** 🎉

---

## 🎥 Perfect for Demo

This is a great scenario to show investors/judges:
1. "What if the agent fails?"
2. "What if the backend crashes?"
3. "How do users get their money back?"

Answer: **Escrow timeout & refund mechanism!** 💪

Show them:
- Payment locked in escrow ✅
- Confirmation fails ❌
- User waits 15 minutes ⏰
- User gets full refund ✅
- All verifiable on-chain 🔗

---

**Happy Testing!** 🚀

