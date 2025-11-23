# 🧪 Testing Timeout/Refund Scenario

This guide shows how to test the escrow timeout mechanism where payments are automatically refundable after 15 minutes if not confirmed.

## 🎯 Test Scenarios

### Scenario 1: Simulate Backend Confirmation Failure

**Method**: Temporarily break the backend confirmation to see what happens when it fails.

**Steps**:
1. Backend tries to confirm but fails (we'll simulate this)
2. Payment remains in escrow for 15 minutes
3. After 15 minutes, anyone can call `refundExpiredPayment`
4. ETH is returned to the original payer

### Scenario 2: Test with Agent Failure

**Method**: Make the agent return a failed status so confirmation is never attempted.

**Steps**:
1. Modify dummy agent to return `status: 'failed'`
2. Backend skips confirmation (only confirms on success)
3. Payment sits in escrow
4. After 15 minutes, user can get refund

## 🔧 How to Test

### Quick Test (Modify Agent Response)

We'll make the agent return a failure so the backend doesn't confirm.

### Full Test (Disable Confirmation)

We'll temporarily disable the confirmation function to simulate a backend error.

## ⏱️ Timing

- Escrow timeout: **15 minutes** (900 seconds)
- After timeout expires, payment becomes refundable
- Anyone can call `refundExpiredPayment` on the contract
- Use the test escrow page to trigger the refund

## 📊 What You'll See

**Successful Failure Test**:
```
✅ Payment verified in escrow
🤖 Agent workflow failed (or completed but confirmation disabled)
❌ Failed to confirm on-chain: [error message]
⚠️  Payment will auto-refund after 15 minutes if not confirmed
```

Then after 15 minutes:
```
User calls refundExpiredPayment()
✅ ETH returned to original payer
✅ Payment marked as completed
```

## 🎬 Testing Instructions

See below for step-by-step instructions on testing the timeout scenario.

