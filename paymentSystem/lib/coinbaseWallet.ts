import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

// Configuration from environment variables
const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME || '';
const CDP_API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY || '';
const NETWORK_ID = process.env.NETWORK_ID || 'base-sepolia';

// Initialize Coinbase SDK
let coinbaseConfigured = false;

function configureCoinbase() {
  if (coinbaseConfigured) return;
  
  if (!CDP_API_KEY_NAME || !CDP_API_KEY_PRIVATE_KEY) {
    console.warn('⚠️  Coinbase CDP credentials not configured. Temporary wallets will not be created.');
    return;
  }

  try {
    Coinbase.configure({ apiKeyName: CDP_API_KEY_NAME, privateKey: CDP_API_KEY_PRIVATE_KEY });
    coinbaseConfigured = true;
    console.log('✅ Coinbase SDK configured successfully');
  } catch (error: any) {
    console.error('❌ Failed to configure Coinbase SDK:', error.message);
  }
}

/**
 * Create a temporary wallet to receive x402 payment
 * Returns wallet details including the address where funds should be sent
 */
export async function createTemporaryWallet(paymentId: string): Promise<{
  walletId: string;
  address: string;
  network: string;
  createdAt: string;
} | null> {
  configureCoinbase();

  if (!coinbaseConfigured) {
    console.warn('⚠️  Skipping wallet creation - Coinbase not configured');
    return null;
  }

  try {
    console.log('🔄 Creating temporary Coinbase wallet for payment:', paymentId);

    // Create a new wallet on the specified network
    const wallet = await Wallet.create({ networkId: NETWORK_ID });
    
    // Get the default address for the wallet
    const address = await wallet.getDefaultAddress();
    
    const walletDetails = {
      walletId: wallet.getId() || '',
      address: address?.getId() || '',
      network: NETWORK_ID,
      createdAt: new Date().toISOString(),
    };

    console.log('✅ Temporary wallet created:', {
      walletId: walletDetails.walletId,
      address: walletDetails.address,
      network: walletDetails.network,
    });

    return walletDetails;
  } catch (error: any) {
    console.error('❌ Failed to create temporary wallet:', error.message);
    return null;
  }
}

/**
 * Get wallet balance
 * Useful for verifying payment was received
 */
export async function getWalletBalance(walletId: string): Promise<any> {
  configureCoinbase();

  if (!coinbaseConfigured) {
    return null;
  }

  try {
    const wallet = await Wallet.fetch(walletId);
    const balances = await wallet.listBalances();
    return balances;
  } catch (error: any) {
    console.error('❌ Failed to get wallet balance:', error.message);
    return null;
  }
}

/**
 * Transfer funds from temporary wallet to main wallet
 * Can be used to consolidate funds after agent execution
 */
export async function transferFromWallet(
  walletId: string,
  destinationAddress: string,
  amount: number,
  asset: string = 'usdc'
): Promise<boolean> {
  configureCoinbase();

  if (!coinbaseConfigured) {
    return false;
  }

  try {
    console.log('🔄 Transferring funds from temporary wallet:', walletId);
    
    const wallet = await Wallet.fetch(walletId);
    const transfer = await wallet.createTransfer({
      amount: amount,
      assetId: asset,
      destination: destinationAddress,
    });

    await transfer.wait();
    
    console.log('✅ Transfer completed successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to transfer funds:', error.message);
    return false;
  }
}

/**
 * Export wallet data for storage/backup
 * Important: Store this securely!
 */
export async function exportWalletData(walletId: string): Promise<any> {
  configureCoinbase();

  if (!coinbaseConfigured) {
    return null;
  }

  try {
    const wallet = await Wallet.fetch(walletId);
    const walletData = wallet.export();
    return walletData;
  } catch (error: any) {
    console.error('❌ Failed to export wallet:', error.message);
    return null;
  }
}

