import { NextRequest, NextResponse } from 'next/server';
import { 
  getRecentLogs, 
  getLogsByType, 
  getLogsByUser,
  getLogByTransactionHash,
  TransactionType 
} from '@/lib/transactionLogger';

/**
 * GET /api/logs
 * 
 * Query transaction logs with filtering options
 * 
 * Query Parameters:
 * - limit: Number of logs to return (default: 50, max: 200)
 * - type: Filter by transaction type (payment_completed, escrow_confirmed, etc.)
 * - user: Filter by user identifier (phone, email, etc.)
 * - hash: Get log by transaction hash
 * 
 * Examples:
 * - /api/logs - Get recent 50 logs
 * - /api/logs?limit=100 - Get recent 100 logs
 * - /api/logs?type=payment_completed - All payment completions
 * - /api/logs?user=+12345678901 - User's transaction history
 * - /api/logs?hash=0x123... - Find by blockchain hash
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    const typeParam = searchParams.get('type');
    const userParam = searchParams.get('user');
    const hashParam = searchParams.get('hash');
    const limitParam = searchParams.get('limit');
    
    // Parse and validate limit
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 200); // Cap at 200
      }
    }

    // Query by transaction hash (single result)
    if (hashParam) {
      const log = await getLogByTransactionHash(hashParam);
      
      if (!log) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        count: 1,
        log,
      });
    }

    // Query by transaction type
    if (typeParam) {
      const validTypes: TransactionType[] = [
        'payment_completed',
        'escrow_confirmed',
        'wallet_transfer',
        'onramp_created',
        'onramp_completed',
        'refund',
        'payment_failed',
        'escrow_timeout',
        'wallet_created',
      ];

      if (!validTypes.includes(typeParam as TransactionType)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid transaction type',
            validTypes 
          },
          { status: 400 }
        );
      }

      const logs = await getLogsByType(typeParam as TransactionType, limit);
      
      return NextResponse.json({
        success: true,
        count: logs.length,
        limit,
        filter: { type: typeParam },
        logs,
      });
    }

    // Query by user identifier
    if (userParam) {
      const logs = await getLogsByUser(userParam, limit);
      
      return NextResponse.json({
        success: true,
        count: logs.length,
        limit,
        filter: { user: userParam },
        logs,
      });
    }

    // Default: Get recent logs
    const logs = await getRecentLogs(limit);
    
    return NextResponse.json({
      success: true,
      count: logs.length,
      limit,
      logs,
    });
  } catch (error: any) {
    console.error('❌ Error fetching transaction logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transaction logs',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs/stats
 * 
 * Get transaction statistics
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    endpoints: {
      'GET /api/logs': 'Get recent transaction logs',
      'GET /api/logs?limit=N': 'Get N recent logs (max 200)',
      'GET /api/logs?type=TYPE': 'Filter by transaction type',
      'GET /api/logs?user=USER': 'Get logs for specific user',
      'GET /api/logs?hash=HASH': 'Find log by transaction hash',
    },
    transactionTypes: [
      'payment_completed',
      'escrow_confirmed',
      'wallet_transfer',
      'onramp_created',
      'onramp_completed',
      'refund',
      'payment_failed',
      'escrow_timeout',
      'wallet_created',
    ],
    statuses: [
      'success',
      'pending',
      'failed',
      'refunded',
      'timeout',
    ],
  });
}

