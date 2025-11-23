import { NextRequest, NextResponse } from 'next/server';
import { logTransaction } from '@/lib/transactionLogger';

/**
 * Coinbase Onramp API - Create Apple Pay Order
 * https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/apple-pay-onramp-api
 * 
 * NOTE: Onramp API uses DIFFERENT credentials than CDP SDK
 * You need to request access from Coinbase: https://calendar.app.google/BLn6fzaz2aCZGvLu7
 */

// Onramp API credentials (DIFFERENT from CDP SDK keys!)
const ONRAMP_APP_ID = process.env.COINBASE_ONRAMP_APP_ID || '';
const ONRAMP_API_KEY = process.env.COINBASE_ONRAMP_API_KEY || '';

interface CreateOrderRequest {
  destinationWalletAddress: string;
  partnerUserId: string; // phone number or user ID
  email: string;
  phoneNumber: string;
  assetSymbol?: string; // Default: USDC
  amount?: string; // Amount in fiat (USD)
  network?: string; // Default: base
  domain?: string; // Required for web apps
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    const {
      destinationWalletAddress,
      partnerUserId,
      email,
      phoneNumber,
      assetSymbol = 'USDC',
      amount = '10',
      network = 'base',
      domain,
    } = body;

    // Check if Onramp API is configured
    if (!ONRAMP_APP_ID || !ONRAMP_API_KEY) {
      console.error('❌ Coinbase Onramp API not configured');
      return NextResponse.json(
        { 
          error: 'Coinbase Onramp API not configured',
          message: 'Please set COINBASE_ONRAMP_APP_ID and COINBASE_ONRAMP_API_KEY environment variables',
          instructions: 'Contact Coinbase to get Onramp API access: https://calendar.app.google/BLn6fzaz2aCZGvLu7'
        },
        { status: 503 }
      );
    }

    // Validate required fields
    if (!destinationWalletAddress || !partnerUserId || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: destinationWalletAddress, partnerUserId, email, phoneNumber' },
        { status: 400 }
      );
    }

    // Normalize phone number - remove spaces, dashes, parentheses
    let normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add +1 if not present
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = normalizedPhone.startsWith('1') ? '+' + normalizedPhone : '+1' + normalizedPhone;
    }
    
    // Validate phone number format (US only for Apple Pay)
    const phoneRegex = /^\+1\d{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { 
          error: 'Invalid phone number format. Must be US number with 10 digits.',
          example: 'Valid formats: +12345678901, 12345678901, (234) 567-8901'
        },
        { status: 400 }
      );
    }

    // For sandbox testing, prefix partnerUserId with 'sandbox-'
    const isSandbox = process.env.NEXT_PUBLIC_ENVIRONMENT === 'sandbox';
    const finalPartnerUserId = isSandbox ? `sandbox-${partnerUserId}` : partnerUserId;

    // Prepare request body for Coinbase API
    const onrampRequestBody = {
      partner_user_id: finalPartnerUserId,
      destination_wallets: [
        {
          address: destinationWalletAddress,
          blockchains: [network],
          assets: [assetSymbol],
        },
      ],
      purchase_currency: 'USD',
      default_network: network,
      purchase_amount: parseFloat(amount),
      user_verified_email: email,
      user_verified_phone_number: normalizedPhone, // Use normalized phone
      ...(domain && { domain }), // Include domain for web apps
    };

    console.log('🔄 Creating Coinbase Onramp order:', {
      partnerUserId: finalPartnerUserId,
      destinationAddress: destinationWalletAddress,
      amount,
      network,
      isSandbox,
    });

    // Call Coinbase Onramp API
    // Authentication: Use X-CB-APPID and X-CB-APIKEY headers
    const response = await fetch('https://api.developer.coinbase.com/onramp/v2/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CB-APPID': ONRAMP_APP_ID,
        'X-CB-APIKEY': ONRAMP_API_KEY,
      },
      body: JSON.stringify(onrampRequestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Coinbase API error:', data);
      return NextResponse.json(
        { error: 'Failed to create onramp order', details: data },
        { status: response.status }
      );
    }

    console.log('✅ Onramp order created:', data.id);

    // Log the onramp order creation
    await logTransaction({
      transactionType: 'onramp_created',
      status: 'pending',
      transactionId: data.id,
      userIdentifier: email,
      walletAddress: destinationWalletAddress,
      amount: parseFloat(data.purchase_amount || amount),
      currency: data.purchase_currency || 'USD',
      description: `Coinbase Onramp order created for ${assetSymbol} on ${network}`,
      metadata: {
        orderId: data.id,
        partnerUserId: finalPartnerUserId,
        phoneNumber: normalizedPhone,
        email: email,
        destinationWalletAddress: destinationWalletAddress,
        network: network,
        assetSymbol: assetSymbol,
        paymentLinkUrl: data.payment_link_url,
        orderStatus: data.status,
      },
    });

    // Return the payment link and order details
    return NextResponse.json({
      success: true,
      orderId: data.id,
      paymentLinkUrl: data.payment_link_url,
      status: data.status,
      amount: data.purchase_amount,
      currency: data.purchase_currency,
      network: data.default_network,
    });
  } catch (error: any) {
    console.error('❌ Error creating onramp order:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check order status
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId parameter' },
        { status: 400 }
      );
    }

    // Check if Onramp API is configured
    if (!ONRAMP_APP_ID || !ONRAMP_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Coinbase Onramp API not configured',
          instructions: 'Contact Coinbase to get Onramp API access'
        },
        { status: 503 }
      );
    }

    // Call Coinbase API to get order status
    const response = await fetch(
      `https://api.developer.coinbase.com/onramp/v2/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'X-CB-APPID': ONRAMP_APP_ID,
          'X-CB-APIKEY': ONRAMP_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Coinbase API error:', data);
      return NextResponse.json(
        { error: 'Failed to get order status', details: data },
        { status: response.status }
      );
    }

    // If order is completed, log it
    if (data.status === 'completed' || data.status === 'success') {
      await logTransaction({
        transactionType: 'onramp_completed',
        status: 'success',
        transactionId: data.id,
        transactionHash: data.blockchain_tx_id || undefined,
        walletAddress: data.destination_wallets?.[0]?.address,
        amount: parseFloat(data.purchase_amount || '0'),
        currency: data.purchase_currency || 'USD',
        description: `Coinbase Onramp order completed`,
        metadata: {
          orderId: data.id,
          orderStatus: data.status,
          networkFee: data.network_fee,
          coinbaseFee: data.coinbase_fee,
          totalFee: data.total_fee,
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error: any) {
    console.error('❌ Error fetching order status:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

