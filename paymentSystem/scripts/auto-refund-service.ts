/**
 * Auto-Refund Service
 * 
 * Runs every 30 seconds and checks for expired payments in the escrow contract.
 * Automatically triggers refunds for payments that have exceeded the 5-minute timeout.
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { escrowABI } from '../lib/escrowABI';
import { getEscrowContractAddress } from '../lib/escrowUtils';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const ESCROW_ADDRESS = getEscrowContractAddress();
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;
const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const CHECK_INTERVAL = 30000; // 30 seconds

// Track payments we've seen to avoid spam
const processedPayments = new Set<string>();
const failedAttempts = new Map<string, number>();
const MAX_RETRY_ATTEMPTS = 3;

console.log('🤖 Auto-Refund Service Starting...');
console.log(`📍 Escrow Contract: ${ESCROW_ADDRESS}`);
console.log(`⏱️  Check Interval: ${CHECK_INTERVAL / 1000}s`);
console.log(`🔗 RPC: ${RPC_URL}\n`);

if (!BACKEND_PRIVATE_KEY) {
  console.error('❌ BACKEND_PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

const account = privateKeyToAccount(`0x${BACKEND_PRIVATE_KEY}` as `0x${string}`);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC_URL),
});

/**
 * Get all PaymentCreated events from the contract
 */
async function getPaymentCreatedEvents() {
  try {
    // Get events from the last 10,000 blocks (approximately last 5.5 hours on Base)
    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock = latestBlock - 10000n;

    const logs = await publicClient.getLogs({
      address: ESCROW_ADDRESS,
      event: {
        type: 'event',
        name: 'PaymentCreated',
        inputs: [
          { type: 'bytes32', name: 'orderId', indexed: true },
          { type: 'address', name: 'payer', indexed: false },
          { type: 'uint256', name: 'amount', indexed: false },
        ],
      },
      fromBlock,
      toBlock: 'latest',
    });

    return logs.map(log => ({
      orderId: log.args.orderId as `0x${string}`,
      payer: log.args.payer as string,
      amount: log.args.amount as bigint,
      blockNumber: log.blockNumber,
    }));
  } catch (error: any) {
    console.error('❌ Error fetching events:', error.message);
    return [];
  }
}

/**
 * Check if a payment is expired and needs refund
 */
async function checkPaymentStatus(orderId: `0x${string}`) {
  try {
    const paymentData = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: escrowABI,
      functionName: 'getPayment',
      args: [orderId],
    }) as [string, bigint, bigint, boolean];

    const [payer, amount, timestamp, completed] = paymentData;

    // Payment doesn't exist or is already completed
    if (amount === 0n || completed) {
      return null;
    }

    // Check if expired
    const currentTime = Math.floor(Date.now() / 1000);
    const TIMEOUT = 5 * 60; // 5 minutes in seconds
    const expirationTime = Number(timestamp) + TIMEOUT;

    if (currentTime >= expirationTime) {
      return {
        orderId,
        payer,
        amount,
        timestamp: Number(timestamp),
        expired: true,
      };
    }

    return {
      orderId,
      payer,
      amount,
      timestamp: Number(timestamp),
      expired: false,
    };
  } catch (error: any) {
    // Payment might not exist yet, that's ok
    return null;
  }
}

/**
 * Trigger refund for an expired payment
 */
async function triggerRefund(orderId: `0x${string}`, payer: string, amount: bigint) {
  const orderIdStr = orderId.toString();

  // Check if we've already processed this
  if (processedPayments.has(orderIdStr)) {
    return;
  }

  // Check retry attempts
  const attempts = failedAttempts.get(orderIdStr) || 0;
  if (attempts >= MAX_RETRY_ATTEMPTS) {
    console.log(`⚠️  Max retry attempts reached for ${orderIdStr.slice(0, 10)}...`);
    return;
  }

  try {
    console.log(`\n🔄 Triggering refund for expired payment...`);
    console.log(`   Order ID: ${orderIdStr.slice(0, 10)}...`);
    console.log(`   Payer: ${payer}`);
    console.log(`   Amount: ${(Number(amount) / 1e18).toFixed(6)} ETH`);

    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: escrowABI,
      functionName: 'refundExpiredPayment',
      args: [orderId],
    });

    console.log(`   📤 Transaction sent: ${hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    console.log(`   ✅ Refund successful!`);
    console.log(`   🔗 https://sepolia.basescan.org/tx/${hash}`);

    // Mark as processed
    processedPayments.add(orderIdStr);
    failedAttempts.delete(orderIdStr);
  } catch (error: any) {
    console.error(`   ❌ Refund failed: ${error.message}`);
    
    // Increment retry count
    failedAttempts.set(orderIdStr, attempts + 1);
    
    // If it's "Already completed" or "Payment not found", mark as processed to stop retrying
    if (error.message.includes('Already completed') || error.message.includes('Payment not found')) {
      console.log(`   ℹ️  Payment already processed, marking as complete`);
      processedPayments.add(orderIdStr);
      failedAttempts.delete(orderIdStr);
    }
  }
}

/**
 * Main check loop
 */
async function checkAndRefund() {
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking for expired payments...`);

  try {
    // Get all payment created events
    const events = await getPaymentCreatedEvents();
    console.log(`   Found ${events.length} total payment events`);

    let expiredCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    // Check each payment
    for (const event of events) {
      const status = await checkPaymentStatus(event.orderId);
      
      if (!status) {
        completedCount++;
        continue;
      }

      if (status.expired) {
        expiredCount++;
        await triggerRefund(status.orderId, status.payer, status.amount);
      } else {
        activeCount++;
        const timeLeft = (Number(status.timestamp) + 300) - Math.floor(Date.now() / 1000);
        if (activeCount <= 3) { // Only log first 3 to avoid spam
          console.log(`   ⏳ Active payment: ${status.orderId.toString().slice(0, 10)}... (${Math.max(0, Math.floor(timeLeft / 60))}m ${Math.max(0, timeLeft % 60)}s remaining)`);
        }
      }
    }

    console.log(`   📊 Summary: ${expiredCount} expired (refunded), ${activeCount} active, ${completedCount} completed`);
  } catch (error: any) {
    console.error(`❌ Check cycle error: ${error.message}`);
  }
}

/**
 * Start the service
 */
async function start() {
  console.log('✅ Service started successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Run immediately
  await checkAndRefund();

  // Then run every 30 seconds
  setInterval(checkAndRefund, CHECK_INTERVAL);
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down auto-refund service...');
  console.log('✅ Service stopped\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down auto-refund service...');
  console.log('✅ Service stopped\n');
  process.exit(0);
});

// Start the service
start().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

