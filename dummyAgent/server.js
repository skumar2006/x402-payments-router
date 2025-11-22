const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

// Mock product database with prices in ETH
// Using rough conversion: 1 ETH ≈ $3000 USD
const ETH_PRICE_USD = 3000;

const productDatabase = {
  // Electronics
  'usb-c charger': { name: 'Anker USB-C Charger 20W', priceUSD: 12.99, vendor: 'Amazon' },
  'usb c charger': { name: 'Anker USB-C Charger 20W', priceUSD: 12.99, vendor: 'Amazon' },
  'charger': { name: 'Universal Phone Charger', priceUSD: 9.99, vendor: 'Amazon' },
  'headphones': { name: 'Sony WH-1000XM4 Headphones', priceUSD: 279.99, vendor: 'Best Buy' },
  'wireless headphones': { name: 'Sony WH-1000XM4 Headphones', priceUSD: 279.99, vendor: 'Best Buy' },
  'airpods': { name: 'Apple AirPods Pro 2', priceUSD: 249.00, vendor: 'Apple Store' },
  'mouse': { name: 'Logitech MX Master 3', priceUSD: 99.99, vendor: 'Amazon' },
  'keyboard': { name: 'Keychron K2 Mechanical Keyboard', priceUSD: 89.00, vendor: 'Keychron' },
  'laptop': { name: 'MacBook Air M2', priceUSD: 1199.00, vendor: 'Apple Store' },
  'monitor': { name: 'LG 27" 4K Monitor', priceUSD: 349.99, vendor: 'Best Buy' },
  'webcam': { name: 'Logitech C920 HD Webcam', priceUSD: 79.99, vendor: 'Amazon' },
  'phone': { name: 'iPhone 15', priceUSD: 799.00, vendor: 'Apple Store' },
  'tablet': { name: 'iPad Air', priceUSD: 599.00, vendor: 'Apple Store' },
  
  // Home & Office
  'desk lamp': { name: 'LED Desk Lamp', priceUSD: 34.99, vendor: 'Amazon' },
  'chair': { name: 'Herman Miller Aeron Chair', priceUSD: 1395.00, vendor: 'Herman Miller' },
  'desk': { name: 'Standing Desk 60"', priceUSD: 499.00, vendor: 'Uplift' },
  'backpack': { name: 'Peak Design Everyday Backpack', priceUSD: 259.95, vendor: 'Amazon' },
  'water bottle': { name: 'Hydro Flask 32oz', priceUSD: 44.95, vendor: 'REI' },
  'notebook': { name: 'Moleskine Classic Notebook', priceUSD: 17.99, vendor: 'Amazon' },
  'pen': { name: 'Pilot G2 Pen Pack', priceUSD: 8.99, vendor: 'Staples' },
  
  // Default/Misc
  'coffee': { name: 'Starbucks Coffee', priceUSD: 5.50, vendor: 'Starbucks' },
  'book': { name: 'The Pragmatic Programmer', priceUSD: 34.99, vendor: 'Amazon' },
  'shoes': { name: 'Nike Running Shoes', priceUSD: 120.00, vendor: 'Nike' },
  'shirt': { name: 'Basic T-Shirt', priceUSD: 19.99, vendor: 'Uniqlo' },
};

// Helper function to convert USD to ETH
function usdToEth(usdPrice) {
  return parseFloat((usdPrice / ETH_PRICE_USD).toFixed(6));
}

/**
 * Main endpoint: Agent execution
 * POST /agent/execute
 * 
 * Request body:
 * {
 *   "query": "buy me a usb-c charger",
 *   "productPrice": 15.99 (optional - will be calculated if not provided),
 *   "metadata": { ... }
 * }
 * 
 * Response:
 * {
 *   "status": "completed",
 *   "orderId": "...",
 *   "product": {
 *     "name": "...",
 *     "price": 12.99,
 *     "vendor": "..."
 *   },
 *   "proof": { ... },
 *   "message": "..."
 * }
 */
