# Payment System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER / CLIENT                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Request: "Buy USB-C charger ($15.99)"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PAYMENT SYSTEM (This App)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Next.js Frontend (React)                          ││
│  │  - User inputs query & product price                        ││
│  │  - Displays payment requirements                            ││
│  │  - Simulates wallet interaction                             ││
│  │  - Shows agent results                                      ││
│  └────────────────────────┬────────────────────────────────────┘│
│                           │                                      │
│                           │ HTTP Request                         │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │          API Routes (x402 Protocol)                         ││
│  │                                                              ││
│  │  POST /api/agent/purchase                                   ││
│  │  ├─ No payment? → Return 402 with instructions             ││
│  │  ├─ Has payment? → Verify → Call Agent API → Return result ││
│  │  │                                                           ││
│  │  GET /api/pricing                                           ││
│  │  └─ Returns agent fee & configuration status               ││
│  │                                                              ││
│  │  GET /api/health                                            ││
│  │  └─ Health check                                            ││
│  └────────────────────────┬────────────────────────────────────┘│
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ 2. After payment verified
                            │
                            ▼
           ┌────────────────────────────────────┐
           │     YOUR AGENT API                 │
           │  (You provide this endpoint)       │
           │                                    │
           │  POST /agent/execute               │
           │  - Receives: query, productPrice   │
           │  - Returns: order result           │
           └────────────────────────────────────┘
                            │
                            │ 3. Returns order confirmation
                            ▼
           ┌────────────────────────────────────┐
           │  Payment System returns to user:   │
           │  - Order ID                        │
           │  - Product details                 │
           │  - Proof of purchase               │
           └────────────────────────────────────┘
```

## 🔄 Detailed Flow

### 1️⃣ User Requests Service

```
User → Frontend
  Input: "Buy cheapest USB-C charger", Price: $15.99
```

### 2️⃣ Initial Request (No Payment)

```
Frontend → API Route: POST /api/agent/purchase
{
  "request": {
    "query": "Buy cheapest USB-C charger",
    "productPrice": 15.99
  }
}

API Route → Frontend: 402 Payment Required
{
  "payment": {
    "id": "uuid",
    "amount": "17.99",  // $2.00 agent fee + $15.99 product
    "breakdown": {
      "agentFee": "2.00",
      "productPrice": "15.99",
      "total": "17.99"
    },
    "instructions": { ... }
  }
}
```

### 3️⃣ Payment Submission

```
Frontend → API Route: POST /api/agent/purchase
{
  "request": { ... },
  "paymentProof": {
    "paymentId": "uuid",
    "signature": "0x...",
    "transactionHash": "0x..."
  }
}
```

### 4️⃣ Payment Verification & Agent Execution

```
API Route:
  1. Verify payment with facilitator (mocked in demo)
  2. Call YOUR agent API:
  
     POST {AGENT_API_ENDPOINT}
     Headers:
       Content-Type: application/json
       Authorization: Bearer {AGENT_API_KEY}  // if configured
     Body:
       {
         "query": "Buy cheapest USB-C charger",
         "productPrice": 15.99,
         "metadata": { "timestamp": "..." }
       }
  
  3. Receive agent response:
     {
       "status": "completed",
       "orderId": "AMZ-123",
       "product": { ... },
       "proof": { ... }
     }
```

### 5️⃣ Return Results

```
API Route → Frontend: 200 OK
{
  "success": true,
  "paymentId": "uuid",
  "amount": "17.99",
  "result": {
    "status": "completed",
    "orderId": "AMZ-123",
    "product": { ... },
    "proof": { ... }
  }
}

