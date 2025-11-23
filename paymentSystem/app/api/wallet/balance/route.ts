import { NextRequest, NextResponse } from 'next/server';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { getUserWallet } from '@/lib/userWallet';

const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME || '';
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_PRIVATE_KEY || '';

let isConfigured = false;

function configureCoinbase(): boolean {
  if (isConfigured) return true;
  
  if (!CDP_API_KEY_NAME || !CDP_API_KEY_SECRET) {
    console.warn('⚠️  Coinbase CDP credentials not configured.');
    return false;
  }

  try {
    Coinbase.configure({
      apiKeyName: CDP_API_KEY_NAME,
      privateKey: CDP_API_KEY_SECRET,
    });
    isConfigured = true;
    return true;
  } catch (error: any) {
    console.error('❌ Failed to configure Coinbase SDK:', error.message);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, walletId } = await request.json();

    if (!phoneNumber && !walletId) {
      return NextResponse.json(
        { error: 'Either phoneNumber or walletId is required' },
        { status: 400 }
      );
    }

    const configured = configureCoinbase();
    if (!configured) {
      return NextResponse.json(
        { error: 'Coinbase SDK not configured' },
        { status: 500 }
      );
    }

    // Get wallet ID from database if phone number provided
    let finalWalletId = walletId;
    if (phoneNumber && !walletId) {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const userWallet = await getUserWallet(normalizedPhone);
      
      if (!userWallet) {
        return NextResponse.json(
          { error: 'No wallet found for this phone number' },
          { status: 404 }
        );
      }
      
      finalWalletId = userWallet.wallet_id;
    }

    console.log('🔄 Fetching balance for wallet:', finalWalletId);

    // Fetch wallet and get balance
    const wallet = await Wallet.fetch(finalWalletId);
    const balances = await wallet.listBalances();

    // Convert balances to a more readable format
    const formattedBalances: Record<string, string> = {};
    for (const [asset, amount] of Object.entries(balances)) {
      formattedBalances[asset] = amount.toString();
    }

    console.log('✅ Wallet balance retrieved:', formattedBalances);

    return NextResponse.json({
      success: true,
      walletId: finalWalletId,
      balances: formattedBalances,
      address: (await wallet.getDefaultAddress())?.getId(),
    });
  } catch (error: any) {
    console.error('❌ Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance', message: error.message },
      { status: 500 }
    );
  }
}
