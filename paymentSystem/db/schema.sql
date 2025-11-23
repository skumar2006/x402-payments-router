-- User Wallets Table
-- Maps phone numbers to Coinbase CDP wallets (one wallet per user)

CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  wallet_id VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast phone number lookup
CREATE INDEX IF NOT EXISTS idx_phone_number ON user_wallets(phone_number);

-- Index for wallet address lookup
CREATE INDEX IF NOT EXISTS idx_wallet_address ON user_wallets(wallet_address);

-- Payments Table (optional - for tracking payment history)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_id UUID UNIQUE NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  user_wallet_address VARCHAR(255) NOT NULL,
  amount DECIMAL(20, 6) NOT NULL,
  agent_fee DECIMAL(20, 6) NOT NULL,
  product_price DECIMAL(20, 6) NOT NULL,
  product_query TEXT,
  transaction_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES user_wallets(phone_number)
);

-- Index for payment lookup
CREATE INDEX IF NOT EXISTS idx_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_phone ON payments(user_phone);
CREATE INDEX IF NOT EXISTS idx_transaction_hash ON payments(transaction_hash);

-- For additional migrations, see:
-- - migrations/002_create_logs_table.sql (Transaction Logs)
