# Dummy Purchasing Agent

A simple mock purchasing agent API that returns product prices for testing the x402 payment system.

## What It Does

This dummy agent:
- ✅ Takes a product query (e.g., "buy me a USB-C charger")
- ✅ Looks it up in a mock product database
- ✅ Returns the product name and price in USD
- ✅ Simulates an order confirmation

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server runs on **http://localhost:8000**

## API Endpoints

### POST `/agent/execute` (Main Endpoint)

Execute a purchase request.

**Request:**
```json
{
  "query": "buy me a usb-c charger",
  "productPrice": 15.99,  // optional
  "metadata": {
    "timestamp": "2024-..."
  }
}
```

**Response:**
```json
{
  "status": "completed",
  "orderId": "ORD-1234567890",
  "product": {
    "name": "Anker USB-C Charger 20W",
    "price": 12.99,
    "priceUSD": 12.99,
    "vendor": "Amazon",
    "url": "https://example.com/..."
  },
  "proof": {
    "type": "order_confirmation",
    "timestamp": "2024-...",
    "confirmationNumber": "CONF-ABC123"
  },
  "message": "Order placed successfully! Anker USB-C Charger 20W for $12.99 from Amazon"
}
```

### GET `/products`

List all available products in the database.

```bash
curl http://localhost:8000/products
```

### GET `/search?q=charger`

Search for a product without executing a purchase.

```bash
curl http://localhost:8000/search?q=charger
```

### GET `/health`

Health check endpoint.

```bash
curl http://localhost:8000/health
```

## Product Database

The dummy agent includes prices for:

**Electronics:**
- USB-C Charger: $12.99
- Headphones: $279.99
- AirPods: $249.00
- Mouse: $99.99
- Keyboard: $89.00
- Laptop: $1,199.00
- Monitor: $349.99
- And more...

**Home & Office:**
- Desk Lamp: $34.99
- Chair: $1,395.00
- Desk: $499.00
- Backpack: $259.95
- And more...

See the full list at `GET /products`

## Testing with Payment System

### 1. Start the Dummy Agent

```bash
cd dummyAgent
npm install
npm start
```

### 2. Configure Payment System

In `paymentSystem/.env.local`:

```bash
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute
```

### 3. Start Payment System

```bash
cd paymentSystem
npm run dev
```

### 4. Test the Flow

1. Go to http://localhost:3000
2. Enter "USB-C charger" in the query
3. The agent will automatically return $12.99 as the price
4. Payment system calculates: $2.00 (agent fee) + $12.99 (product) = $14.99
5. Complete the payment flow

## How It Works

```
Payment System Request
    ↓
POST /agent/execute
    ↓
Dummy Agent searches product database
    ↓
Returns product name + price
    ↓
Payment System uses price for x402 payment
```

## Adding More Products

Edit `server.js` and add to the `productDatabase` object:

```javascript
const productDatabase = {
  'your product': { 
    name: 'Full Product Name', 
    price: 99.99, 
    vendor: 'Store Name' 
  },
  // ... more products
};
```

## Example Requests

### Using curl

```bash
# Execute purchase
curl -X POST http://localhost:8000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"query":"usb-c charger"}'

# Search products
curl http://localhost:8000/search?q=headphones

# List all products
curl http://localhost:8000/products
```

### Using JavaScript

```javascript
const response = await fetch('http://localhost:8000/agent/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'buy me airpods',
    metadata: { timestamp: new Date().toISOString() }
  })
});

const result = await response.json();
console.log('Product:', result.product.name);
console.log('Price:', result.product.price);
```

## Port Configuration

Default port is `8000`. Change it with the `PORT` environment variable:

```bash
PORT=3001 npm start
```

Don't forget to update `AGENT_API_ENDPOINT` in the payment system if you change the port!

## Next Steps

Replace this dummy agent with your real purchasing agent that:
- Actually searches product databases (Amazon, eBay, etc.)
- Gets real-time prices
- Executes actual purchases
- Returns real order confirmations

The API contract is the same - just implement the same endpoints with real logic!

