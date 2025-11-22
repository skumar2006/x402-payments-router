import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory storage for payment verifications
const pendingPayments = new Map();
const completedPayments = new Map();

// Mock facilitator configuration
const FACILITATOR_URL = 'https://facilitator.x402.org';
const MERCHANT_WALLET = '0xYourMerchantWalletAddress';

// Agent service fee (fixed)
const AGENT_FEE = 2.00; // $2 USDC for agent work

interface PurchaseRequest {
  request: {
    query: string;
    productPrice: number;
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

  // Validate product price
  const productPrice = purchaseRequest.productPrice;
  if (!productPrice || productPrice <= 0) {
    return NextResponse.json(
      { error: 'Invalid product price' },
      { status: 400 }
    );
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
          amount: totalAmount.toFixed(2),
          currency: 'USDC',
          token: 'USDC',
          network: 'base',
          recipient: MERCHANT_WALLET,
          facilitator: FACILITATOR_URL,
          description: `Agent purchase: ${purchaseRequest.query}`,

          // Breakdown of payment
          breakdown: {
            productPrice: productPrice.toFixed(2),
            agentFee: agentFee.toFixed(2),
            total: totalAmount.toFixed(2),
          },

          // Payment instructions
          instructions: {
            method: 'transferWithAuthorization',
            scheme: 'exact',
            verifyEndpoint: `${FACILITATOR_URL}/verify`,
            settleEndpoint: `${FACILITATOR_URL}/settle`,
          },
        },
        message: `Please submit payment of ${totalAmount.toFixed(2)} USDC (${agentFee.toFixed(2)} agent fee + ${productPrice.toFixed(2)} product cost)`,
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
  pendingPayments.delete(paymentId);
  completedPayments.set(paymentId, {
    ...pendingPayment,
    paymentProof,
    completedAt: Date.now(),
  });

  // Execute the mock agent workflow
  const result = await executeMockAgentWorkflow(purchaseRequest);

  // Return successful response with agent results
  return NextResponse.json({
    success: true,
    paymentId,
    amount: pendingPayment.totalAmount,
    agentFee: pendingPayment.agentFee,
    productPrice: pendingPayment.productPrice,
    result,
  });
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
 * Mock purchasing agent - simulates workflow execution
 */
async function executeMockAgentWorkflow(request: any): Promise<any> {
  // Simulate agent processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('🤖 Agent executing purchase workflow');
  console.log('📝 Request:', request);

  // Return mock purchase result
  return {
    status: 'completed',
    orderId: `AMZ-${Date.now()}`,
    product: {
      name: request.query,
      price: `$${request.productPrice.toFixed(2)}`,
      vendor: 'Amazon',
      url: 'https://amazon.com/example-product',
    },
    proof: {
      type: 'order_confirmation',
      timestamp: new Date().toISOString(),
      screenshot: 'base64_encoded_screenshot_placeholder',
    },
    message: 'Order placed successfully! Estimated delivery: 2-3 days',
  };
}

