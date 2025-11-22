'use client';

import React, { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@coinbase/cds-web/buttons/Button';
import { parseEther } from 'viem';
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
  
  // Purchase flow state
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [statusTitle, setStatusTitle] = useState('');
  const [statusContent, setStatusContent] = useState<any>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);

  const AGENT_FEE = 0.001; // Fixed agent fee in ETH

  // Wallet hooks
  const { address, isConnected } = useAccount();
  const { sendTransaction, data: hash, isPending: isWritePending, error: writeError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

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
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Failed to create wallet: ' + error.message);
    } finally {
      setIsSettingUp(false);
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
      isConnected,
      userWalletAddress: userWallet?.address,
    });
  };

  const handleManualPayment = () => {
    // Check if wallet is connected
    if (!isConnected) {
      showError('Please connect your wallet first');
      return;
    }

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

    // Initiate real ETH transfer to user's CDP wallet
    sendETHPayment(amount, userWallet.address);
  };

  const sendETHPayment = async (amount: string, recipient: string) => {
    if (!userWallet) {
      showError('No user wallet found');
      return;
    }

    setStatus('pending');
    setStatusTitle('💳 Waiting for Wallet Approval...');
    setStatusContent({ processing: true, message: 'Please approve the transaction in your wallet' });

    try {
      // Convert amount to Wei (18 decimals for ETH)
      const amountInWei = parseEther(amount);

      // Send ETH transfer to user's CDP wallet
      sendTransaction({
        to: userWallet.address as `0x${string}`,
        value: amountInWei,
      });
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      showError('Payment failed: ' + error.message);
    }
  };

  // Watch for write errors
  React.useEffect(() => {
    if (writeError) {
      console.error('❌ Write contract error:', writeError);
      showError('Transaction failed: ' + (writeError.message || 'Unknown error'));
    }
  }, [writeError]);

  // Watch for transaction being confirmed on-chain
  React.useEffect(() => {
    if (isConfirming && hash) {
      setStatus('pending');
      setStatusTitle('⏳ Confirming Transaction...');
      setStatusContent({ processing: true, message: 'Waiting for on-chain confirmation...' });
    }
  }, [isConfirming, hash]);

  // Watch for transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && hash) {
      // Transaction confirmed! Now submit to backend
      submitPaymentProof(hash);
    }
  }, [isConfirmed, hash]);

  const submitPaymentProof = async (txHash: `0x${string}`) => {
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

            <Button
              type="submit"
              variant="primary"
              disabled={isSettingUp}
            >
              {isSettingUp ? 'Creating Wallet...' : 'Continue'}
            </Button>
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
              Real USDC payments on Base Sepolia
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              📱 Wallet: {userWallet.address.slice(0, 6)}...{userWallet.address.slice(-4)}
            </p>
          </div>
          <ConnectButton />
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
            <div style={{ flex: 1 }}>
              <Button type="submit" variant="primary" block>
                Request Agent Service
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setUserWallet(null);
                  setPhoneNumber('');
                }}
                block
              >
                Change Phone Number
              </Button>
            </div>
          </div>
        </form>

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
          <strong>Your Wallet:</strong> {content.userWalletAddress ? `${content.userWalletAddress.slice(0, 6)}...${content.userWalletAddress.slice(-4)}` : 'N/A'}
        </div>
        {!content.isConnected ? (
          <p style={{ marginTop: '15px', color: '#ff6b6b', fontWeight: 'bold' }}>
            ⚠️ Please connect your wallet above to pay
          </p>
        ) : (
          <>
            <p style={{ marginTop: '15px', color: '#666', marginBottom: '15px' }}>
              Send {content.payment.breakdown.total} ETH to your CDP wallet.
              Funds will be held in your secure wallet linked to your phone number.
            </p>
            <Button 
              onClick={onPayNow}
              variant="primary"
              startIcon="wallet"
              block
              style={{ marginTop: '10px' }}
            >
              Pay {content.payment.breakdown.total} ETH
            </Button>
          </>
        )}
      </>
    );
  }

  if (content.success) {
    return (
      <div className={styles.resultCard}>
        <div className={styles.resultItem}>
          <div className={styles.resultLabel}>✅ Payment Confirmed</div>
          <div className={styles.resultValue}>Payment ID: {content.paymentId}</div>
          <div className={styles.resultValue}>Amount: {content.amount} USDC</div>
          <span className={styles.tagSuccess}>PAID</span>
        </div>
        <div className={styles.resultItem}>
          <div className={styles.resultLabel}>🤖 Agent Result</div>
          <div className={styles.resultValue}>Status: {content.result.status}</div>
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

