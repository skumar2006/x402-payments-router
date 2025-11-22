import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { supabase } from './db';

const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME || '';
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET || '';
const NETWORK_ID = process.env.NETWORK_ID || 'base-sepolia';

let isConfigured = false;

function configureCoinbase(): boolean {
  if (isConfigured) return true;
  
  if (!CDP_API_KEY_NAME || !CDP_API_KEY_SECRET) {
    console.warn('⚠️  Coinbase CDP credentials not configured.');
    return false;
  }

  try {
    // Coinbase.configure() is a static method that configures globally
    // It returns void, not a Coinbase instance
    Coinbase.configure({
      apiKeyName: CDP_API_KEY_NAME,
      privateKey: CDP_API_KEY_SECRET,
    });
    isConfigured = true;
    console.log('✅ Coinbase SDK configured successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to configure Coinbase SDK:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

export interface UserWallet {
  phone_number: string;
  wallet_id: string;
  wallet_address: string;
  wallet_data: any;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get or create a wallet for a user based on their phone number
 * Returns existing wallet if found, creates new one if not
 */
export async function getOrCreateUserWallet(phoneNumber: string): Promise<{
  walletAddress: string;
  walletId: string;
  isNew: boolean;
} | null> {
  const configured = configureCoinbase();

  if (!configured) {
    console.error('❌ Coinbase not configured');
    return null;
  }

  try {
    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Check if user already has a wallet
    const existingWallet = await getUserWallet(normalizedPhone);
    
    if (existingWallet) {
      console.log('✅ Found existing wallet for user:', normalizedPhone);
      return {
        walletAddress: existingWallet.wallet_address,
        walletId: existingWallet.wallet_id,
        isNew: false,
      };
    }

    // Create new wallet
    console.log('🔄 Creating new wallet for user:', normalizedPhone);
    console.log('🔧 Using network:', NETWORK_ID);
    
    let wallet;
    try {
      // Latest SDK: use Wallet.create() with networkId
      wallet = await Wallet.create({ networkId: NETWORK_ID });
      console.log('✅ Wallet created');
    } catch (error: any) {
      console.error('❌ Wallet creation error:', error);
      throw new Error('Failed to create CDP wallet: ' + (error?.message || 'Unknown error'));
    }
    
    const address = await wallet.getDefaultAddress();
    console.log('✅ Got default address:', address?.getId());
    
    const walletData = wallet.export();
    console.log('✅ Wallet data exported');

    const walletInfo = {
      walletId: wallet.getId() || '',
      walletAddress: address?.getId() || '',
      walletData: walletData,
    };

    // Store in database
    await saveUserWallet(normalizedPhone, walletInfo);

    console.log('✅ Created new wallet for user:', {
      phone: normalizedPhone,
      address: walletInfo.walletAddress,
    });

    return {
      walletAddress: walletInfo.walletAddress,
      walletId: walletInfo.walletId,
      isNew: true,
    };
  } catch (error: any) {
    console.error('❌ Failed to get/create user wallet:', error.message);
    return null;
  }
}

/**
 * Get existing wallet for a phone number
 */
export async function getUserWallet(phoneNumber: string): Promise<UserWallet | null> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is fine
        return null;
      }
      throw error;
    }

    return data as UserWallet;
  } catch (error: any) {
    console.error('❌ Error fetching user wallet:', error.message);
    return null;
  }
}

/**
 * Save new user wallet to database
 */
async function saveUserWallet(
  phoneNumber: string,
  walletInfo: { walletId: string; walletAddress: string; walletData: any }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_wallets')
      .upsert({
        phone_number: phoneNumber,
        wallet_id: walletInfo.walletId,
        wallet_address: walletInfo.walletAddress,
        wallet_data: walletInfo.walletData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'phone_number'
      });

    if (error) throw error;
  } catch (error: any) {
    console.error('❌ Error saving user wallet:', error.message);
    throw error;
  }
}

/**
 * Get wallet by address
 */
export async function getWalletByAddress(address: string): Promise<UserWallet | null> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('wallet_address', address)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is fine
        return null;
      }
      throw error;
    }

    return data as UserWallet;
  } catch (error: any) {
    console.error('❌ Error fetching wallet by address:', error.message);
    return null;
  }
}

/**
 * Get all wallets (for admin purposes)
 */
export async function getAllWallets(): Promise<UserWallet[]> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as UserWallet[]) || [];
  } catch (error: any) {
    console.error('❌ Error fetching all wallets:', error.message);
    return [];
  }
}

