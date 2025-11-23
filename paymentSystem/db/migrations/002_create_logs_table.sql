-- Transaction Logs Table
-- Tracks all completed transactions in the system
-- Created: 2025-11-23

CREATE TABLE IF NOT EXISTS transaction_logs (
  id SERIAL PRIMARY KEY,
  
  -- Transaction identification
  log_number VARCHAR(50) UNIQUE NOT NULL, -- Format: TXN-{timestamp}-{random}
  transaction_type VARCHAR(50) NOT NULL, -- payment_completed, escrow_confirmed, wallet_transfer, onramp_created, etc.
  transaction_id VARCHAR(255), -- payment_id, order_id, etc.
  transaction_hash VARCHAR(255), -- blockchain transaction hash if applicable
  
  -- User/wallet information
  user_identifier VARCHAR(255), -- phone number, wallet address, email, etc.
  wallet_address VARCHAR(255),
  
  -- Transaction details
  amount DECIMAL(20, 6), -- transaction amount
  currency VARCHAR(10) DEFAULT 'ETH', -- ETH, USDC, USD, etc.
  status VARCHAR(50) NOT NULL, -- success, pending, failed, refunded
  
  -- Additional context
  description TEXT, -- human-readable description
  metadata JSONB, -- flexible storage for additional transaction details
  
  -- Related entities
  payment_id UUID, -- reference to payments table if applicable
  escrow_order_id VARCHAR(255), -- escrow order ID if applicable
  agent_transaction_id VARCHAR(255), -- agent's transaction ID (e.g., Amazon order)
  
  -- Error tracking
  error_message TEXT, -- if transaction failed
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_log_number ON transaction_logs(log_number);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON transaction_logs(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_id ON transaction_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_hash ON transaction_logs(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_user_identifier ON transaction_logs(user_identifier);
CREATE INDEX IF NOT EXISTS idx_wallet_address ON transaction_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_payment_id ON transaction_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_status ON transaction_logs(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON transaction_logs(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transaction_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER trigger_update_transaction_logs_updated_at
  BEFORE UPDATE ON transaction_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_logs_updated_at();

-- Add comment for documentation
COMMENT ON TABLE transaction_logs IS 'Comprehensive transaction logging for all payment, escrow, wallet transfers, and onramp transactions';
COMMENT ON COLUMN transaction_logs.log_number IS 'Unique transaction log identifier in format TXN-{timestamp}-{random}';
COMMENT ON COLUMN transaction_logs.transaction_type IS 'Type of transaction: payment_completed, escrow_confirmed, wallet_transfer, onramp_created, refund, etc.';
COMMENT ON COLUMN transaction_logs.metadata IS 'JSON field for storing additional transaction details like product info, fees, gas costs, etc.';

