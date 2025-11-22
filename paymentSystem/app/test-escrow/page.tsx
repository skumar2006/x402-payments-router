'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther, keccak256, toHex } from 'viem';
import { escrowABI } from '@/lib/escrowABI';
import { getEscrowContractAddress } from '@/lib/escrowUtils';
import styles from '../page.module.css';

export default function TestEscrow() {
  const { address, isConnected } = useAccount();
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [status, setStatus] = useState('');
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const escrowAddress = getEscrowContractAddress();

  // Contract write hooks
  const { writeContract: createPayment, data: createHash, isPending: isCreating } = useWriteContract();
  const { writeContract: confirmPayment, data: confirmHash, isPending: isConfirming } = useWriteContract();
  const { writeContract: refundPayment, data: refundHash, isPending: isRefunding } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });
  const { isLoading: isConfirmLoading, isSuccess: isConfirmSuccess } = useWaitForTransactionReceipt({
    hash: confirmHash,
  });
  const { isLoading: isRefundLoading, isSuccess: isRefundSuccess } = useWaitForTransactionReceipt({
    hash: refundHash,
  });

  // Read payment details
  const { data: paymentData, refetch: refetchPayment } = useReadContract({
    address: escrowAddress,
    abi: escrowABI,
    functionName: 'getPayment',
    args: orderId ? [keccak256(toHex(orderId))] : undefined,
  });

  // Read contract info
  const { data: merchantWallet } = useReadContract({
    address: escrowAddress,
    abi: escrowABI,
    functionName: 'merchantWallet',
  });

  const { data: timeout } = useReadContract({
    address: escrowAddress,
    abi: escrowABI,
    functionName: 'TIMEOUT',
  });

  React.useEffect(() => {
    if (isCreateSuccess && createHash) {
      setStatus(`✅ Payment created! Tx: ${createHash}`);
      setLastTxHash(createHash);
      refetchPayment();
    }
  }, [isCreateSuccess, createHash]);

  React.useEffect(() => {
    if (isConfirmSuccess && confirmHash) {
      setStatus(`✅ Payment confirmed! Tx: ${confirmHash}`);
      setLastTxHash(confirmHash);
      refetchPayment();
    }
  }, [isConfirmSuccess, confirmHash]);

  React.useEffect(() => {
    if (isRefundSuccess && refundHash) {
      setStatus(`✅ Payment refunded! Tx: ${refundHash}`);
      setLastTxHash(refundHash);
      refetchPayment();
    }
  }, [isRefundSuccess, refundHash]);

  const handleCreatePayment = async () => {
    if (!orderId || !amount) {
      alert('Please enter order ID and amount');
      return;
    }

    try {
      const orderIdHash = keccak256(toHex(orderId));
      setStatus('🔄 Creating payment...');
      
      createPayment({
        address: escrowAddress,
        abi: escrowABI,
        functionName: 'createPayment',
        args: [orderIdHash],
        value: parseEther(amount),
      });
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId) {
      alert('Please enter order ID');
      return;
    }

    try {
      const orderIdHash = keccak256(toHex(orderId));
      setStatus('🔄 Confirming payment...');
      
      confirmPayment({
        address: escrowAddress,
        abi: escrowABI,
        functionName: 'confirmPayment',
        args: [orderIdHash],
      });
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleRefundPayment = async () => {
    if (!orderId) {
      alert('Please enter order ID');
      return;
    }

    try {
      const orderIdHash = keccak256(toHex(orderId));
      setStatus('🔄 Refunding payment...');
      
      refundPayment({
        address: escrowAddress,
        abi: escrowABI,
        functionName: 'refundExpiredPayment',
        args: [orderIdHash],
      });
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleCheckPayment = () => {
    if (!orderId) {
      alert('Please enter order ID');
      return;
    }
    refetchPayment();
    setStatus('🔍 Payment details refreshed');
  };

  const generateRandomOrderId = () => {
    const randomId = `test-${Date.now()}`;
    setOrderId(randomId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ marginBottom: '1rem' }}>
          <a 
            href="/"
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            ← Back to Main App
          </a>
        </div>
        <h1 className={styles.title}>🧪 Escrow Contract Testing</h1>
        <p className={styles.subtitle}>
          Test the X402 escrow contract functions
        </p>

        {/* Wallet Connection */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            👆 Connect your wallet to test the escrow contract
          </p>
        ) : (
          <>
            {/* Contract Info */}
            <div className={styles.resultCard} style={{ marginBottom: '2rem' }}>
              <h3>📄 Contract Info</h3>
              <div style={{ fontSize: '14px', marginTop: '1rem' }}>
                <div><strong>Contract:</strong> {escrowAddress}</div>
                <div><strong>Merchant:</strong> {merchantWallet as string}</div>
                <div><strong>Timeout:</strong> {timeout ? `${timeout.toString()} seconds (15 min)` : 'Loading...'}</div>
                <div><strong>Your Address:</strong> {address}</div>
              </div>
            </div>

            {/* Order ID Input */}
            <div className={styles.formGroup}>
              <label>Order ID (for testing)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., test-123 or payment-abc"
                  className={styles.priceInput}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={generateRandomOrderId}
                  className={styles.btnPrimary}
                  style={{ width: 'auto', padding: '0 1rem' }}
                >
                  🎲 Random
                </button>
              </div>
              <p className={styles.helperText}>
                💡 Use a unique ID for each test payment
              </p>
            </div>

            {/* Create Payment */}
            <div className={styles.formGroup}>
              <label>Amount (ETH)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className={styles.priceInput}
              />
              <button
                onClick={handleCreatePayment}
                disabled={isCreating || isCreateLoading || !orderId}
                className={styles.btnPrimary}
                style={{ marginTop: '0.5rem' }}
              >
                {isCreating || isCreateLoading ? '⏳ Creating Payment...' : '💰 Create Payment (Lock ETH)'}
              </button>
              <p className={styles.helperText}>
                This locks your ETH in the escrow contract
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleConfirmPayment}
                disabled={isConfirming || isConfirmLoading || !orderId}
                className={styles.btnPrimary}
                style={{ background: '#10b981' }}
              >
                {isConfirming || isConfirmLoading ? '⏳ Confirming...' : '✅ Confirm Payment'}
              </button>
              
              <button
                onClick={handleRefundPayment}
                disabled={isRefunding || isRefundLoading || !orderId}
                className={styles.btnPrimary}
                style={{ background: '#f59e0b' }}
              >
                {isRefunding || isRefundLoading ? '⏳ Refunding...' : '↩️ Refund (After Timeout)'}
              </button>
            </div>

            <button
              onClick={handleCheckPayment}
              disabled={!orderId}
              className={styles.btnPrimary}
              style={{ marginTop: '1rem', background: '#6366f1' }}
            >
              🔍 Check Payment Status
            </button>

            {/* Status */}
            {status && (
              <div className={styles.resultCard} style={{ marginTop: '2rem' }}>
                <h3>📊 Status</h3>
                <div style={{ fontSize: '14px', marginTop: '1rem', wordBreak: 'break-all' }}>
                  {status}
                </div>
                {lastTxHash && (
                  <div style={{ marginTop: '1rem' }}>
                    <a
                      href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0E76FD', textDecoration: 'underline' }}
                    >
                      View on BaseScan →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Payment Details */}
            {paymentData && (
              <div className={styles.resultCard} style={{ marginTop: '2rem' }}>
                <h3>💳 Payment Details</h3>
                <div style={{ fontSize: '14px', marginTop: '1rem' }}>
                  <div><strong>Payer:</strong> {paymentData[0]}</div>
                  <div><strong>Amount:</strong> {formatEther(paymentData[1])} ETH</div>
                  <div><strong>Timestamp:</strong> {new Date(Number(paymentData[2]) * 1000).toLocaleString()}</div>
                  <div><strong>Completed:</strong> {paymentData[3] ? '✅ Yes' : '❌ No'}</div>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: paymentData[3] ? '#d1fae5' : '#fef3c7', borderRadius: '8px' }}>
                    {paymentData[3] ? (
                      '✅ This payment has been completed (confirmed or refunded)'
                    ) : (
                      '⏳ This payment is still in escrow. You can confirm it or wait 15 minutes to refund.'
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className={styles.resultCard} style={{ marginTop: '2rem', background: '#f0f9ff' }}>
              <h3>📖 Testing Instructions</h3>
              <ol style={{ fontSize: '14px', lineHeight: '1.8', paddingLeft: '1.5rem', margin: '1rem 0' }}>
                <li><strong>Create Payment:</strong> Enter an order ID and amount, then click "Create Payment" to lock ETH in escrow</li>
                <li><strong>Confirm Payment:</strong> Click "Confirm Payment" to release funds to the merchant (simulates successful agent completion)</li>
                <li><strong>Refund:</strong> Wait 15 minutes after creating a payment, then click "Refund" to get your ETH back (simulates timeout)</li>
                <li><strong>Check Status:</strong> Use "Check Payment Status" to see current payment details</li>
              </ol>
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', marginTop: '1rem' }}>
                <strong>⚠️ Note:</strong> This is for testing only! In production, only your backend should call confirmPayment.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

