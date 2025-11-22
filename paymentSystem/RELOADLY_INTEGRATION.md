# 🎁 Reloadly Gift Card Integration

The x402 payment system now automatically converts ETH payments into Visa gift cards via Reloadly's API!

## How It Works

```
User pays with ETH → System receives payment → Converts ETH to USD → Orders Visa gift card → Card sent to user's email
```

## Features

✅ **Automatic Cashout**: Every successful payment triggers a gift card order
✅ **ETH to USD Conversion**: Real-time conversion using configurable ETH price
✅ **Visa Gift Cards**: Universal spending power (works like debit cards)
✅ **Email Delivery**: Instant delivery to user's email address
✅ **Sandbox Testing**: Test with Reloadly sandbox before going live

## Setup Instructions

### 1. Get Reloadly API Credentials

1. Sign up at https://www.reloadly.com/
2. Go to your dashboard
3. Navigate to **API Settings**
4. Get your:
   - Client ID
   - Client Secret

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Reloadly Gift Card API
RELOADLY_CLIENT_ID=your_client_id_here
RELOADLY_CLIENT_SECRET=your_client_secret_here
RELOADLY_SANDBOX=true
ETH_PRICE_USD=3000
```

**Important Notes:**
- `RELOADLY_SANDBOX=true` uses sandbox API (test mode, no real money)
- `RELOADLY_SANDBOX=false` uses production API (real gift cards)
- `ETH_PRICE_USD` is used to convert ETH amounts to USD

### 3. Test in Sandbox Mode

In sandbox mode:
- No real money is charged
- Gift cards are simulated
- Use test credentials from Reloadly dashboard
- Perfect for development and testing

### 4. Go to Production

When ready for production:
1. Get production API credentials from Reloadly
2. Update `.env.local`:
   ```bash
   RELOADLY_SANDBOX=false
   RELOADLY_CLIENT_ID=prod_client_id
   RELOADLY_CLIENT_SECRET=prod_client_secret
   ```
3. Ensure you have credits in your Reloadly account
4. Test with a small transaction first

## User Flow

### 1. User Setup
```
User enters phone number + email → System creates CDP wallet
```

### 2. Make Purchase
```
User searches for product → Sees ETH price → Pays with ETH
```

### 3. Automatic Gift Card Delivery
```
Payment confirmed → ETH converted to USD → Visa gift card ordered → Sent to email
```

## Example Transaction

**User wants to buy a USB-C Charger:**

1. **Product Price**: $12.99 → 0.00433 ETH
2. **Agent Fee**: 0.001 ETH
3. **Total**: 0.00533 ETH (~$16)
4. **User pays**: 0.00533 ETH
5. **System converts**: $16 USD
6. **Gift card ordered**: $16 Visa gift card
7. **Delivered to**: user@email.com

## Technical Details

### ETH to USD Conversion

```typescript
// Configurable conversion rate
const ETH_PRICE_USD = parseFloat(process.env.ETH_PRICE_USD || '3000');
const usdAmount = ethAmount * ETH_PRICE_USD;
```

### Gift Card Selection

The system automatically:
1. Fetches available gift cards in US
2. Looks for Visa gift cards with variable amounts
3. Falls back to prepaid cards if Visa not available

### Minimum Amount

- Reloadly gift cards typically have a **$5 minimum**
- If payment is less than $5 USD equivalent, gift card order is skipped
- User still gets the product, just no gift card cashout

## API Endpoints

### Get Available Gift Cards

```bash
curl -X GET \
  https://giftcards-sandbox.reloadly.com/countries/US/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Order a Gift Card

```bash
curl -X POST \
  https://giftcards-sandbox.reloadly.com/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 123,
    "countryCode": "US",
    "quantity": 1,
    "unitPrice": 50,
    "senderName": "x402 Payment System",
    "recipientEmail": "user@example.com"
  }'
```

## Files Added/Modified

### New Files:
- `paymentSystem/lib/reloadly.ts` - Reloadly API service

### Modified Files:
- `paymentSystem/app/api/agent/purchase/route.ts` - Added gift card processing
- `paymentSystem/app/page.tsx` - Added email input and gift card display
- `paymentSystem/.env.local` - Added Reloadly credentials

## Testing

### 1. Start Services
```bash
# Terminal 1 - Dummy Agent
cd dummyAgent && npm start

# Terminal 2 - Payment System
cd paymentSystem && npm run dev
```

### 2. Make a Test Purchase
1. Go to http://localhost:3000
2. Enter phone: `+1234567890`
3. Enter email: `test@example.com`
4. Search: "USB-C Charger"
5. Connect wallet (with Base Sepolia ETH)
6. Pay with ETH
7. Check console for gift card order logs

### 3. Verify Gift Card
Check the server logs for:
```
🎁 Ordering gift card: { productId: ..., amount: 16, ... }
✅ Gift card ordered successfully: 12345
✅ Gift card delivered: { transactionId: ..., recipientEmail: ... }
```

## Troubleshooting

### "Failed to get Reloadly access token"
- Check your `RELOADLY_CLIENT_ID` and `RELOADLY_CLIENT_SECRET`
- Ensure they're from the correct environment (sandbox/production)
- Verify no extra spaces or quotes in `.env.local`

### "Amount too small for gift card"
- Gift cards have minimum values (usually $5)
- Increase your ETH_PRICE_USD or test with higher-value products

### "Failed to order gift card"
- Check Reloadly dashboard for account status
- Ensure you have sufficient credits (production only)
- Verify the product ID is valid for your country

### Gift card not appearing in email
- In sandbox mode, emails may not be sent
- Check Reloadly dashboard → Transactions to see order details
- In production, emails are sent immediately

## Production Considerations

### 1. ETH Price Oracle
Instead of static `ETH_PRICE_USD`, integrate a price oracle:
- Chainlink Price Feeds
- Uniswap TWAP
- CoinGecko API

### 2. Exchange Integration
Currently assumes ETH is already converted to USD. For production:
- Integrate with Coinbase Commerce for instant ETH → USD conversion
- Or use a DEX to swap ETH → USDC first
- Or hold ETH and batch convert periodically

### 3. Error Handling
- Retry failed gift card orders
- Store orders in database
- Email notifications for failures
- Customer support flow for issues

### 4. Compliance
- KYC/AML requirements for crypto → fiat
- Gift card regulations by jurisdiction
- Transaction limits and reporting

## Costs

### Reloadly Fees
- Variable based on gift card type and amount
- Check pricing at: https://www.reloadly.com/pricing
- Sandbox is free for testing

### Your Margins
Consider:
- ETH gas fees
- Reloadly service fees
- Your agent service fee
- Profit margin

## Support

- **Reloadly Docs**: https://docs.reloadly.com/
- **Reloadly Support**: support@reloadly.com
- **API Status**: https://status.reloadly.com/

## Next Steps

- [ ] Test in sandbox mode
- [ ] Configure production credentials
- [ ] Add price oracle integration
- [ ] Implement ETH → USD exchange
- [ ] Add error handling and retries
- [ ] Store gift card transactions in database
- [ ] Add customer support flow

---

**Ready to convert crypto to cash!** 🎉💳


