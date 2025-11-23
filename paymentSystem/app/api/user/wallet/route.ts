import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserWallet } from '@/lib/userWallet';

/**
 * POST /api/user/wallet
 * Get or create a wallet for a user based on phone number
 */
export async function POST(request: NextRequest) {
  try {
    let { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number - remove spaces, dashes, parentheses
    phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add +1 if not present
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.startsWith('1') ? '+' + phoneNumber : '+1' + phoneNumber;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!phoneRegex.test(normalizedPhone) && normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Get or create wallet
    const wallet = await getOrCreateUserWallet(phoneNumber);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Failed to create wallet. Check if Coinbase CDP is configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: {
        address: wallet.walletAddress,
        walletId: wallet.walletId,
        isNew: wallet.isNew,
      },
      message: wallet.isNew
        ? 'New wallet created successfully!'
        : 'Welcome back! Your existing wallet has been loaded.',
    });
  } catch (error: any) {
    console.error('❌ Error in wallet creation:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

