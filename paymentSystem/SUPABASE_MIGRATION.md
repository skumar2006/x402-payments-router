# 🚀 Migrate to Supabase Database

Complete guide to move from local PostgreSQL to Supabase.

## Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign in/Sign up (free tier available)
4. Click "New Project"
5. Fill in:
   - **Name**: x402-payments (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (works great for this!)
6. Click "Create new project"
7. Wait 2-3 minutes for setup

## Step 2: Get Connection String

1. In your Supabase project dashboard
2. Click **Settings** (gear icon) in sidebar
3. Click **Database**
4. Scroll to **Connection string**
5. Select **URI** tab
6. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** in sidebar
2. Click **New query**
3. Copy and paste this SQL:

```sql
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
  gift_card_transaction_id INTEGER,
  gift_card_amount DECIMAL(20, 2),
  gift_card_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES user_wallets(phone_number)
);

-- Index for payment lookup
CREATE INDEX IF NOT EXISTS idx_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_phone ON payments(user_phone);
CREATE INDEX IF NOT EXISTS idx_transaction_hash ON payments(transaction_hash);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all - you can restrict later)
CREATE POLICY "Enable all access for user_wallets" ON user_wallets
  FOR ALL USING (true);

CREATE POLICY "Enable all access for payments" ON payments
  FOR ALL USING (true);
```

4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Update Your .env.local

Replace your current `DATABASE_URL` with your Supabase connection string:

**Before:**
```bash
DATABASE_URL=postgresql://localhost/x402_payments
```

**After:**
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

Example:
```bash
DATABASE_URL=postgresql://postgres:MySecurePass123@db.abcdefghijk.supabase.co:5432/postgres
```

**Important**: Make sure to:
- Replace `[YOUR-PASSWORD]` with your actual password
- Keep the connection string in quotes if it has special characters
- The database name is `postgres` (default Supabase database)

## Step 5: Test the Connection

No code changes needed! The same `pg` library works with Supabase.

Just restart your dev server:
```bash
cd paymentSystem
npm run dev
```

## Step 6: Verify It Works

1. Go to http://localhost:3000
2. Enter a phone number + email
3. Click Continue
4. Check Supabase dashboard:
   - Go to **Table Editor** in sidebar
   - Click **user_wallets** table
   - You should see your new wallet entry!

## Step 7: View Your Data in Supabase

### Table Editor (GUI)
1. Click **Table Editor** in Supabase sidebar
2. Select `user_wallets` or `payments` table
3. View/edit data in spreadsheet format

### SQL Editor (Query)
1. Click **SQL Editor**
2. Run queries like:
```sql
-- See all users
SELECT phone_number, wallet_address, created_at 
FROM user_wallets 
ORDER BY created_at DESC;

-- See all payments
SELECT * FROM payments ORDER BY created_at DESC;
```

## Benefits of Supabase

✅ **Free tier** - 500MB database, 2GB bandwidth/month  
✅ **Hosted** - No local PostgreSQL needed  
✅ **Automatic backups** - Built-in  
✅ **Real-time subscriptions** - Can subscribe to table changes  
✅ **Dashboard** - Beautiful UI to view/edit data  
✅ **Auth** - Built-in authentication (can add later)  
✅ **Storage** - Can store files if needed  
✅ **API** - Auto-generated REST and GraphQL APIs  

## Optional: Use Supabase Client Library

Instead of raw `pg`, you can use `@supabase/supabase-js` for more features:

```bash
npm install @supabase/supabase-js
```

But for now, the raw SQL approach with `pg` works perfectly fine!

## Troubleshooting

### "connection refused" or "could not connect"
- Check your connection string is correct
- Make sure your Supabase project is active (not paused)
- Check your internet connection

### "password authentication failed"
- Double-check your password in the connection string
- Go to Supabase → Settings → Database → Reset password

### "relation user_wallets does not exist"
- Make sure you ran the SQL schema in Step 3
- Check you're connected to the right database

### Tables not showing in Table Editor
- Refresh the page
- Click on "user_wallets" in the sidebar
- Run the schema SQL again if needed

## Migration from Local PostgreSQL

If you have existing data in local PostgreSQL you want to keep:

```bash
# Export from local
pg_dump x402_payments > backup.sql

# Import to Supabase (using connection string)
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" < backup.sql
```

## You're Done! 🎉

Your x402 payment system is now using Supabase as the database!

- ✅ No local PostgreSQL needed
- ✅ Access from anywhere
- ✅ Beautiful dashboard to view data
- ✅ Free and scalable

Next time you run the app, all wallet data will be stored in Supabase! 🚀


