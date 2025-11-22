# x402 Purchasing Agent - Payment System

A Next.js implementation of the x402 payment protocol with a mock purchasing agent. This demo shows how to integrate x402 as a payment + settlement layer for agent workflows.

## 🎯 What This Does

- **Mock Purchasing Agent**: Simulates a purchasing workflow
- **x402 Payment Flow**: Implements the complete HTTP 402 payment protocol
- **Dynamic Pricing**: Payment = Agent Fee ($2 USDC) + Product Cost
- **Payment Verification**: Mocks the facilitator verification/settlement flow
- **Modern UI**: Beautiful Next.js frontend with React components

## 🏗️ Architecture

```
User Request → API Route (402 Response) → User Pays → API Verifies → Agent Executes → Result
```

### Flow Details

1. **User submits request** (e.g., "Buy me a USB-C charger" + product price)
2. **API returns 402** with payment instructions (total = agent fee + product cost)
3. **User clicks "Simulate Payment"** (in production, wallet would pop up)
4. **API verifies payment** with facilitator (mocked)
5. **Agent executes workflow** and returns proof/results
6. **Transaction logged** for auditability

## 💰 Pricing Structure

```
Total x402 Payment = Agent Fee + Product Cost
```

- **Agent Service Fee**: $2.00 USDC (fixed)
- **Product Cost**: Dynamic (can be user input, database lookup, API call, etc.)

### Example:
- Product: $15.99
- Agent Fee: $2.00
- **Total Payment: $17.99 USDC**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

```bash
# Start development server
npm run dev

# App will run on http://localhost:3000
```

### Build for Production

```bash
# Build the app
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
paymentSystem/
├── app/
│   ├── api/
│   │   ├── agent/purchase/route.ts  # Main x402 payment endpoint
│   │   ├── health/route.ts          # Health check
│   │   └── pricing/route.ts         # Pricing info
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Main page component
│   ├── page.module.css              # Component styles
│   └── globals.css                  # Global styles
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### POST `/api/agent/purchase`

Main endpoint for agent workflows with x402 payment.

**Without Payment (returns 402):**
```json
POST /api/agent/purchase
{
  "request": {
    "query": "Buy me the cheapest USB-C charger",
    "productPrice": 15.99
  }
}

Response: 402 Payment Required
{
  "error": "Payment Required",
  "payment": {
    "id": "uuid",
    "amount": "17.99",
    "currency": "USDC",
    "network": "base",
    "breakdown": {
      "productPrice": "15.99",
      "agentFee": "2.00",
      "total": "17.99"
    },
    "instructions": {...}
  }
}
```

**With Payment (returns result):**
```json
POST /api/agent/purchase
{
  "request": {
    "query": "Buy me the cheapest USB-C charger",
    "productPrice": 15.99
  },
  "paymentProof": {
    "paymentId": "uuid",
    "signature": "0x...",
    "transactionHash": "0x..."
  }
}

Response: 200 OK
{
  "success": true,
  "paymentId": "uuid",
  "amount": "17.99",
  "agentFee": "2.00",
  "productPrice": "15.99",
  "result": {
    "status": "completed",
    "orderId": "AMZ-123",
    "product": {...},
    "proof": {...}
  }
}
```

### GET `/api/health`

Health check endpoint.

### GET `/api/pricing`

Get current agent fee and pricing structure.

## 🧪 Testing the Flow

1. Open http://localhost:3000 in your browser
2. Enter what you want to buy
3. Enter the expected product price
4. Click "Request Agent Service"
5. See the 402 response with payment breakdown
6. Click "Simulate Payment" button
7. Watch the agent execute the workflow
8. See the results with order confirmation

## 🔧 What's Mocked vs Real

### Mocked (for demo):
- ✅ Payment verification (would call real facilitator in production)
- ✅ Agent execution (would be real purchasing logic)
- ✅ Wallet signing (frontend would connect to real wallet)

### Real x402 Implementation:
- ✅ HTTP 402 status code usage
- ✅ Payment instruction format
- ✅ Dynamic pricing calculation
- ✅ Payment ID generation and tracking
- ✅ Proper flow: request → 402 → pay → verify → deliver
- ✅ Next.js API routes with TypeScript
- ✅ Modern React components

## 🚧 Making This Production-Ready

To make this production-ready, you need to:

### 1. **Integrate Real Facilitator**
Replace `mockVerifyPayment()` with actual facilitator API calls:
```typescript
// Call facilitator's /verify endpoint
const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
  method: 'POST',
  body: JSON.stringify({ paymentProof })
});

// Call facilitator's /settle endpoint
const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
  method: 'POST',
  body: JSON.stringify({ paymentId })
});
```

### 2. **Connect Real Wallet**
Integrate wallet SDK (e.g., Coinbase Wallet SDK, WalletConnect):
```typescript
import { CoinbaseWallet } from '@coinbase/wallet-sdk';

const wallet = new CoinbaseWallet({ appName: 'x402 Agent' });
const accounts = await wallet.eth_requestAccounts();
const signature = await wallet.signTypedData(...);
```

### 3. **Build Real Agent**
Replace `executeMockAgentWorkflow()` with actual purchasing logic:
```typescript
// Real implementation
const searchResults = await amazonAPI.search(query);
const product = selectBestProduct(searchResults);
const order = await amazonAPI.placeOrder(product);
return order;
```

### 4. **Add Database**
Replace in-memory Maps with real database:
```typescript
// PostgreSQL, MongoDB, etc.
await db.payments.create({
  paymentId,
  amount,
  status: 'pending',
  timestamp: new Date()
});
```

### 5. **Dynamic Product Pricing**
Instead of user input, calculate from real sources:
```typescript
// Option 1: Database lookup
const product = await db.products.findByName(query);
const productPrice = product.price;

// Option 2: Real-time API
const amazonProduct = await amazonAPI.search(query);
const productPrice = amazonProduct.currentPrice;

// Option 3: Agent calculates
const searchResults = await agent.search(query);
const productPrice = searchResults[0].price;
```

## 🎨 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **React** - UI components
- **CSS Modules** - Scoped styling
- **Next.js API Routes** - Backend endpoints

## 📚 x402 Resources

- [x402 Documentation](https://x402.gitbook.io/x402)
- [x402 Quickstart for Sellers](https://x402.gitbook.io/x402/getting-started/quickstart-for-sellers)
- [x402 Quickstart for Buyers](https://x402.gitbook.io/x402/getting-started/quickstart-for-buyers)
- [HTTP 402 Payment Required](https://x402.gitbook.io/x402/core-concepts/http-402)

## 🔑 Key Concepts

### Payment ID
Unique UUID generated for each payment request. Links the 402 response to the payment proof.

### Dynamic Pricing
The same endpoint can charge different amounts based on request data. Server calculates price before returning 402.

### x402 Flow
1. Client requests resource
2. Server returns 402 with payment instructions
3. Client pays (wallet signs transaction)
4. Server verifies with facilitator
5. Server delivers resource

## 📄 License

MIT

