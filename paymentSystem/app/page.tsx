'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

interface PaymentResponse {
  error: string;
  payment: {
    id: string;
    amount: string;
    currency: string;
    description: string;
    breakdown: {
      productPrice: string;
      agentFee: string;
      total: string;
    };
  };
  message: string;
}

interface SuccessResponse {
  success: boolean;
  paymentId: string;
  amount: string;
  result: any;
}

export default function Home() {
  // User setup state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userWallet, setUserWallet] = useState<{ address: string; walletId: string } | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [walletBalance, setWalletBalance] = useState<Record<string, string>>({});
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  // Purchase flow state
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [statusTitle, setStatusTitle] = useState('');
  const [statusContent, setStatusContent] = useState<any>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);
  const [showCopied, setShowCopied] = useState(false);

  const AGENT_FEE = 0.001; // Fixed agent fee in ETH

  const copyTopUpLink = () => {
    if (userWallet) {
      const link = `${window.location.origin}/topup/${userWallet.walletId}`;
      navigator.clipboard.writeText(link);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setQuery('');
    setStatus('idle');
    setStatusTitle('');
    setStatusContent(null);
    setCurrentPaymentId(null);
    setCurrentPaymentData(null);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);

    try {
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserWallet({
          address: data.wallet.address,
          walletId: data.wallet.walletId,
        });
        console.log('✅ User wallet loaded:', data.wallet.address);
        
        // Fetch wallet balance
        await fetchWalletBalance(phoneNumber);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Failed to create wallet: ' + error.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const fetchWalletBalance = async (phone: string) => {
    setLoadingBalance(true);
    try {
      const response = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setWalletBalance(data.balances || {});
      } else {
        console.error('Error fetching balance:', data.error);
      }
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePurchaseRequest();
  };

  const handlePurchaseRequest = async () => {
    setStatus('pending');
    setStatusTitle('Looking up product price...');
    setStatusContent({ loading: true });

    try {
      // Step 1: Request agent service (will get 402)
      // Agent will look up the price automatically
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: query,
          },
        }),
      });

      const data = await response.json();

      if (response.status === 402) {
        // Payment required - store payment data for later
        setCurrentPaymentId(data.payment.id);
        setCurrentPaymentData(data);
        showPaymentRequired(data);
      } else if (response.ok) {
        showSuccess(data);
      } else {
        showError('Request failed: ' + data.error);
      }
    } catch (error: any) {
      showError('Network error: ' + error.message);
    }
  };

  const showPaymentRequired = (data: PaymentResponse) => {
    setStatus('pending');
    setStatusTitle('💳 Payment Required');
    
    setStatusContent({
      payment: data.payment,
      message: data.message,
      waitingForPayment: true,
      useCDPWallet: true,
      userWalletAddress: userWallet?.address,
    });
  };

  const handleManualPayment = () => {
    // Check if user has a CDP wallet
    if (!userWallet) {
      showError('No user wallet found');
      return;
    }

    // Get payment amount from current payment data
    if (!currentPaymentData || !currentPaymentData.payment) {
      showError('No payment data available');
      return;
    }

    const amount = currentPaymentData.payment.amount;
    const orderId = currentPaymentData.payment.orderId;

    if (!orderId) {
      showError('No order ID found in payment data');
      return;
    }

    // Use CDP wallet to make payment (no external wallet required!)
    sendCDPWalletPayment(amount, orderId);
  };

  const sendCDPWalletPayment = async (amount: string, orderId: string) => {
    if (!userWallet) {
      showError('No user wallet found');
      return;
    }

    if (!currentPaymentId) {
      showError('No payment ID available');
      return;
    }

    setStatus('pending');
    setStatusTitle('💳 Processing Payment from Your CDP Wallet...');
    setStatusContent({ processing: true, message: '⏳ Using your CDP wallet to make payment. No external wallet required!' });

    try {
      console.log('📤 Creating escrow payment from CDP wallet...');
      console.log('   Order ID:', orderId);
      console.log('   Amount:', amount, 'ETH');
      console.log('   Phone Number:', phoneNumber);

      // Call our API to invoke the contract from CDP wallet
      const response = await fetch('/api/cdp-wallet/transfer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          amount: amount,
          orderId: orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Transfer failed');
      }

      console.log('✅ CDP wallet payment successful:', data);

      // Submit payment proof with the transaction hash
      await submitPaymentProofFromCDP(data.transactionHash);
    } catch (error: any) {
      console.error('❌ CDP wallet payment error:', error);
      showError('Payment failed: ' + error.message);
    }
  };

  const submitPaymentProofFromCDP = async (txHash: string) => {
    setStatus('pending');
    setStatusTitle('🔄 Verifying Payment...');
    setStatusContent({ processing: true, message: 'Confirming transaction on-chain...' });

    try {
      // Create payment proof with CDP wallet transaction hash
      const paymentProof = {
        paymentId: currentPaymentId!,
        transactionHash: txHash,
        from: userWallet!.address,
        signature: txHash,
      };

      // Submit payment and execute agent workflow
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: query,
          },
          paymentProof,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(data);
        // Refresh balance after successful payment
        await fetchWalletBalance(phoneNumber);
      } else {
        showError('Payment verification failed: ' + data.error);
      }
    } catch (error: any) {
      showError('Payment error: ' + error.message);
    }
  };



  const submitPaymentProof = async (txHash: string) => {
    setStatus('pending');
    setStatusTitle('🔄 Verifying Payment...');
    setStatusContent({ processing: true, message: 'Confirming transaction on-chain...' });

    try {
      // Create payment proof with real transaction hash
      const paymentProof = {
        paymentId: currentPaymentId!,
        transactionHash: txHash,
        from: address!,
        signature: txHash, // Using tx hash as proof for now
      };

      // Submit payment and execute agent workflow
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: query,
          },
          paymentProof,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(data);
      } else {
        showError('Payment verification failed: ' + data.error);
      }
    } catch (error: any) {
      showError('Payment error: ' + error.message);
    }
  };

  const showSuccess = (data: SuccessResponse) => {
    setStatus('success');
    setStatusTitle('🎉 Agent Workflow Complete!');
    setStatusContent(data);
  };

  const showError = (message: string) => {
    setStatus('error');
    setStatusTitle('❌ Error');
    setStatusContent({ error: message });
  };

  // Show phone number input first if user hasn't set up wallet
  if (!userWallet) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>🤖 x402 Purchasing Agent</h1>
          <p className={styles.subtitle}>
            Enter your phone number to get started
          </p>

          <form onSubmit={handlePhoneSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                required
                className={styles.priceInput}
              />
              <p className={styles.helperText}>
                💡 We'll create a secure wallet for you using Coinbase CDP.
                Your wallet will be linked to this phone number.
              </p>
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isSettingUp}
            >
              {isSettingUp ? 'Creating Wallet...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🤖 x402 Purchasing Agent</h1>
            <p className={styles.subtitle}>
              CDP Wallet powered by Coinbase
            </p>
          </div>
        </div>

        <div className={styles.walletSection}>
          <div className={styles.walletHeader}>
            <div>
              <h3 className={styles.walletTitle}>Your CDP Wallet</h3>
              <p className={styles.walletAddress}>
                📱 {userWallet.address.slice(0, 10)}...{userWallet.address.slice(-8)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href={`/topup/${userWallet.walletId}`} className={styles.btnTopUp}>
                💳 Top Up
              </a>
              <button onClick={copyTopUpLink} className={styles.btnCopyLink} title="Copy top-up link">
                {showCopied ? '✅ Copied!' : '🔗 Copy Link'}
              </button>
            </div>
          </div>

          <div className={styles.balanceSection}>
            <div className={styles.balanceHeader}>
              <span className={styles.balanceLabel}>Balance</span>
              <button 
                onClick={() => fetchWalletBalance(phoneNumber)}
                className={styles.btnRefresh}
                disabled={loadingBalance}
              >
                {loadingBalance ? '⏳' : '🔄'}
              </button>
            </div>
            {loadingBalance ? (
              <p className={styles.balanceLoading}>Loading...</p>
            ) : Object.keys(walletBalance).length > 0 ? (
              <div className={styles.balanceList}>
                {Object.entries(walletBalance).map(([asset, amount]) => (
                  <div key={asset} className={styles.balanceItem}>
                    <span className={styles.asset}>{asset}:</span>
                    <span className={styles.amount}>{amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyBalance}>
                💡 No balance yet. <a href={`/topup/${userWallet.walletId}`} style={{ color: '#667eea', fontWeight: 600 }}>Top up your wallet</a> to get started!
              </p>
            )}
          </div>
        </div>

        <div className={styles.pricingInfo}>
          <h3>💰 Payment Structure</h3>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Agent Service Fee (fixed)</span>
            <span className={styles.priceValue}>{AGENT_FEE.toFixed(2)} USDC</span>
          </div>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Product Cost</span>
            <span className={styles.priceValue}>Your input below</span>
          </div>
          <div className={styles.priceItem} style={{ borderTop: '2px solid #667eea', paddingTop: '12px', marginTop: '8px' }}>
            <span className={styles.priceLabel}><strong>Total x402 Payment</strong></span>
            <span className={styles.priceValue}><strong>Agent Fee + Product Cost</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="query">What would you like to buy?</label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., USB-C charger, headphones, laptop..."
              required
            />
            <p className={styles.helperText}>
              💡 The agent will automatically look up the price for you!
            </p>
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.btnPrimary}>
              Request Agent Service
            </button>
            <div className={styles.buttonGroup} style={{ marginTop: '10px' }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  resetForm();
                  setUserWallet(null);
                  setPhoneNumber('');
                }}
              >
                Change Phone Number
              </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="/topup-demo"
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-block',
              padding: '10px 16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #667eea'
            }}
          >
            💳 Top-Up Demo
          </a>
          <a 
            href="/test-escrow"
            style={{ 
              color: '#10b981', 
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-block',
              padding: '10px 16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}
          >
            🔍 Test Escrow
          </a>
          <a 
            href="/test-scenarios"
            style={{ 
              color: '#f59e0b', 
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-block',
              padding: '10px 16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #f59e0b'
            }}
          >
            🧪 Test Scenarios
          </a>
        </div>

        {status !== 'idle' && (
          <div className={`${styles.statusPanel} ${styles[`status-${status}`]}`}>
            <div className={styles.statusTitle}>{statusTitle}</div>
            <div className={styles.statusContent}>
              <StatusContent 
                status={status} 
                content={statusContent}
                onPayNow={handleManualPayment}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusContent({ status, content, onPayNow }: { status: string; content: any; onPayNow?: () => void }) {
  if (!content) return null;

  if (content.loading) {
    return <div className={styles.spinner}></div>;
  }

  if (content.processing) {
    return (
      <>
        <div className={styles.spinner}></div>
        <p>{content.message || 'Processing...'}</p>
      </>
    );
  }

  if (content.payment && content.waitingForPayment) {
    return (
      <>
        <div className={styles.paymentDetails}>
          <strong>Payment ID:</strong> {content.payment.id}
          <br />
          <strong>Product Price:</strong> {content.payment.breakdown.productPrice} ETH
          <br />
          <strong>Agent Fee:</strong> {content.payment.breakdown.agentFee} ETH
          <br />
          <strong>Total Amount:</strong> <span style={{ color: '#667eea', fontSize: '18px', fontWeight: 'bold' }}>{content.payment.breakdown.total} ETH</span>
          <br />
          <strong>Network:</strong> Base Sepolia
          <br />
          <strong>Your CDP Wallet:</strong> {content.userWalletAddress ? `${content.userWalletAddress.slice(0, 6)}...${content.userWalletAddress.slice(-4)}` : 'N/A'}
        </div>
        <div style={{ marginTop: '15px', padding: '12px', background: '#f0f7ff', borderRadius: '8px', border: '1px solid #667eea' }}>
          <p style={{ margin: '0 0 8px 0', color: '#667eea', fontWeight: 'bold', fontSize: '14px' }}>
            💡 No External Wallet Needed!
          </p>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
            Payment will be made directly from your CDP wallet. Make sure you have sufficient balance.
          </p>
        </div>
        <button 
          onClick={onPayNow}
          className={styles.btnPayNow}
        >
          💳 Pay {content.payment.breakdown.total} ETH from CDP Wallet
        </button>
      </>
    );
  }

  if (content.success) {
    const isConfirmed = content.escrowStatus === 'confirmed';
    const isPending = content.escrowStatus === 'failed' || content.escrowStatus === 'disabled_for_testing' || content.escrowStatus === 'pending';
    
    return (
      <div className={styles.resultCard}>
        <div className={styles.resultItem}>
          {isConfirmed ? (
            <>
              <div className={styles.resultLabel}>✅ Payment Confirmed</div>
              <span className={styles.tagSuccess}>PAID</span>
            </>
          ) : (
            <>
              <div className={styles.resultLabel}>⚠️ Payment in Escrow</div>
              <span className={styles.tagWarning}>PENDING</span>
            </>
          )}
          <div className={styles.resultValue}>Payment ID: {content.paymentId}</div>
          <div className={styles.resultValue}>Amount: {content.amount} ETH</div>
          
          {isPending && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', fontSize: '14px' }}>
              <strong>⏰ Escrow Status: {content.escrowStatus}</strong>
              <p style={{ margin: '8px 0' }}>
                Your payment is locked in the escrow contract. It can be refunded after 15 minutes if not confirmed.
              </p>
              <strong>💡 To get your refund:</strong>
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Wait 15 minutes from now</li>
                <li>Go to <a href="/test-escrow" style={{ color: '#667eea', fontWeight: 'bold' }}>Test Escrow page</a></li>
                <li>Enter Payment ID: <code>{content.paymentId}</code></li>
                <li>Click "Refund (After Timeout)"</li>
              </ol>
            </div>
          )}
        </div>
        <div className={styles.resultItem}>
          <div className={styles.resultLabel}>🤖 Agent Result</div>
          <div className={styles.resultValue}>Status: {content.result.status}</div>
          {content.agentTransactionId && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#dbeafe', borderRadius: '8px', fontSize: '14px' }}>
              <strong>🔐 Proof of Purchase</strong>
              <p style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: '12px' }}>
                Transaction ID: <code style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>{content.agentTransactionId}</code>
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                This transaction ID confirms the product was purchased successfully.
              </p>
            </div>
          )}
          <ResultDetails result={content.result} />
        </div>
      </div>
    );
  }

  if (content.error) {
    return <p>{content.error}</p>;
  }

  return <pre>{JSON.stringify(content, null, 2)}</pre>;
}

function ResultDetails({ result }: { result: any }) {
  // For the new OpenAI-powered agent response
  if (result.transactionId) {
    return (
      <>
        {result.product && (
          <>
            <div className={styles.resultValue}>Product: {result.product.name}</div>
            <div className={styles.resultValue}>Price: {result.product.priceUSD ? `$${result.product.priceUSD} (${result.product.priceETH} ETH)` : result.product.price}</div>
            <div className={styles.resultValue}>Vendor: {result.product.vendor}</div>
          </>
        )}
        {result.aiConfirmation && (
          <div className={styles.resultValue} style={{ marginTop: '1rem', fontStyle: 'italic', color: '#666' }}>
            🤖 AI: {result.aiConfirmation}
          </div>
        )}
        <div className={styles.resultValue}>Message: {result.message}</div>
      </>
    );
  }

  // Legacy response format
  if (result.orderId) {
    return (
      <>
        <div className={styles.resultValue}>Order ID: {result.orderId}</div>
        <div className={styles.resultValue}>Product: {result.product.name}</div>
        <div className={styles.resultValue}>Price: {result.product.price}</div>
        <div className={styles.resultValue}>Message: {result.message}</div>
      </>
    );
  }

  if (result.results) {
    return (
      <>
        <div className={styles.resultValue}>Found {result.resultsCount} products:</div>
        {result.results.map((r: any, i: number) => (
          <div key={i} className={styles.resultValue}>
            • {r.name} - {r.price} (⭐ {r.rating})
          </div>
        ))}
      </>
    );
  }

  if (result.comparison) {
    return (
      <>
        <div className={styles.resultValue}>
          Recommendation: {result.recommendation}
        </div>
        {result.comparison.map((c: any, i: number) => (
          <div key={i} className={styles.resultValue}>
            • {c.vendor}: {c.price} + {c.shipping} shipping
          </div>
        ))}
      </>
    );
  }

  return null;
}

