import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createWalletClient, createPublicClient, http } from 'viem';
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

  // Get product price from agent API if not provided
  let productPrice = purchaseRequest.productPrice;
  
  if (!productPrice) {
    // Call agent API to get the price
    try {
      const agentPrice = await getProductPrice(purchaseRequest.query);
      if (!agentPrice) {
    return NextResponse.json(
          { error: 'Could not determine product price from agent' },
      { status: 400 }
    );
      }
      productPrice = agentPrice;
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch product price: ' + error.message },
        { status: 500 }
      );
    }
  }

  // Calculate total payment: agent fee + product cost
  const agentFee = AGENT_FEE;
  const totalAmount = agentFee + productPrice;

  // If no payment provided, return 402 with payment instructions
  if (!paymentProof) {
    const paymentId = crypto.randomUUID();

    // Store pending payment
    pendingPayments.set(paymentId, {
      totalAmount: totalAmount.toFixed(2),
      agentFee: agentFee.toFixed(2),
      productPrice: productPrice.toFixed(2),
      request: purchaseRequest,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      {
        error: 'Payment Required',
        payment: {
          id: paymentId,
          amount: totalAmount.toFixed(6),
          currency: 'ETH',
          token: 'ETH',
          network: 'base-sepolia',
          recipient: MERCHANT_WALLET,
          facilitator: FACILITATOR_URL,
          description: `Agent purchase: ${purchaseRequest.query}`,

          // Breakdown of payment
          breakdown: {
            productPrice: productPrice.toFixed(6),
            agentFee: agentFee.toFixed(6),
            total: totalAmount.toFixed(6),
            walletAddress: MERCHANT_WALLET, // Where to send ETH
          },

          // Payment instructions
          instructions: {
            method: 'nativeTransfer',
            scheme: 'exact',
            verifyEndpoint: `${FACILITATOR_URL}/verify`,
            settleEndpoint: `${FACILITATOR_URL}/settle`,
          },
        },
        message: `Please submit payment of ${totalAmount.toFixed(6)} ETH (${agentFee.toFixed(6)} agent fee + ${productPrice.toFixed(6)} product cost)`,
      },
      { status: 402 }
    );
  }

  // If payment provided, verify it
  const { paymentId, signature, transactionHash } = paymentProof;

  // Check if payment exists
  const pendingPayment = pendingPayments.get(paymentId);
  if (!pendingPayment) {
    return NextResponse.json(
      { error: 'Invalid payment ID' },
      { status: 400 }
    );
  }

  // Verify payment
  const paymentValid = await mockVerifyPayment(paymentProof, pendingPayment);

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

  // Execute the agent workflow (calls external API or falls back to mock)
  const result = await executeAgentWorkflow(purchaseRequest);

  // If agent completed successfully, confirm payment on-chain
  let escrowConfirmation = null;
  if (result.status === 'completed') {
    try {
      escrowConfirmation = await confirmPaymentOnChain(paymentId);
      console.log('✅ Payment confirmed on-chain:', escrowConfirmation);
    } catch (error: any) {
      console.error('❌ Failed to confirm on-chain:', error.message);
      console.warn('⚠️  Payment will auto-refund after 15 minutes if not confirmed');
    }
  }

  // Return successful response with agent results
  return NextResponse.json({
    success: true,
    paymentId,
    amount: pendingPayment.totalAmount,
    agentFee: pendingPayment.agentFee,
    productPrice: pendingPayment.productPrice,
    transactionHash: transactionHash,
    escrowConfirmation,
    result,
  });
}

/**
 * Confirm payment on escrow smart contract
 * Releases funds from escrow to merchant wallet
 */
async function confirmPaymentOnChain(paymentId: string): Promise<any> {
  const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY;
  
  if (!backendPrivateKey) {
    throw new Error('BACKEND_PRIVATE_KEY not configured');
  }

  console.log('📤 Confirming payment on-chain...');
  console.log('   Payment ID:', paymentId);

  const orderId = generateOrderId(paymentId);
  const escrowAddress = getEscrowContractAddress();

  console.log('   Order ID:', orderId);
  console.log('   Escrow Contract:', escrowAddress);

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

  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    status: 'confirmed',
  };
}

/**
 * Get product price from agent API
 * Calls the agent's /agent/execute endpoint to get pricing info
 */
async function getProductPrice(query: string): Promise<number | null> {
  console.log('🔍 Fetching product price from agent for:', query);

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
        query: query,
        metadata: {
          timestamp: new Date().toISOString(),
          priceOnly: true, // Flag to indicate we just want price info
        },
      }),
    });

    if (!response.ok) {
      console.error('❌ Agent API error:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (result.product && result.product.price) {
      const price = typeof result.product.price === 'number' 
        ? result.product.price 
        : parseFloat(result.product.price);
      
      console.log('✅ Got product price from agent:', price);
      return price;
    }

    console.error('❌ Agent response missing product price');
    return null;
  } catch (error: any) {
    console.error('❌ Failed to fetch product price:', error.message);
    return null;
  }
}

/**
 * Mock function to verify payment
 */
async function mockVerifyPayment(
  paymentProof: any,
  pendingPayment: any
): Promise<boolean> {
  // Simulate async verification
  await new Promise((resolve) => setTimeout(resolve, 500));

  // For demo purposes, accept any payment proof with required fields
  if (paymentProof.signature && paymentProof.paymentId) {
    console.log('✅ Payment verified (mock):', {
      paymentId: paymentProof.paymentId,
      totalAmount: pendingPayment.totalAmount,
      agentFee: pendingPayment.agentFee,
      productPrice: pendingPayment.productPrice,
    });
    return true;
  }

  return false;
}

/**
 * Execute agent workflow by calling external API
 * Falls back to mock if AGENT_API_ENDPOINT is not configured or fails
 */
async function executeAgentWorkflow(request: any): Promise<any> {
  console.log('🤖 Executing agent workflow');
  console.log('📝 Request:', request);
  console.log('🔌 Agent API Endpoint:', AGENT_API_ENDPOINT);

  try {
    // Call the external agent API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if configured
    if (AGENT_API_KEY) {
      headers['Authorization'] = `Bearer ${AGENT_API_KEY}`;
    }

    const response = await fetch(AGENT_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: request.query,
        productPrice: request.productPrice,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.error('❌ Agent API error:', response.status, response.statusText);
      throw new Error(`Agent API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Agent workflow completed successfully');
    
    return result;
  } catch (error: any) {
    console.error('❌ Agent API call failed:', error.message);
    console.log('⚠️  Falling back to mock agent response');

    // Fallback to mock response if API fails
    return {
      status: 'completed',
      orderId: `MOCK-${Date.now()}`,
      product: {
        name: request.query,
        price: `$${request.productPrice.toFixed(2)}`,
        vendor: 'Mock Vendor',
        url: 'https://example.com/mock-product',
      },
      proof: {
        type: 'order_confirmation',
        timestamp: new Date().toISOString(),
        note: 'This is a mock response. Configure AGENT_API_ENDPOINT to use real agent.',
      },
      message: 'Mock order placed (Agent API not configured or unavailable)',
    };
  }
}

