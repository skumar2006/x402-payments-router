# ETH Global BA - x402 Project

This repository contains the x402 payment protocol integration for purchasing agents.

## 📁 Project Structure

```
ethGlobalBA/
├── dummyAgent/             # Dummy Purchasing Agent API
│   ├── server.js           # Express API with product prices
│   ├── package.json
│   └── README.md           # Agent API docs
├── paymentSystem/          # x402 Payment System (Next.js app)
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── agent/purchase/  # Main x402 payment endpoint
│   │   │   ├── health/          # Health check
│   │   │   └── pricing/         # Pricing info
│   │   ├── page.tsx        # Main page component
│   │   └── ...
│   ├── lib/                # Utilities
│   │   └── coinbaseWallet.ts    # Coinbase wallet integration
│   ├── package.json
│   └── README.md           # Detailed payment system docs
└── README.md               # This file
```

## 🚀 Getting Started

### 1. Start the Dummy Agent

The agent API provides product prices.

```bash
cd dummyAgent
npm install
npm start
```

Runs on [http://localhost:8000](http://localhost:8000)

### 2. Start the Payment System

The payment system implements the x402 protocol.

```bash
cd paymentSystem
npm install
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000)

### 3. Test the Flow

1. Go to http://localhost:3000
2. Enter "USB-C charger" 
3. Agent automatically looks up price ($12.99)
4. Payment system adds agent fee ($2.00)
5. Total x402 payment: $14.99
6. Complete the simulated payment
7. Temporary Coinbase wallet created
8. Result displayed!

See `paymentSystem/README.md` and `dummyAgent/README.md` for detailed documentation.

## 📚 Learn More

- [x402 Documentation](https://x402.gitbook.io/x402)
- [Payment System Details](./paymentSystem/README.md)

## 📄 License

MIT
