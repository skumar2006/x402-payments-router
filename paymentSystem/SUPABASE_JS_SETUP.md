# ✅ Supabase JS Client Setup

The system has been updated to use **Supabase JS Client** instead of PostgreSQL direct connection!

## What Changed:

### 1. Installed Supabase JS SDK:
```bash
npm install @supabase/supabase-js
```

### 2. Updated Database Connection:
- ❌ **Old**: Used `pg` package with `DATABASE_URL` (PostgreSQL connection string)
- ✅ **New**: Uses `@supabase/supabase-js` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Files Modified:
- `lib/db.ts` - Now exports Supabase client instead of pg Pool
- `lib/userWallet.ts` - All database queries converted to Supabase JS syntax

## How to Configure:

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **"Settings"** (gear icon, bottom left)
3. Go to **"API"** section
4. Copy these two values:

```
Project URL: https://leufuzybxpobtzsmkpxv.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Add to `.env.local`

Open `paymentSystem/.env.local` and add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://leufuzybxpobtzsmkpxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-full-key-here

# Coinbase CDP API Keys
CDP_API_KEY_NAME=organizations/YOUR-ORG-ID/apiKeys/YOUR-KEY-ID
CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----
YOUR FULL PRIVATE KEY HERE (with newlines)
-----END EC PRIVATE KEY-----

# Network Configuration
NETWORK_ID=base-sepolia

# Agent Configuration
AGENT_API_URL=http://localhost:8000/price
AGENT_FEE_ETH=0.001

# Node Environment
NODE_ENV=development
```

### Step 3: Verify Configuration

Run the diagnostic script:

```bash
cd paymentSystem
node check-config.js
```

You should see:
```
✅ NEXT_PUBLIC_SUPABASE_URL: SET
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: SET
✅ CDP_API_KEY_NAME: SET
✅ CDP_API_KEY_SECRET: SET
```

### Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C if running)
# Then restart:
npm run dev
```

## Benefits of Supabase JS Client:

✅ **No connection pooling issues** - Supabase handles it
✅ **Better error messages** - More descriptive errors
✅ **Automatic retries** - Built-in retry logic
✅ **Real-time capabilities** - Can add subscriptions later
✅ **Type safety** - Better TypeScript support
✅ **Simpler setup** - No need for connection strings or SSL config

## Database Queries Converted:

### Before (PostgreSQL):
```typescript
const client = await pool.connect();
const result = await client.query('SELECT * FROM user_wallets WHERE phone_number = $1', [phoneNumber]);
client.release();
```

### After (Supabase JS):
```typescript
const { data, error } = await supabase
  .from('user_wallets')
  .select('*')
  .eq('phone_number', phoneNumber)
  .single();
```

Much cleaner! 🎉

## Testing:

Once configured, test the flow:

1. Go to http://localhost:3000
2. Enter your phone number
3. System creates a CDP wallet
4. Check Supabase dashboard → **Table Editor** → `user_wallets`
5. You should see your new wallet entry!

## Troubleshooting:

### Error: "Failed to create wallet"
- Check that **both** Supabase and CDP credentials are set
- Run `node check-config.js` to verify

### Error: "PGRST116" or "No rows returned"
- This is **normal** when no wallet exists yet
- The code handles this gracefully

### Table doesn't exist?
- Make sure you created the `user_wallets` table in Supabase
- See `SUPABASE_MIGRATION.md` for SQL schema

---

**You're now using Supabase JS Client!** 🚀 Much simpler and more reliable than direct PostgreSQL connections.

