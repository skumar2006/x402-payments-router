# ETH Global BA - x402 Project

This repository contains the x402 payment protocol integration for purchasing agents.

## 📁 Project Structure

```
ethGlobalBA/
├── paymentSystem/          # x402 Payment System (Next.js app)
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── agent/purchase/  # Main x402 payment endpoint
│   │   │   ├── health/          # Health check
│   │   │   └── pricing/         # Pricing info
│   │   ├── page.tsx        # Main page component
│   │   └── ...
│   ├── package.json
│   └── README.md           # Detailed payment system docs
└── README.md               # This file
```

## 🚀 Getting Started

### Payment System

The payment system implements the x402 protocol for purchasing agent workflows.

```bash
cd paymentSystem
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

See `paymentSystem/README.md` for detailed documentation.

## 📚 Learn More

- [x402 Documentation](https://x402.gitbook.io/x402)
- [Payment System Details](./paymentSystem/README.md)

## 📄 License

MIT