app.post('/agent/execute', (req, res) => {
  const { query, productPrice, metadata } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.log('🤖 Dummy Agent received request:', { query, productPrice, metadata });

  // Search for product in our mock database
  const product = findProduct(query);

  if (!product) {
    // If not found, return a generic response with user-provided price
    const fallbackPriceUSD = productPrice || 25.00;
    const fallbackPriceETH = usdToEth(fallbackPriceUSD);
    return res.json({
      status: 'completed',
      orderId: `ORD-${Date.now()}`,
      product: {
        name: query,
        price: fallbackPriceETH, // ETH price
        priceUSD: fallbackPriceUSD,
        priceETH: fallbackPriceETH,
        vendor: 'Generic Store',
        url: 'https://example.com/product',
      },
      proof: {
        type: 'order_confirmation',
        timestamp: new Date().toISOString(),
        note: 'Product not in database - using estimated price',
      },
      message: `Order placed for "${query}" at estimated price ${fallbackPriceETH} ETH ($${fallbackPriceUSD.toFixed(2)})`,
    });
  }

  // Return the found product with its price in ETH
  const priceETH = usdToEth(product.priceUSD);
  return res.json({
    status: 'completed',
    orderId: `ORD-${Date.now()}`,
    product: {
      name: product.name,
      price: priceETH, // ETH price
      priceUSD: product.priceUSD,
      priceETH: priceETH,
      vendor: product.vendor,
      url: `https://example.com/${encodeURIComponent(product.name)}`,
    },
    proof: {
      type: 'order_confirmation',
      timestamp: new Date().toISOString(),
      confirmationNumber: `CONF-${Math.random().toString(36).substring(7).toUpperCase()}`,
    },
    message: `Order placed successfully! ${product.name} for ${priceETH} ETH ($${product.priceUSD.toFixed(2)}) from ${product.vendor}`,
  });
});

/**
 * Helper: Find product in database
 * Searches by keywords in the query
 */
function findProduct(query) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Direct match
  if (productDatabase[normalizedQuery]) {
    return productDatabase[normalizedQuery];
  }
  
  // Keyword search
  for (const [key, product] of Object.entries(productDatabase)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return product;
    }
  }
  
  return null;
}

/**
 * GET /products
 * List all available products in the database
 */
app.get('/products', (req, res) => {
  const products = Object.entries(productDatabase).map(([key, product]) => ({
    keyword: key,
    ...product,
  }));
  
  res.json({
    count: products.length,
    products,
  });
});

/**
 * GET /search?q=...
 * Search for a product without executing purchase
 */
app.get('/search', (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  const product = findProduct(query);
  
  if (!product) {
    return res.json({
      found: false,
      message: 'Product not found in database',
      query,
    });
  }
  
  return res.json({
    found: true,
    product,
    query,
  });
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dummy Purchasing Agent',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /
 * API info
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Dummy Purchasing Agent API',
    version: '1.0.0',
    description: 'A simple mock agent that returns product prices',
    endpoints: {
      'POST /agent/execute': 'Execute purchase (main endpoint)',
      'GET /products': 'List all available products',
      'GET /search?q=...': 'Search for a product',
      'GET /health': 'Health check',
    },
    example: {
      method: 'POST',
      url: '/agent/execute',
      body: {
        query: 'buy me a usb-c charger',
        metadata: { timestamp: new Date().toISOString() },
      },
    },
  });
});

app.listen(PORT, () => {
  console.log('🚀 Dummy Agent API running on port', PORT);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search products: http://localhost:${PORT}/search?q=charger`);
  console.log(`📦 List products: http://localhost:${PORT}/products`);
  console.log(`💼 Main endpoint: POST http://localhost:${PORT}/agent/execute`);
  console.log(`\nExample request:`);
  console.log(`curl -X POST http://localhost:${PORT}/agent/execute \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"query":"usb-c charger"}'`);
});

