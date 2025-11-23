'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import styles from './topup.module.css';

interface WalletInfo {
  address: string;
  walletId: string;
}

interface Balance {
  [asset: string]: string;
}

export default function TopUpPage() {
  const params = useParams();
  const walletId = params.walletId as string;
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<Balance>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('10');
  const [showApplePay, setShowApplePay] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('');
  const [status, setStatus] = useState<string>('');
  const [showExternalWallet, setShowExternalWallet] = useState(false);
  const [externalWalletAmount, setExternalWalletAmount] = useState('0.01');
  const [error, setError] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  // External wallet hooks
  const { address: externalAddress, isConnected } = useAccount();
  const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Load wallet info on mount
  useEffect(() => {
    const loadWallet = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Fetch wallet info by walletId
        const response = await fetch('/api/wallet/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError('Wallet not found. Invalid wallet ID.');
          setIsLoading(false);
          return;
        }

        setWalletInfo({
          address: data.address,
          walletId: walletId,
        });

        setBalance(data.balances || {});
        setIsLoading(false);
      } catch (error: any) {
        console.error('Failed to load wallet:', error);
        setError('Failed to load wallet information.');
        setIsLoading(false);
      }
    };

    if (walletId) {
      loadWallet();
    }
  }, [walletId]);

  // Listen for post message events from Apple Pay iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: verify origin is from Coinbase
      if (!event.origin.includes('coinbase.com')) {
        return;
      }

      const { eventName, data } = event.data;

      console.log('📨 Received message from Apple Pay:', eventName, data);

      switch (eventName) {
        case 'onramp_api.load_pending':
          setStatus('⏳ Loading Apple Pay...');
          break;

        case 'onramp_api.load_success':
          setStatus('✅ Apple Pay ready! Click the button to pay.');
          break;

        case 'onramp_api.load_error':
          setStatus(`❌ Error loading Apple Pay: ${data?.errorMessage || 'Unknown error'}`);
          console.error('Apple Pay load error:', data);
          break;

        case 'onramp_api.commit_success':
          setStatus('✅ Payment initiated! Processing transaction...');
          break;

        case 'onramp_api.commit_error':
          setStatus(`❌ Payment failed: ${data?.errorMessage || 'Unknown error'}`);
          console.error('Apple Pay commit error:', data);
          break;

        case 'onramp_api.cancel':
          setStatus('⚠️ Payment cancelled');
          break;

        case 'onramp_api.polling_start':
          setStatus('⏳ Checking transaction status...');
          break;

        case 'onramp_api.polling_success':
          setStatus('🎉 Payment successful! Funds have been sent to your wallet.');
          // Refresh balance after successful payment
          setTimeout(() => {
            if (walletId) {
              fetchBalance(walletId);
            }
          }, 5000);
          break;

        case 'onramp_api.polling_error':
          setStatus(`❌ Transaction error: ${data?.errorMessage || 'Unknown error'}`);
          console.error('Apple Pay polling error:', data);
          break;

        default:
          console.log('Unknown event:', eventName);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [walletId]);

  const fetchBalance = async (wId: string) => {
    setLoadingBalance(true);
    try {
      const response = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: wId }),
      });

      const data = await response.json();

      if (response.ok) {
        setBalance(data.balances || {});
      } else {
        console.error('Error fetching balance:', data.error);
      }
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletInfo || !email) {
      alert('Please provide email address');
      return;
    }

    // For Onramp API, we need phone number - but we only have walletId
    // We'll use walletId as partnerUserId for now
    const phoneNumber = '+10000000000'; // Placeholder - need to store/retrieve actual phone

    setIsLoading(true);
    setStatus('⏳ Creating payment order...');

    try {
      // Create Apple Pay order
      const response = await fetch('/api/onramp/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationWalletAddress: walletInfo.address,
          partnerUserId: walletId,
          email: email,
          phoneNumber: phoneNumber,
          amount: amount,
          assetSymbol: 'USDC',
          network: 'base',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert('Error: ' + data.error);
        setStatus('❌ Failed to create payment order');
        return;
      }

      console.log('✅ Payment order created:', data);

      // Show Apple Pay iframe with payment link
      setPaymentLinkUrl(data.paymentLinkUrl);
      setShowApplePay(true);
      setStatus('⏳ Loading Apple Pay button...');
    } catch (error: any) {
      alert('Failed to create payment order: ' + error.message);
      setStatus('❌ Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshBalance = () => {
    if (walletId) {
      fetchBalance(walletId);
    }
  };

  const handleExternalWalletTopUp = () => {
    if (!walletInfo) {
      alert('No wallet info available');
      return;
    }

    if (!isConnected || !externalAddress) {
      alert('Please connect your external wallet first');
      return;
    }

    const amountInEth = parseFloat(externalWalletAmount);
    if (isNaN(amountInEth) || amountInEth <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setStatus('⏳ Sending transaction...');

    try {
      sendTransaction({
        to: walletInfo.address as `0x${string}`,
        value: parseEther(externalWalletAmount),
      });
    } catch (error: any) {
      alert('Transaction failed: ' + error.message);
      setStatus('');
    }
  };

  // Watch for external wallet transaction confirmation
  useEffect(() => {
    if (isConfirming) {
      setStatus('⏳ Confirming transaction on-chain...');
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setStatus('🎉 Top-up successful! Your balance will update shortly.');
      // Refresh balance after a few seconds
      setTimeout(() => {
        if (walletId) {
          fetchBalance(walletId);
        }
        setStatus('');
        setShowExternalWallet(false);
      }, 5000);
    }
  }, [isConfirmed, txHash, walletId]);

  // Show loading or error state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>💳 Top Up Your Wallet</h1>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className={styles.spinner}></div>
            <p>Loading wallet information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !walletInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>💳 Top Up Your Wallet</h1>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#e53e3e', fontSize: '1.1rem', marginBottom: '1rem' }}>
              ❌ {error || 'Wallet not found'}
            </p>
            <p style={{ color: '#718096', marginBottom: '2rem' }}>
              The wallet ID in this link is invalid or doesn't exist.
            </p>
            <button
              className={styles.btnPrimary}
              onClick={() => router.push('/')}
            >
              ← Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show top-up interface
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>💳 Top Up Your Wallet</h1>
        
        <div className={styles.walletInfo}>
          <h3>Your Wallet</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>Address:</span>
            <span className={styles.value}>{walletInfo.address}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Phone:</span>
            <span className={styles.value}>{walletInfo.phoneNumber}</span>
          </div>
        </div>

        <div className={styles.balanceSection}>
          <div className={styles.balanceHeader}>
            <h3>Current Balance</h3>
            <button 
              onClick={handleRefreshBalance}
              className={styles.btnRefresh}
              disabled={loadingBalance}
            >
              {loadingBalance ? '⏳' : '🔄'} Refresh
            </button>
          </div>
          
          {loadingBalance ? (
            <p>Loading balance...</p>
          ) : Object.keys(balance).length > 0 ? (
            <div className={styles.balanceList}>
              {Object.entries(balance).map(([asset, amount]) => (
                <div key={asset} className={styles.balanceItem}>
                  <span className={styles.asset}>{asset}</span>
                  <span className={styles.amount}>{amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyBalance}>No balance yet. Top up to get started!</p>
          )}
        </div>

        {/* Top-up method selector */}
        <div className={styles.methodSelector}>
          <button
            type="button"
            className={`${styles.methodButton} ${!showExternalWallet ? styles.active : ''}`}
            onClick={() => setShowExternalWallet(false)}
          >
             Apple Pay
          </button>
          <button
            type="button"
            className={`${styles.methodButton} ${showExternalWallet ? styles.active : ''}`}
            onClick={() => setShowExternalWallet(true)}
          >
            💼 External Wallet
          </button>
        </div>

        {!showApplePay && !showExternalWallet ? (
          <form onSubmit={handleTopUp} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={styles.input}
              />
              <p className={styles.helperText}>
                📧 Required for payment verification
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount (USD)</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                max="500"
                step="1"
                required
                className={styles.input}
              />
              <p className={styles.helperText}>
                💵 Minimum: $10 | Maximum: $500
              </p>
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Order...' : ' Pay with Apple Pay'}
            </button>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => router.push('/')}
              >
                ← Back to Home
              </button>
            </div>
          </form>
        ) : showExternalWallet ? (
          <div className={styles.externalWalletSection}>
            <h3>Top Up with External Wallet</h3>
            
              {!isConnected ? (
              <div className={styles.walletSelectionPrompt}>
                <div className={styles.walletIcon}>💼</div>
                <h4>Which wallet would you like to transfer funds from?</h4>
                <p>Connect your wallet to send ETH or USDC directly to your CDP wallet address.</p>
                
                <div className={styles.walletOptionsInfo}>
                  <div className={styles.walletOption}>
                    <span className={styles.walletEmoji}>🦊</span>
                    <span>MetaMask</span>
                  </div>
                  <div className={styles.walletOption}>
                    <span className={styles.walletEmoji}>🌈</span>
                    <span>Rainbow</span>
                  </div>
                  <div className={styles.walletOption}>
                    <span className={styles.walletEmoji}>💎</span>
                    <span>Coinbase Wallet</span>
                  </div>
                  <div className={styles.walletOption}>
                    <span className={styles.walletEmoji}>🔗</span>
                    <span>WalletConnect</span>
                  </div>
                  <div className={styles.walletOption}>
                    <span className={styles.walletEmoji}>➕</span>
                    <span>And more...</span>
                  </div>
                </div>

                <div className={styles.connectButtonWrapper}>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button 
                        onClick={openConnectModal}
                        className={styles.btnConnectWallet}
                      >
                        🔓 Select Wallet to Connect
                      </button>
                    )}
                  </ConnectButton.Custom>
                </div>

                <div className={styles.infoBox} style={{ marginTop: '20px' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    💡 <strong>Safe & Secure:</strong> Your wallet stays in your control. 
                    We only request your permission to send funds.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.connectedWalletInfo}>
                  <div className={styles.connectedBadge}>
                    <span className={styles.connectedDot}></span>
                    <span>Wallet Connected</span>
                  </div>
                  <div className={styles.walletAddressDisplay}>
                    <span className={styles.label}>From:</span>
                    <span className={styles.address}>
                      {externalAddress?.slice(0, 10)}...{externalAddress?.slice(-8)}
                    </span>
                  </div>
                  <div className={styles.walletAddressDisplay}>
                    <span className={styles.label}>To (Your CDP Wallet):</span>
                    <span className={styles.address}>
                      {walletInfo.address.slice(0, 10)}...{walletInfo.address.slice(-8)}
                    </span>
                  </div>
                  <ConnectButton.Custom>
                    {({ openAccountModal }) => (
                      <button 
                        onClick={openAccountModal}
                        className={styles.btnChangeWallet}
                      >
                        🔄 Change Wallet
                      </button>
                    )}
                  </ConnectButton.Custom>
                </div>

                <div className={styles.infoBox} style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    💡 <strong>How it works:</strong> Send ETH or USDC from your connected wallet 
                    directly to your CDP wallet address. The funds will appear in your balance.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="externalAmount">Amount (ETH)</label>
                  <input
                    type="number"
                    id="externalAmount"
                    value={externalWalletAmount}
                    onChange={(e) => setExternalWalletAmount(e.target.value)}
                    min="0.001"
                    step="0.001"
                    className={styles.input}
                  />
                  <p className={styles.helperText}>
                    💰 Available in your connected wallet
                  </p>
                </div>

                {status && (
                  <div className={styles.statusMessage}>
                    {status}
                  </div>
                )}

                <button
                  onClick={handleExternalWalletTopUp}
                  className={styles.btnPrimary}
                  disabled={isSending || isConfirming}
                >
                  {isSending || isConfirming ? '⏳ Processing...' : `💸 Send ${externalWalletAmount} ETH`}
                </button>

                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => router.push('/')}
                  style={{ marginTop: '10px' }}
                >
                  ← Back to Home
                </button>
              </>
            )}
          </div>
        ) : showApplePay ? (
          <div className={styles.applePaySection}>
            <h3>Complete Payment</h3>
            
            {status && (
              <div className={styles.statusMessage}>
                {status}
              </div>
            )}

            <div className={styles.iframeContainer}>
              <iframe
                ref={iframeRef}
                src={paymentLinkUrl}
                className={styles.applePayIframe}
                allow="payment"
                title="Apple Pay"
              />
            </div>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setShowApplePay(false);
                setPaymentLinkUrl('');
                setStatus('');
              }}
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className={styles.infoBox}>
          <h4>ℹ️ About Apple Pay Top-Up</h4>
          <ul>
            <li>✅ Fast and secure payments with Apple Pay</li>
            <li>💳 Supports debit cards (prepaid cards not supported)</li>
            <li>🔒 Your payment info is never shared with us</li>
            <li>⚡ Funds typically arrive within minutes</li>
            <li>🇺🇸 Currently available for US users only</li>
          </ul>
        </div>

        <button
          className={styles.btnSecondary}
          onClick={() => router.push('/')}
          style={{ marginTop: '20px' }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

