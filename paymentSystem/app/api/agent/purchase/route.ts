import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createWalletClient, createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { escrowABI } from '@/lib/escrowABI';
import { generateOrderId, getEscrowContractAddress } from '@/lib/escrowUtils';

// In-memory storage for payment verifications
const pendingPayments = new Map();
const completedPayments = new Map();

// Configuration from environment variables
const AGENT_API_ENDPOINT = process.env.AGENT_API_ENDPOINT || 'http://localhost:8000/agent/execute';
const AGENT_API_KEY = process.env.AGENT_API_KEY || '';
const AGENT_FEE = parseFloat(process.env.AGENT_FEE_ETH || '0.001'); // Changed to ETH
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.x402.org';
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS || '0xYourMerchantWalletAddress';

interface PurchaseRequest {
  request: {
    query: string;
    productPrice?: number; // Optional - will be fetched from agent if not provided
  };
  paymentProof?: {
    paymentId: string;
    signature: string;
    transactionHash: string;
  };
}

export async function POST(request: NextRequest) {
  const body: PurchaseRequest = await request.json();
  const { request: purchaseRequest, paymentProof } = body;

  // If no payment provided, get pricing from x402 agent and return 402
  if (!paymentProof) {
    let x402PaymentDetails = null;
    
    // Call x402 agent to get the 402 response with pricing
    try {
      x402PaymentDetails = await getX402PaymentDetails(purchaseRequest.query);
      if (!x402PaymentDetails) {
        return NextResponse.json(
          { error: 'Could not get payment details from x402 agent' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to call x402 agent: ' + error.message },
        { status: 500 }
      );
    }

    // Use x402 agent's pricing (it already includes everything)
    const totalAmount = parseFloat(x402PaymentDetails.payment.amount);
    const x402PaymentId = x402PaymentDetails.payment.id;
    const x402OrderId = x402PaymentDetails.payment.orderId;
    const paymentId = x402PaymentId || crypto.randomUUID();

    // Store pending payment with x402 details
    pendingPayments.set(paymentId, {
      totalAmount: totalAmount.toFixed(6),
      x402PaymentId: x402PaymentId,
      x402OrderId: x402OrderId,
      request: purchaseRequest,
      timestamp: Date.now(),
    });

    const escrowAddress = getEscrowContractAddress();

    return NextResponse.json(
      {
        error: 'Payment Required',
        payment: {
          id: paymentId,
          amount: totalAmount.toFixed(6),
          currency: 'ETH',
          token: 'ETH',
          network: 'base-sepolia',
          recipient: escrowAddress, // Pay to escrow, not merchant
          orderId: x402OrderId, // Include orderId for escrow
          facilitator: FACILITATOR_URL,
          description: `Agent purchase: ${purchaseRequest.query}`,

          // Breakdown from x402 agent
          breakdown: x402PaymentDetails?.payment.breakdown || {
            total: totalAmount.toFixed(6),
          },

          // Payment instructions
          instructions: {
            method: 'nativeTransfer',
            scheme: 'exact',
            verifyEndpoint: `${FACILITATOR_URL}/verify`,
            settleEndpoint: `${FACILITATOR_URL}/settle`,
          },
        },
        message: `Please submit payment of ${totalAmount.toFixed(6)} ETH to escrow`,
      },
      { status: 402 }
    );
  }

  // Payment proof provided - verify it
  const { paymentId, signature, transactionHash } = paymentProof;

  console.log('💳 Payment proof received');
  console.log('   Payment ID:', paymentId);
  console.log('   Transaction Hash:', transactionHash);

  // Check if payment exists in our storage
  const pendingPayment = pendingPayments.get(paymentId);
  if (!pendingPayment) {
    console.error('❌ Payment ID not found in pending payments');
    console.error('   Available payment IDs:', Array.from(pendingPayments.keys()));
    return NextResponse.json(
      { error: 'Invalid payment ID' },
      { status: 400 }
    );
  }

  console.log('✅ Found pending payment');
  console.log('   x402 Order ID:', pendingPayment.x402OrderId);
  console.log('   Amount:', pendingPayment.totalAmount, 'ETH');

  // Wait a moment for blockchain state to update
  console.log('⏳ Waiting 2 seconds for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify payment using the x402 orderId from when we first got the 402 response
  const paymentValid = await mockVerifyPayment(paymentProof, pendingPayment, pendingPayment.x402OrderId);

  if (!paymentValid) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 402 }
    );
  }

  // Payment verified! Move to completed
  console.log('✅ Payment verified for paymentId:', paymentId);
  
  pendingPayments.delete(paymentId);
  completedPayments.set(paymentId, {
    ...pendingPayment,
    paymentProof,
    completedAt: Date.now(),
  });

  // Execute the agent workflow (calls x402 agent with payment proof)
  const result = await executeAgentWorkflow(purchaseRequest, {
    paymentId: pendingPayment.x402PaymentId || paymentId,
    transactionHash: transactionHash,
  });

  // Check if x402 agent completed successfully
  // The x402 agent already confirms the payment on-chain, so we just check the result
  let escrowConfirmation = result.confirmationHash || null;
  let escrowStatus = 'pending'; // Track the actual escrow status
  
  if (result.status === 'completed' && result.transactionId && result.confirmationHash) {
    // x402 agent successfully completed purchase and confirmed on-chain
    escrowStatus = 'confirmed';
    console.log('✅ x402 agent completed with Amazon Transaction ID:', result.transactionId);
    console.log('✅ x402 agent confirmed payment on-chain:', result.confirmationHash);
  } else if (result.status === 'completed' && result.transactionId && !result.confirmationHash) {
    // Agent completed purchase but didn't confirm on-chain
    escrowStatus = 'no_confirmation';
    console.warn('⚠️  x402 agent completed purchase but did not confirm on-chain');
    console.warn('⚠️  Payment will remain in escrow and can be refunded after 5 minutes');
  } else if (result.status === 'completed' && !result.transactionId) {
    // Agent completed but didn't return transaction ID
    escrowStatus = 'no_transaction_id';
    console.warn('⚠️  x402 agent completed but did not return Amazon transaction ID');
    console.warn('⚠️  Payment will remain in escrow and can be refunded after 5 minutes');
  } else {
    // Agent didn't complete successfully
    escrowStatus = 'agent_failed';
    console.error('❌ x402 agent workflow failed');
    console.warn('⚠️  Payment will remain in escrow and can be refunded after 5 minutes');
  }

  // Return successful response with agent results
  return NextResponse.json({
    success: true,
    paymentId,
    amount: pendingPayment.totalAmount,
    transactionHash: transactionHash,
    escrowConfirmation,
    escrowStatus, // Tell frontend the actual status
    agentTransactionId: result.transactionId || null, // Amazon transaction ID
    result,
  });
}

