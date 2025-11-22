# Payment System Configuration Guide

This payment system is designed to be **API-agnostic** - you just need to provide an endpoint for your purchasing agent API.

## 🚀 Quick Setup

### 1. Copy the Example Environment File

```bash
cp env.example .env.local
```

### 2. Configure Your Agent API Endpoint

Edit `.env.local`:

```bash
# Your purchasing agent API endpoint
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute

# Agent service fee in USDC (optional, defaults to 2.00)
AGENT_FEE_USDC=2.00

# Your wallet address for receiving payments
MERCHANT_WALLET_ADDRESS=0xYourWalletAddress

# Facilitator URL (optional, defaults to official facilitator)
FACILITATOR_URL=https://facilitator.x402.org

# Optional: API key if your agent requires authentication
AGENT_API_KEY=your_api_key_here
```

### 3. Run the Payment System

```bash
npm install
npm run dev
```

That's it! The payment system will now use your agent API.

---

## 📡 Agent API Contract

Your agent API must accept the following request format:

### Request (POST to your endpoint)

```json
{
  "query": "Buy me the cheapest USB-C charger",
  "productPrice": 15.99,
  "metadata": {
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {AGENT_API_KEY}` (if you set AGENT_API_KEY)

### Response (Expected from your API)

Your API should return JSON with this structure:

```json
{
  "status": "completed",
  "orderId": "AMZ-123456789",
  "product": {
    "name": "Anker USB-C Charger 20W",
    "price": "$15.99",
    "vendor": "Amazon",
    "url": "https://amazon.com/product/123"
  },
  "proof": {
    "type": "order_confirmation",
    "timestamp": "2024-01-01T12:05:00.000Z",
    "screenshot": "base64_encoded_image_optional",
    "receiptUrl": "https://example.com/receipt/123"
  },
  "message": "Order placed successfully! Estimated delivery: 2-3 days"
}
```

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Status of the workflow (e.g., "completed", "failed", "pending") |
| `orderId` | string | Yes | Unique order identifier |
| `product.name` | string | Yes | Product name |
| `product.price` | string | Yes | Product price (formatted) |
| `product.vendor` | string | No | Vendor/store name |
| `product.url` | string | No | Product URL |
| `proof` | object | No | Proof of purchase |
| `message` | string | No | Human-readable message |

---

## 🔄 Fallback Behavior

If your agent API is not configured or fails:
- The payment system will return a **mock response**
- The frontend will show a warning that the agent is not configured
- This allows you to test the x402 payment flow even without a working agent

---

## 🧪 Testing Your Integration

### 1. Check Configuration

```bash
curl http://localhost:3000/api/pricing
```

Response will show if your agent is configured:
```json
{
  "agentFee": 2.00,
  "currency": "USDC",
  "agentApiEndpoint": "http://localhost:8000/agent/execute",
  "configured": true  // ← Should be true if AGENT_API_ENDPOINT is set
}
```

### 2. Test Agent API Directly

```bash
curl -X POST http://localhost:8000/agent/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "Test product",
    "productPrice": 10.00,
    "metadata": {"timestamp": "2024-01-01T12:00:00.000Z"}
  }'
```

### 3. Test Full x402 Flow

Use the frontend at `http://localhost:3000` or call the API:

```bash
# Step 1: Request service (get 402)
curl -X POST http://localhost:3000/api/agent/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "query": "Buy USB-C charger",
      "productPrice": 15.99
    }
  }'

# Step 2: Submit payment (with paymentProof)
curl -X POST http://localhost:3000/api/agent/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "query": "Buy USB-C charger",
      "productPrice": 15.99
    },
    "paymentProof": {
      "paymentId": "payment-id-from-402-response",
      "signature": "0x...",
      "transactionHash": "0x..."
    }
  }'
```

---

## 🎯 Example Agent API Implementations

### Python Flask Example

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/agent/execute', methods=['POST'])
def execute_agent():
    data = request.json
    query = data['query']
    product_price = data['productPrice']
    
    # Your agent logic here
    result = your_purchasing_agent.execute(query, product_price)
    
    return jsonify({
        "status": "completed",
        "orderId": result.order_id,
        "product": {
            "name": result.product_name,
            "price": f"${product_price:.2f}",
            "vendor": result.vendor,
            "url": result.product_url
        },
        "proof": {
            "type": "order_confirmation",
            "timestamp": result.timestamp,
        },
        "message": f"Order placed successfully!"
    })

if __name__ == '__main__':
    app.run(port=8000)
```

### Node.js Express Example

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/agent/execute', async (req, res) => {
  const { query, productPrice, metadata } = req.body;
  
  // Your agent logic here
  const result = await yourPurchasingAgent.execute(query, productPrice);
  
  res.json({
    status: 'completed',
    orderId: result.orderId,
    product: {
      name: result.productName,
      price: `$${productPrice.toFixed(2)}`,
      vendor: result.vendor,
      url: result.productUrl
    },
    proof: {
      type: 'order_confirmation',
      timestamp: new Date().toISOString(),
    },
    message: 'Order placed successfully!'
  });
});

app.listen(8000, () => console.log('Agent API running on port 8000'));
```

---

## 🔐 Security Best Practices

1. **Use HTTPS** in production for AGENT_API_ENDPOINT
2. **Set AGENT_API_KEY** if your agent requires authentication
3. **Never commit** `.env.local` to git (already in .gitignore)
4. **Validate** all responses from your agent API
5. **Set rate limits** on your agent API endpoint

---

## 🐛 Troubleshooting

### Agent API Not Being Called

Check:
- Is `AGENT_API_ENDPOINT` set in `.env.local`?
- Is your agent API running?
- Check browser console / server logs for error messages

### Getting Mock Responses

This means:
- `AGENT_API_ENDPOINT` is not configured, OR
- Your agent API is not responding correctly, OR
- There's a network error

Check the server logs for detailed error messages.

### Payment Issues

The payment flow is independent of the agent API:
1. Payment happens first (via x402)
2. Only after payment verification does the agent execute
3. If agent fails, payment is still captured (handle refunds in your business logic)

---

## 📚 Learn More

- [x402 Documentation](https://x402.gitbook.io/x402)
- [Main README](./README.md)
- [Agent API Examples](./examples/) (coming soon)

