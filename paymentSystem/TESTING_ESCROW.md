# 🧪 Testing the Escrow Contract

This guide explains how to test the X402 escrow contract using the dedicated testing page.

## 📍 Access the Testing Page

Navigate to `http://localhost:3000/test-escrow` in your browser.

## 🎯 What You Can Test

The testing page allows you to manually interact with all three core functions of the escrow contract:

### 1. **Create Payment** (Lock ETH in Escrow)
- Enter a unique order ID (or generate a random one)
- Specify the amount of ETH to lock
- Click "Create Payment (Lock ETH)"
- Approve the transaction in your wallet
- ETH is now locked in the escrow contract

### 2. **Confirm Payment** (Release to Merchant)
- Enter the order ID of an existing payment
- Click "Confirm Payment"
- Approve the transaction in your wallet
- ETH is released to the merchant wallet (specified in `.env.local`)

### 3. **Refund Expired Payment** (Return to Payer)
- Wait 15 minutes after creating a payment
- Enter the order ID
- Click "Refund (After Timeout)"
- Approve the transaction in your wallet
- ETH is returned to the original payer

## 📊 Monitoring Payment Status

Click "Check Payment Status" to see:
- **Payer Address**: Who sent the ETH
- **Amount**: How much ETH is locked
- **Timestamp**: When the payment was created
- **Completed**: Whether it's been confirmed or refunded

## 🔍 Viewing Transactions

Every successful transaction includes a BaseScan link so you can:
- See the transaction details on-chain
- Verify the contract interactions
- Check gas fees and timestamps

## 🧭 Testing Workflow

### Full Happy Path Test:
```bash
1. Create Payment
   - Order ID: test-123
   - Amount: 0.01 ETH
   - ✅ Transaction confirmed

2. Check Payment Status
   - See payment is active and not completed
   - Note the timestamp

3. Confirm Payment
   - Enter same order ID: test-123
   - ✅ Transaction confirmed
   - ETH sent to merchant wallet

4. Check Payment Status Again
   - See payment is now marked as completed
```

### Timeout/Refund Test:
```bash
1. Create Payment
   - Order ID: test-refund-456
   - Amount: 0.005 ETH
   - ✅ Transaction confirmed

2. Wait 15 Minutes
   - Go grab a coffee ☕
   - Come back after timeout expires

3. Refund Payment
   - Enter order ID: test-refund-456
   - ✅ Transaction confirmed
   - ETH returned to your wallet

4. Check Payment Status
   - See payment is marked as completed
```

## ⚠️ Important Notes

### Wallet Requirements
- You need Base Sepolia ETH in your wallet to test
- Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### Testing vs Production
- This testing page lets **anyone** confirm payments (for testing purposes only)
- In production, **only your backend** should call `confirmPayment`
- The backend uses `BACKEND_PRIVATE_KEY` to confirm after agent completes the workflow

### Gas Fees
- Each transaction costs a small amount of gas (typically < 0.0001 ETH on testnet)
- Make sure you have enough ETH for both the payment amount and gas fees

## 🎬 Video Recording Tips

If you want to record a demo:
1. Connect your wallet (shows your address)
2. Generate a random order ID (shows uniqueness)
3. Create payment (shows wallet approval and transaction)
4. Check status immediately (shows active payment)
5. Confirm payment (shows release to merchant)
6. Check status again (shows completed state)
7. View transaction on BaseScan (shows on-chain proof)

## 🐛 Troubleshooting

### "Payment not found"
- Check that you're using the correct order ID
- Make sure the payment was successfully created (check BaseScan)

### "Already completed"
- This payment has already been confirmed or refunded
- Create a new payment with a different order ID

### "Not expired yet"
- You can only refund after 15 minutes
- Check the timestamp in the payment details
- Wait until the timeout period has passed

### "Must send ETH"
- Make sure you entered an amount > 0
- Check that your wallet has enough balance

## 🔗 Related Files

- **Smart Contract**: `/contracts/contracts/X402Escrow.sol`
- **Testing Page**: `/paymentSystem/app/test-escrow/page.tsx`
- **Escrow ABI**: `/paymentSystem/lib/escrowABI.ts`
- **Contract Config**: `/paymentSystem/.env.local` (see `ESCROW_CONTRACT_ADDRESS`)

## 📚 Next Steps

After testing the escrow manually:
1. Go back to the main app (`/`)
2. Test the full x402 payment flow end-to-end
3. Watch how the backend automatically confirms payments
4. See the escrow working in a real use case!

---

**Happy Testing! 🚀**

