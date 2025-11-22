# Database Setup

This directory contains the PostgreSQL database schema for storing user wallets.

## Quick Setup

### Option 1: Local PostgreSQL (Recommended for Development)

#### Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Create database
createdb x402_payments

# Or using psql
psql postgres
CREATE DATABASE x402_payments;
\q
```

#### Run Schema

```bash
psql x402_payments < db/schema.sql
```

#### Set DATABASE_URL

Add to `.env.local`:
```bash
DATABASE_URL=postgresql://localhost/x402_payments
```

Or with username/password:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/x402_payments
```

### Option 2: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name x402-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=x402_payments \
  -p 5432:5432 \
  -d postgres:15

# Wait a few seconds for startup, then create schema
docker exec -i x402-postgres psql -U postgres -d x402_payments < db/schema.sql
```

Add to `.env.local`:
```bash
DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/x402_payments
```

### Option 3: Cloud Database (Production)

Use a hosted PostgreSQL service:
- [Supabase](https://supabase.com/) (Free tier available)
- [Neon](https://neon.tech/) (Serverless Postgres)
- [Railway](https://railway.app/)
- [AWS RDS](https://aws.amazon.com/rds/)

Get the connection string and add to `.env.local`:
```bash
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

## Verify Setup

Test your database connection:

```bash
psql $DATABASE_URL -c "SELECT * FROM user_wallets;"
```

Should return empty table (no error).

## Database Schema

### `user_wallets` Table

Stores one CDP wallet per phone number.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment ID |
| phone_number | VARCHAR(20) | User's phone (unique) |
| wallet_id | VARCHAR(255) | CDP wallet ID |
| wallet_address | VARCHAR(255) | Wallet address (0x...) |
| wallet_data | JSONB | Exported wallet data |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### `payments` Table (Optional)

Tracks payment history.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment ID |
| payment_id | UUID | Unique payment ID |
| user_phone | VARCHAR(20) | User's phone |
| user_wallet_address | VARCHAR(255) | User's wallet |
| amount | DECIMAL | Total amount |
| agent_fee | DECIMAL | Agent fee portion |
| product_price | DECIMAL | Product price |
| product_query | TEXT | What they bought |
| transaction_hash | VARCHAR(255) | Blockchain tx hash |
| status | VARCHAR(50) | pending/completed/failed |
| created_at | TIMESTAMP | Creation time |
| completed_at | TIMESTAMP | Completion time |

## Example Queries

### Get user's wallet
```sql
SELECT * FROM user_wallets WHERE phone_number = '+15555551234';
```

### Get all payments for a user
```sql
SELECT * FROM payments WHERE user_phone = '+15555551234' ORDER BY created_at DESC;
```

### Get payment history
```sql
SELECT 
  p.*,
  u.wallet_address
FROM payments p
JOIN user_wallets u ON p.user_phone = u.phone_number
WHERE p.status = 'completed'
ORDER BY p.completed_at DESC
LIMIT 10;
```

## Migrations

To add new columns or tables in the future, create numbered migration files:

```
db/
  001_initial_schema.sql (this file)
  002_add_email_column.sql (future)
  003_add_refunds_table.sql (future)
```

## Backup

### Backup database
```bash
pg_dump x402_payments > backup_$(date +%Y%m%d).sql
```

### Restore from backup
```bash
psql x402_payments < backup_20240101.sql
```

## Security Notes

- ⚠️ **Never commit `.env.local`** - contains DATABASE_URL
- ⚠️ **wallet_data contains sensitive info** - encrypt in production
- ⚠️ **Use SSL in production** - add `?sslmode=require` to DATABASE_URL
- ⚠️ **Limit database user permissions** - only what's needed

