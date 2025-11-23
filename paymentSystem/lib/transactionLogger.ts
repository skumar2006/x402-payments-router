/**
 * Transaction Logger Utility
 * Logs all completed transactions to Supabase transaction_logs table
 */

import { supabase } from './db';

export type TransactionType = 
  | 'payment_completed'
  | 'escrow_confirmed'
  | 'wallet_transfer'
  | 'onramp_created'
  | 'onramp_completed'
  | 'refund'
  | 'payment_failed'
  | 'escrow_timeout'
  | 'wallet_created';

export type TransactionStatus = 
  | 'success'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'timeout';

export interface TransactionLogData {
  // Required fields
  transactionType: TransactionType;
  status: TransactionStatus;
  
  // Identification
  transactionId?: string;
  transactionHash?: string;
  
  // User/Wallet info
  userIdentifier?: string; // phone number, email, user ID
  walletAddress?: string;
  
  // Transaction details
  amount?: number;
  currency?: string; // ETH, USDC, USD
  
  // Description
  description?: string;
  
  // Related entities
  paymentId?: string;
  escrowOrderId?: string;
  agentTransactionId?: string; // Amazon order ID, etc.
  
  // Additional data
  metadata?: Record<string, any>;
  
  // Error info
  errorMessage?: string;
}

/**
 * Generate a unique log number
 * Format: TXN-{timestamp}-{random}
 */
function generateLogNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Log a transaction to the database
 */
export async function logTransaction(data: TransactionLogData): Promise<string | null> {
  try {
    const logNumber = generateLogNumber();
    
    const logEntry = {
      log_number: logNumber,
      transaction_type: data.transactionType,
      transaction_id: data.transactionId,
      transaction_hash: data.transactionHash,
      user_identifier: data.userIdentifier,
      wallet_address: data.walletAddress,
      amount: data.amount,
      currency: data.currency || 'ETH',
      status: data.status,
      description: data.description,
      metadata: data.metadata,
      payment_id: data.paymentId,
      escrow_order_id: data.escrowOrderId,
      agent_transaction_id: data.agentTransactionId,
      error_message: data.errorMessage,
    };

    console.log('📝 Logging transaction:', {
      logNumber,
      type: data.transactionType,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
    });

    const { data: insertedData, error } = await supabase
      .from('transaction_logs')
      .insert(logEntry)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to log transaction:', error);
      // Don't throw - logging should not break the main flow
      return null;
    }

    console.log('✅ Transaction logged successfully:', logNumber);
    return logNumber;
  } catch (error: any) {
    console.error('❌ Error logging transaction:', error.message);
    // Don't throw - logging should not break the main flow
    return null;
  }
}

/**
 * Update an existing transaction log
 */
export async function updateTransactionLog(
  logNumber: string,
  updates: Partial<TransactionLogData>
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.transactionHash) updateData.transaction_hash = updates.transactionHash;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.description) updateData.description = updates.description;
    if (updates.metadata) updateData.metadata = updates.metadata;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;
    if (updates.agentTransactionId) updateData.agent_transaction_id = updates.agentTransactionId;

    const { error } = await supabase
      .from('transaction_logs')
      .update(updateData)
      .eq('log_number', logNumber);

    if (error) {
      console.error('❌ Failed to update transaction log:', error);
      return false;
    }

    console.log('✅ Transaction log updated:', logNumber);
    return true;
  } catch (error: any) {
    console.error('❌ Error updating transaction log:', error.message);
    return false;
  }
}

/**
 * Get recent transaction logs
 */
export async function getRecentLogs(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch transaction logs:', error);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error fetching transaction logs:', error.message);
    return [];
  }
}

/**
 * Get logs by transaction type
 */
export async function getLogsByType(transactionType: TransactionType, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .eq('transaction_type', transactionType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch transaction logs:', error);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error fetching transaction logs:', error.message);
    return [];
  }
}

/**
 * Get logs by user identifier
 */
export async function getLogsByUser(userIdentifier: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .eq('user_identifier', userIdentifier)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch user transaction logs:', error);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error fetching user transaction logs:', error.message);
    return [];
  }
}

/**
 * Get log by transaction hash
 */
export async function getLogByTransactionHash(transactionHash: string) {
  try {
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .eq('transaction_hash', transactionHash)
      .single();

    if (error) {
      console.error('❌ Failed to fetch transaction log:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error fetching transaction log:', error.message);
    return null;
  }
}

