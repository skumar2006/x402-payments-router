'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, keccak256, toHex } from 'viem';
import { escrowABI } from '@/lib/escrowABI';
import { getEscrowContractAddress } from '@/lib/escrowUtils';
import styles from '../page.module.css';

export default function TestScenarios() {
  const { address, isConnected } = useAccount();
  const [scenario, setScenario] = useState<'success' | 'failure' | null>(null);
  const [testPaymentId, setTestPaymentId] = useState('');
  const [amount, setAmount] = useState('0.005');
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const escrowAddress = getEscrowContractAddress();

  const { writeContract: createPayment, data: createHash, isPending: isCreating } = useWriteContract();
  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const generateTestId = () => {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  };

  React.useEffect(() => {
    if (isCreateSuccess && createHash) {
      addLog(`✅ Payment created! Tx: ${createHash}`);
      setStatus(`Transaction confirmed on-chain!`);
      
      if (scenario === 'success') {
        addLog('✅ Scenario: SUCCESS - Backend will confirm this payment');
        addLog('💡 Now call the backend API with this payment ID to simulate successful flow');
      } else if (scenario === 'failure') {
        addLog('⚠️ Scenario: FAILURE - Do NOT confirm this payment');
        addLog('💡 Payment will remain in escrow. Can be refunded after 15 minutes.');
      }
    }
  }, [isCreateSuccess, createHash, scenario]);

  const handleStartScenario = async (type: 'success' | 'failure') => {
    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    setScenario(type);
    setLogs([]);
    const paymentId = generateTestId();
    setTestPaymentId(paymentId);

    if (type === 'success') {
      addLog('🎯 Starting SUCCESS scenario test');
      addLog('📝 This will test: Payment → Agent completes → Backend confirms → Funds to merchant');
    } else {
      addLog('🎯 Starting FAILURE scenario test');
      addLog('📝 This will test: Payment → Backend fails to confirm → Funds stay in escrow → Refundable after 15min');
    }

    addLog(`💳 Payment ID: ${paymentId}`);
    addLog(`📊 Amount: ${amount} ETH`);
    addLog(`🔗 Escrow Contract: ${escrowAddress}`);

    try {
      const orderIdHash = keccak256(toHex(paymentId));
      addLog(`🔑 Order ID Hash: ${orderIdHash}`);
      addLog('📤 Sending transaction to escrow contract...');
      
      setStatus('Creating payment...');
      
      createPayment({
        address: escrowAddress,
        abi: escrowABI,
        functionName: 'createPayment',
        args: [orderIdHash],
        value: parseEther(amount),
      });
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setStatus('Error!');
    }
  };

  const handleTestBackend = async () => {
    if (!testPaymentId) {
      alert('No payment ID available. Create a payment first.');
      return;
    }

    addLog('🔄 Calling backend with payment proof...');
    setStatus('Testing backend flow...');

    try {
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: 'Test Product',
          },
          paymentProof: {
            paymentId: testPaymentId,
            transactionHash: createHash || '0x0',
            from: address!,
            signature: createHash || '0x0',
          },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog(`✅ Backend response: ${JSON.stringify(data, null, 2)}`);
        addLog(`📊 Escrow Status: ${data.escrowStatus}`);
        
        if (data.escrowStatus === 'confirmed') {
          addLog('✅ SUCCESS! Funds were released to merchant!');
          addLog(`🔗 Confirmation Tx: ${data.escrowConfirmation?.transactionHash}`);
        } else {
          addLog(`⚠️ Escrow not confirmed. Status: ${data.escrowStatus}`);
          addLog('💡 Funds remain in escrow and can be refunded after 15 minutes');
        }
        
        setStatus('Backend test complete!');
      } else {
        addLog(`❌ Backend error: ${data.error}`);
        setStatus('Backend test failed!');
      }
    } catch (error: any) {
      addLog(`❌ Error calling backend: ${error.message}`);
      setStatus('Error!');
    }
  };

  const handleCheckEscrow = () => {
    const basescanUrl = `https://sepolia.basescan.org/address/${escrowAddress}`;
    addLog(`🔍 Opening BaseScan to check escrow contract...`);
    window.open(basescanUrl, '_blank');
  };

  const handleCheckInternalTxs = () => {
    const basescanUrl = `https://sepolia.basescan.org/address/${escrowAddress}#internaltx`;
    addLog(`🔍 Opening Internal Transactions tab...`);
    window.open(basescanUrl, '_blank');
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

        <h1 className={styles.title}>🧪 Escrow Test Scenarios</h1>
        <p className={styles.subtitle}>
          Test both successful and failed confirmation scenarios
        </p>

        {/* Wallet Connection */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            👆 Connect your wallet to start testing
          </p>
        ) : (
          <>
            {/* Contract Info */}
            <div className={styles.resultCard} style={{ marginBottom: '2rem', background: '#f0f9ff' }}>
              <h3>📄 Contract Info</h3>
              <div style={{ fontSize: '14px', marginTop: '1rem' }}>
                <div><strong>Escrow Contract:</strong> {escrowAddress}</div>
                <div><strong>Your Address:</strong> {address}</div>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={handleCheckEscrow}
                    className={styles.btnPrimary}
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', marginRight: '8px' }}
                  >
                    🔍 View on BaseScan
                  </button>
                  <button
                    onClick={handleCheckInternalTxs}
                    className={styles.btnPrimary}
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', background: '#10b981' }}
                  >
                    📊 Internal Transactions
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className={styles.formGroup}>
              <label>Test Amount (ETH)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.005"
                className={styles.priceInput}
              />
            </div>

            {/* Scenario Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
              <div className={styles.resultCard} style={{ background: '#d1fae5', padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, color: '#065f46' }}>✅ Success Scenario</h3>
                <p style={{ fontSize: '14px', color: '#047857', marginBottom: '1rem' }}>
                  Test normal flow: Payment → Confirmed → Funds to merchant
                </p>
                <button
                  onClick={() => handleStartScenario('success')}
                  disabled={isCreating || isCreateLoading || scenario !== null}
                  className={styles.btnPrimary}
                  style={{ background: '#10b981' }}
                >
                  {isCreating || isCreateLoading ? '⏳ Creating...' : '🎯 Test Success'}
                </button>
              </div>

              <div className={styles.resultCard} style={{ background: '#fef3c7', padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, color: '#92400e' }}>⚠️ Failure Scenario</h3>
                <p style={{ fontSize: '14px', color: '#b45309', marginBottom: '1rem' }}>
                  Test failure: Payment → Not confirmed → Refundable after 15min
                </p>
                <button
                  onClick={() => handleStartScenario('failure')}
                  disabled={isCreating || isCreateLoading || scenario !== null}
                  className={styles.btnPrimary}
                  style={{ background: '#f59e0b' }}
                >
                  {isCreating || isCreateLoading ? '⏳ Creating...' : '🎯 Test Failure'}
                </button>
              </div>
            </div>

            {/* Test Backend Button */}
            {scenario === 'success' && testPaymentId && isCreateSuccess && (
              <div style={{ marginTop: '2rem' }}>
                <button
                  onClick={handleTestBackend}
                  className={styles.btnPrimary}
                  style={{ background: '#6366f1' }}
                >
                  📡 Call Backend API (Test Full Flow)
                </button>
              </div>
            )}

            {/* Reset Button */}
            {scenario && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setScenario(null);
                    setTestPaymentId('');
                    setStatus('');
                    setLogs([]);
                  }}
                  className={styles.btnSecondary}
                >
                  🔄 Reset & Start New Test
                </button>
              </div>
            )}

            {/* Status */}
            {status && (
              <div className={styles.resultCard} style={{ marginTop: '2rem' }}>
                <h3>📊 Status</h3>
                <div style={{ fontSize: '14px', marginTop: '1rem' }}>
                  {status}
                </div>
              </div>
            )}

            {/* Test Info */}
            {testPaymentId && (
              <div className={styles.resultCard} style={{ marginTop: '2rem', background: '#f8f9fa' }}>
                <h3>🧪 Test Info</h3>
                <div style={{ fontSize: '14px', marginTop: '1rem', fontFamily: 'monospace' }}>
                  <div><strong>Payment ID:</strong> {testPaymentId}</div>
                  <div><strong>Order ID Hash:</strong> {keccak256(toHex(testPaymentId))}</div>
                  {createHash && <div><strong>Transaction:</strong> <a href={`https://sepolia.basescan.org/tx/${createHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0E76FD' }}>{createHash}</a></div>}
                </div>
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div className={styles.resultCard} style={{ marginTop: '2rem', background: '#1e1e1e', color: '#d4d4d4' }}>
                <h3 style={{ color: '#fff' }}>📝 Test Logs</h3>
                <div style={{ 
                  fontSize: '12px', 
                  marginTop: '1rem', 
                  fontFamily: 'monospace',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '1rem',
                  background: '#0d0d0d',
                  borderRadius: '8px'
                }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className={styles.resultCard} style={{ marginTop: '2rem', background: '#f0f9ff' }}>
              <h3>📖 How to Use</h3>
              
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ color: '#10b981' }}>✅ Testing Success Scenario:</h4>
                <ol style={{ fontSize: '14px', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  <li>Click "Test Success" to create a payment in escrow</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>Wait for transaction to confirm</li>
                  <li>Click "Call Backend API" to test the full flow</li>
                  <li>Backend will confirm payment and release funds to merchant</li>
                  <li>Check "Internal Transactions" tab to see ETH leaving escrow</li>
                </ol>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: '#f59e0b' }}>⚠️ Testing Failure Scenario:</h4>
                <ol style={{ fontSize: '14px', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  <li>Click "Test Failure" to create a payment in escrow</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>Wait for transaction to confirm</li>
                  <li>Payment stays in escrow (backend won't confirm it)</li>
                  <li>Wait 15 minutes</li>
                  <li>Go to <a href="/test-escrow" style={{ color: '#667eea', fontWeight: 'bold' }}>Test Escrow page</a></li>
                  <li>Use the Payment ID to trigger a refund</li>
                </ol>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                <strong>💡 Pro Tip:</strong> Use the "Internal Transactions" button to verify:
                <ul style={{ marginTop: '8px', fontSize: '14px', paddingLeft: '1.5rem' }}>
                  <li>Success scenario: Should see ETH transfer FROM escrow TO merchant</li>
                  <li>Failure scenario: No internal transactions (ETH stays locked)</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