Frontend displays order confirmation to user
```

## 🔌 Integration Points

### What You Control (Your Agent API)

```
┌───────────────────────────────────────┐
│     YOUR PURCHASING AGENT             │
│                                       │
│  - Product search logic               │
│  - Vendor selection                   │
│  - Purchase execution                 │
│  - Proof generation                   │
│                                       │
│  Endpoint: POST /agent/execute        │
└───────────────────────────────────────┘
```

### What We Handle (Payment System)

```
┌───────────────────────────────────────┐
│     PAYMENT SYSTEM                    │
│                                       │
│  - x402 payment protocol              │
│  - Payment verification               │
│  - Frontend UI                        │
│  - API orchestration                  │
│  - Error handling & fallbacks         │
│                                       │
│  Your only input:                     │
│  AGENT_API_ENDPOINT=http://...        │
└───────────────────────────────────────┘
```

## 📦 What's Included

```
paymentSystem/
│
├── app/
│   ├── api/
│   │   ├── agent/purchase/route.ts  ← Main x402 endpoint
│   │   ├── pricing/route.ts          ← Pricing info
│   │   └── health/route.ts           ← Health check
│   │
│   ├── page.tsx                      ← Frontend UI
│   ├── page.module.css               ← Styling
│   └── layout.tsx                    ← App layout
│
├── env.example                       ← Configuration template
├── CONFIGURATION.md                  ← Setup guide
├── ARCHITECTURE.md                   ← This file
└── README.md                         ← Main docs
```

## 🎯 Your Responsibility vs Ours

| Responsibility | You (Agent Developer) | Us (Payment System) |
|----------------|----------------------|---------------------|
| Agent logic | ✅ Implement | ❌ Not needed |
| Product search | ✅ Implement | ❌ Not needed |
| Purchase execution | ✅ Implement | ❌ Not needed |
| x402 protocol | ❌ Not needed | ✅ Implemented |
| Payment verification | ❌ Not needed | ✅ Implemented |
| Frontend UI | ❌ Not needed | ✅ Implemented |
| Dynamic pricing | ❌ Not needed | ✅ Implemented |

## 🔐 Security Flow

```
1. User submits request
   ↓
2. System generates Payment ID (UUID)
   ↓
3. System returns 402 with payment instructions
   ↓
4. User signs payment with wallet
   ↓
5. System verifies signature with facilitator
   ↓
6. Only after verification: Call your agent API
   ↓
7. Return results to user
```

**Important:** Your agent API is only called AFTER payment is verified. You don't need to handle any payment logic.

## 🛠️ Configuration Flow

```
Step 1: Set Environment Variable
┌─────────────────────────────────┐
│ AGENT_API_ENDPOINT=http://...   │
└────────────┬────────────────────┘
             │
             ▼
Step 2: Payment System Reads Config
┌─────────────────────────────────┐
│ const endpoint = process.env    │
│   .AGENT_API_ENDPOINT           │
└────────────┬────────────────────┘
             │
             ▼
Step 3: Payment System Calls Your API
┌─────────────────────────────────┐
│ fetch(endpoint, {               │
│   method: 'POST',               │
│   body: JSON.stringify({        │
│     query, productPrice         │
│   })                            │
│ })                              │
└────────────┬────────────────────┘
             │
             ▼
Step 4: Your API Returns Result
┌─────────────────────────────────┐
│ { status, orderId, product }    │
└─────────────────────────────────┘
```

## 📊 Data Flow

```
┌─────────────┐
│    User     │
│   Input     │
└──────┬──────┘
       │
       │ query: "Buy USB-C charger"
       │ productPrice: 15.99
       │
       ▼
┌─────────────────────────────────┐
│   Payment System Calculates:    │
│   total = agentFee + productPrice│
│   total = 2.00 + 15.99 = 17.99  │
└──────┬──────────────────────────┘
       │
       │ Returns 402 with total: 17.99
       │
       ▼
┌─────────────┐
│    User     │
│    Pays     │
└──────┬──────┘
       │
       │ paymentProof
       │
       ▼
┌─────────────────────────────────┐
│   Payment System Verifies       │
└──────┬──────────────────────────┘
       │
       │ Calls your API with:
       │ {query, productPrice: 15.99}
       │
       ▼
┌─────────────────────────────────┐
│      Your Agent API             │
│   Executes Purchase Logic       │
└──────┬──────────────────────────┘
       │
       │ Returns: {orderId, product, proof}
       │
       ▼
┌─────────────────────────────────┐
│   Payment System Returns        │
│   Result to User                │
└─────────────────────────────────┘
```

## 🚀 Deployment Architecture

```
Production Setup:

┌──────────────────────────────────────┐
│         Vercel / Your Host           │
│                                      │
│  ┌────────────────────────────┐    │
│  │   Payment System (Next.js) │    │
│  │   - Handles x402           │    │
│  │   - Serves frontend        │    │
│  └────────────┬───────────────┘    │
│               │                     │
└───────────────┼─────────────────────┘
                │
                │ HTTPS
                │
                ▼
┌──────────────────────────────────────┐
│      Your Agent API (Anywhere)       │
│                                      │
│  - AWS Lambda                        │
│  - Google Cloud Run                  │
│  - Your own server                   │
│  - Local development                 │
└──────────────────────────────────────┘
```

Your agent can be hosted anywhere, as long as the payment system can reach it via HTTP/HTTPS!

