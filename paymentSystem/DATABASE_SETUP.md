# Database Setup - Quick Start

Complete guide to set up PostgreSQL for user wallet management.

## ✅ What Changed

**Before:** New temporary wallet created for each payment  
**Now:** One persistent wallet per user (linked to phone number)

## Quick Setup (5 minutes)

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Create database
createdb x402_payments

# Verify it was created
psql x402_payments -c "SELECT version();"
```

### Step 3: Run Database Schema

```bash
cd /Users/shivamkumar/ethGlobalBA/paymentSystem
psql x402_payments < db/schema.sql
```

### Step 4: Add DATABASE_URL to .env.local

Add this line to your `.env.local`:

```bash
DATABASE_URL=postgresql://localhost/x402_payments
```

Or if you have a username/password:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/x402_payments
```

### Step 5: Install Database Client

```bash
cd paymentSystem
npm install
```

This installs the `pg` (PostgreSQL) package.

### Step 6: Test It

Start the dev server:
```bash
npm run dev
```

Go to http://localhost:3000 and:
1. Enter a phone number (e.g., `+15555551234`)
2. Click "Continue"
3. Wallet will be created and stored in database!

Check the database:
```bash
psql x402_payments -c "SELECT phone_number, wallet_address FROM user_wallets;"
```

## Complete .env.local

Your `.env.local` should now have:

```bash
# Database
DATABASE_URL=postgresql://localhost/x402_payments

# Coinbase CDP (Required)
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key

# Agent
AGENT_API_ENDPOINT=http://localhost:8000/agent/execute

# Wallet Connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# Optional
AGENT_FEE_USDC=2.00
NETWORK_ID=base-sepolia
```

## Alternative: Docker PostgreSQL

If you prefer Docker:

```bash
# Start PostgreSQL
docker run --name x402-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=x402_payments \
  -p 5432:5432 \
  -d postgres:15

# Wait 5 seconds, then create schema
sleep 5
docker exec -i x402-postgres psql -U postgres -d x402_payments < db/schema.sql
```

Then use:
```bash
DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/x402_payments
```

## Alternative: Cloud Database (Recommended for Production)

### Supabase (Free Tier)

1. Go to https://supabase.com/
2. Create a project
3. Go to Settings → Database
4. Copy the connection string
5. Run schema:
   ```bash
   psql "your-supabase-connection-string" < db/schema.sql
   ```
6. Add to `.env.local`:
   ```bash
   DATABASE_URL=your-supabase-connection-string
   ```

### Neon (Serverless Postgres)

1. Go to https://neon.tech/
2. Create a project
3. Copy connection string
4. Same steps as Supabase above

## How It Works

### User Flow

```
1. User enters phone number
   ↓
2. System checks database
   ↓
3a. If exists → Load existing wallet
3b. If new → Create CDP wallet + Save to database
   ↓
4. User can now make purchases
   ↓
5. All payments go to their persistent wallet
```

### Database Schema

**user_wallets table:**
```sql
phone_number (unique) → wallet_address → wallet_id → wallet_data
"+15555551234" → "0x742d..." → "abc123..." → {...}
```

### Example Queries

```bash
# List all users
psql x402_payments -c "SELECT phone_number, wallet_address, created_at FROM user_wallets;"

# Find user by phone
psql x402_payments -c "SELECT * FROM user_wallets WHERE phone_number = '+15555551234';"

# Count total users
psql x402_payments -c "SELECT COUNT(*) FROM user_wallets;"
```

## Testing

### Test Flow:

1. Start services:
   ```bash
   # Terminal 1
   cd dummyAgent && npm start
   
   # Terminal 2
   cd paymentSystem && npm run dev
   ```

2. Go to http://localhost:3000

3. Enter phone: `+15555551234`

4. Check database:
   ```bash
   psql x402_payments -c "SELECT * FROM user_wallets;"
   ```

5. Should see your wallet!

6. Try same phone again → Should load existing wallet (not create new one)

## Troubleshooting

### "relation user_wallets does not exist"

Schema not created. Run:
```bash
psql x402_payments < db/schema.sql
```

### "ECONNREFUSED"

PostgreSQL not running. Start it:
```bash
# macOS
brew services start postgresql@15

# Ubuntu
sudo systemctl start postgresql
```

### "password authentication failed"

Update DATABASE_URL with correct credentials:
```bash
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/x402_payments
```

### "Coinbase not configured"

Add CDP credentials to `.env.local`:
```bash
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key
```

## Security Notes

- ⚠️ **wallet_data** contains sensitive information - encrypt in production
- ⚠️ **Never commit** .env.local to git
- ⚠️ Use **SSL** in production (add `?sslmode=require` to DATABASE_URL)
- ⚠️ **Backup** database regularly

## You're Done! 🎉

Users now have **persistent wallets** linked to their phone numbers!

- ✅ One wallet per user
- ✅ Wallet persists across sessions
- ✅ No duplicate wallets
- ✅ Easy to retrieve by phone number

Next: Get test USDC and try making a purchase!