/**
 * Confirm payment on escrow smart contract
 * Releases funds from escrow to merchant wallet
 * @param paymentId - The payment ID from our system
 * @param agentTransactionId - The transaction ID returned by the agent as proof of purchase
 */
async function confirmPaymentOnChain(paymentId: string, agentTransactionId: string): Promise<any> {
  const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY;
  
  if (!backendPrivateKey) {
    throw new Error('BACKEND_PRIVATE_KEY not configured');
  }

  console.log('📤 Confirming payment on-chain...');
  console.log('   Payment ID:', paymentId);
  console.log('   Agent Transaction ID:', agentTransactionId);

  const orderId = generateOrderId(paymentId);
  const escrowAddress = getEscrowContractAddress();

  console.log('   Order ID:', orderId);
  console.log('   Escrow Contract:', escrowAddress);
  console.log('   🔐 Proof of Purchase: Agent returned transaction ID -', agentTransactionId);

  const account = privateKeyToAccount(`0x${backendPrivateKey}` as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const hash = await walletClient.writeContract({
    address: escrowAddress,
    abi: escrowABI,
    functionName: 'confirmPayment',
    args: [orderId],
  });

  console.log('   Transaction sent:', hash);
  console.log('   Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  console.log('✅ Funds released to merchant!');
  console.log('   Block:', receipt.blockNumber);
  console.log('   💰 Payment confirmed based on agent transaction ID:', agentTransactionId);

  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    status: 'confirmed',
    agentTransactionId,
  };
}

/**
 * Get payment details from x402 agent
 * The x402 agent returns a 402 Payment Required with all payment info
 */
async function getX402PaymentDetails(product: string): Promise<any | null> {
  console.log('🔍 Calling x402 agent to get payment details for:', product);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (AGENT_API_KEY) {
      headers['Authorization'] = `Bearer ${AGENT_API_KEY}`;
    }

    const response = await fetch(AGENT_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product: product, // x402 agent expects "product"
      }),
    });

    // x402 agent returns 402 Payment Required with pricing
    if (response.status === 402) {
      const result = await response.json();
      console.log('✅ Got 402 response from x402 agent');
      console.log('   Payment ID:', result.payment?.id);
      console.log('   Amount:', result.payment?.amount, 'ETH');
      console.log('   Order ID:', result.payment?.orderId);
      return result;
    }

    // If not 402, something went wrong
    console.error('❌ Unexpected response from x402 agent:', response.status);
    const errorData = await response.json().catch(() => ({}));
    console.error('   Response:', errorData);
    return null;
  } catch (error: any) {
    console.error('❌ Failed to call x402 agent:', error.message);
    return null;
  }
}

