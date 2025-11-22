import { NextRequest, NextResponse } from 'next/server';
import { getWalletBalance } from '@/lib/coinbaseWallet';

/**
 * GET /api/wallet/balance?walletId=xxx
 * Get balance of a temporary wallet
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletId = searchParams.get('walletId');

  if (!walletId) {
    return NextResponse.json(
      { error: 'walletId parameter is required' },
      { status: 400 }
    );
  }

  try {
    const balance = await getWalletBalance(walletId);
    
    if (!balance) {
      return NextResponse.json(
        { error: 'Could not fetch wallet balance. Check if Coinbase is configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      walletId,
      balances: balance,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch balance: ' + error.message },
      { status: 500 }
    );
  }
}

