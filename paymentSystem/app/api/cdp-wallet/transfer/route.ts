import { NextRequest, NextResponse } from 'next/server';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { getUserWallet } from '@/lib/userWallet';
import { getEscrowContractAddress } from '@/lib/escrowUtils';

const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME || '';
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_PRIVATE_KEY || '';
const NETWORK_ID = process.env.NETWORK_ID || 'base-sepolia';

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

interface TransferRequest {
  phoneNumber: string;
  amount: string; // Amount in ETH
  orderId: string; // For escrow payment
  assetSymbol?: string; // Default: ETH
}

/**
 * Transfer funds from user's CDP wallet to escrow contract
 * This enables payment without requiring external wallet connection
 */
export async function POST(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json();
    const { phoneNumber, amount, orderId, assetSymbol = 'ETH' } = body;

    if (!phoneNumber || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, amount, orderId' },
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

    // Get user's wallet from database
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const userWalletRecord = await getUserWallet(normalizedPhone);
    
    if (!userWalletRecord) {
      return NextResponse.json(
        { error: 'No wallet found for this phone number' },
        { status: 404 }
      );
    }

    console.log('🔄 Processing CDP wallet transfer:', {
      phoneNumber: normalizedPhone,
      amount,
      orderId,
      walletId: userWalletRecord.wallet_id,
    });

    // Import the wallet from stored data
    const wallet = await Wallet.import(userWalletRecord.wallet_data);
    
    console.log('✅ Wallet imported');

    // Check wallet balance before transfer
    const balances = await wallet.listBalances();
    console.log('💰 Current wallet balances:', balances);

    // Get escrow contract address
    const escrowAddress = getEscrowContractAddress();

    // For escrow payment, we need to call the contract's createPayment function
    // But CDP SDK doesn't directly support contract interaction like ethers.js
    // Instead, we'll do a simple transfer first, then enhance later with contract calls

    // TODO: Implement contract interaction via CDP SDK or use ethers.js
    // For now, let's transfer ETH directly to escrow

    // Note: The CDP SDK's transfer method signature:
    // transfer(amount: string | number, assetId: string, destination: string)
    
    try {
      console.log('📤 Initiating transfer to escrow...');
      
      const transfer = await wallet.createTransfer({
        amount: parseFloat(amount),
        assetId: assetSymbol,
        destination: escrowAddress,
        // Note: We can't directly call createPayment with orderId through simple transfer
        // We would need to use invoke contract method
      });

      // Wait for transfer to complete
      await transfer.wait();

      const txHash = transfer.getTransactionHash();
      
      console.log('✅ Transfer completed:', {
        transactionHash: txHash,
        amount,
        destination: escrowAddress,
      });

      return NextResponse.json({
        success: true,
        transactionHash: txHash,
        amount,
        destination: escrowAddress,
        orderId,
        message: 'Transfer completed successfully',
      });
    } catch (transferError: any) {
      console.error('❌ Transfer failed:', transferError);
      return NextResponse.json(
        { 
          error: 'Transfer failed', 
          message: transferError.message,
          details: 'Insufficient balance or network error'
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error processing CDP wallet transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Invoke escrow contract's createPayment function from CDP wallet
 */
export async function PUT(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json();
    const { phoneNumber, amount, orderId } = body;

    if (!phoneNumber || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, amount, orderId' },
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

    // Get user's wallet from database
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    const userWalletRecord = await getUserWallet(normalizedPhone);
    
    if (!userWalletRecord) {
      return NextResponse.json(
        { error: 'No wallet found for this phone number' },
        { status: 404 }
      );
    }

    console.log('🔄 Invoking escrow contract from CDP wallet:', {
      phoneNumber: normalizedPhone,
      amount,
      orderId,
    });

    // Import the wallet
    const wallet = await Wallet.import(userWalletRecord.wallet_data);
    
    const escrowAddress = getEscrowContractAddress();

    // Invoke the contract's createPayment function
    // CDP SDK method: invokeContract
    const invocation = await wallet.invokeContract({
      contractAddress: escrowAddress,
      method: 'createPayment',
      args: {
        orderId: orderId,
      },
      amount: parseFloat(amount),
      assetId: 'eth',
    });

    await invocation.wait();

    const txHash = invocation.getTransactionHash();

    console.log('✅ Contract invocation completed:', {
      transactionHash: txHash,
      orderId,
    });

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      orderId,
      amount,
      message: 'Escrow payment created successfully',
    });
  } catch (error: any) {
    console.error('❌ Error invoking contract:', error);
    return NextResponse.json(
      { error: 'Contract invocation failed', message: error.message },
      { status: 500 }
    );
  }
}