/**
 * Verify payment by checking the escrow contract
 */
async function mockVerifyPayment(
  paymentProof: any,
  pendingPayment: any,
  x402OrderId?: string
): Promise<boolean> {
  console.log('🔍 Verifying payment on escrow contract...');
  
  if (!paymentProof.signature || !paymentProof.paymentId) {
    console.error('❌ Missing payment proof fields');
    return false;
  }

  try {
    // Use x402 orderId if provided, otherwise generate from paymentId
    const orderId = x402OrderId || generateOrderId(paymentProof.paymentId);
    const escrowAddress = getEscrowContractAddress();
    
    console.log('   Using Order ID:', orderId);
    console.log('   (from x402 agent)' + (x402OrderId ? ' ✅' : ' ❌ FALLBACK'));

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Read payment details from escrow contract
    const paymentData = await publicClient.readContract({
      address: escrowAddress,
      abi: escrowABI,
      functionName: 'getPayment',
      args: [orderId],
    }) as [string, bigint, bigint, boolean];

    const [payer, amount, timestamp, completed] = paymentData;

    console.log('📊 Escrow contract payment status:', {
      orderId,
      payer,
      amount: formatEther(amount),
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      completed,
    });

    // Check if payment exists (amount > 0) and not completed
    if (amount === 0n) {
      console.error('❌ Payment not found in escrow contract');
      return false;
    }

    if (completed) {
      console.error('❌ Payment already completed');
      return false;
    }

    console.log('✅ Payment verified in escrow contract:', {
      paymentId: paymentProof.paymentId,
      amount: formatEther(amount),
      payer,
    });

    return true;
  } catch (error: any) {
    console.error('❌ Failed to verify payment on escrow:', error.message);
    return false;
  }
}

/**
 * Execute agent workflow by calling x402 agent with payment proof
 */
async function executeAgentWorkflow(request: any, paymentProof: any): Promise<any> {
  console.log('🤖 Executing x402 agent workflow');
  console.log('📝 Product:', request.query);
  console.log('💳 Payment Proof:', paymentProof);
  console.log('🔌 x402 Agent Endpoint:', AGENT_API_ENDPOINT);

  try {
    // Call the x402 agent with payment proof
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (AGENT_API_KEY) {
      headers['Authorization'] = `Bearer ${AGENT_API_KEY}`;
    }

    const response = await fetch(AGENT_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product: request.query, // x402 agent expects "product"
        paymentProof: paymentProof,
      }),
    });

    if (!response.ok) {
      console.error('❌ x402 agent error:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('   Error response:', errorData);
      throw new Error(`x402 agent returned ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ x402 agent completed successfully');
    console.log('   Amazon Transaction ID:', result.amazonTransactionId);
    console.log('   Confirmation Hash:', result.confirmationHash);
    
    // Return in format that matches our expected structure
    return {
      status: result.success ? 'completed' : 'failed',
      transactionId: result.amazonTransactionId, // This is the proof!
      confirmationHash: result.confirmationHash,
      product: result.product,
      message: result.message,
    };
  } catch (error: any) {
    console.error('❌ x402 agent call failed:', error.message);
    
    // Return failed status (don't fallback to mock)
    return {
      status: 'failed',
      error: error.message,
      message: 'x402 agent failed to complete purchase',
    };
  }
}

