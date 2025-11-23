'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, keccak256, toHex } from 'viem';
import { escrowABI } from '@/lib/escrowABI';
import { getEscrowContractAddress } from '@/lib/escrowUtils';

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
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 border">
        <div className="mb-4">
          <a 
            href="/"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            ← Back to Main App
          </a>
        </div>

        <h1 className="text-2xl font-bold mb-2">🧪 Escrow Test Scenarios</h1>
        <p className="text-gray-600 mb-6">
          Test both successful and failed confirmation scenarios
        </p>

        {/* Wallet Connection */}
        <div className="mb-8 flex justify-center">
          <ConnectButton />
        </div>

        {!isConnected ? (
          <p className="text-center text-gray-600">
            👆 Connect your wallet to start testing
          </p>
        ) : (
          <>
            {/* Contract Info */}
            <div className="border rounded-lg p-4 bg-blue-50 mb-8">
              <h3 className="font-semibold mb-2">📄 Contract Info</h3>
              <div className="text-sm space-y-2">
                <div><strong>Escrow Contract:</strong> {escrowAddress}</div>
                <div><strong>Your Address:</strong> {address}</div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleCheckEscrow}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    🔍 View on BaseScan
                  </button>
                  <button
                    onClick={handleCheckInternalTxs}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                  >
                    📊 Internal Transactions
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6 space-y-2">
              <label className="block font-medium">Test Amount (ETH)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.005"
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* Scenario Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="border rounded-lg p-6 bg-green-50">
                <h3 className="text-lg font-bold text-green-800 mb-2">✅ Success Scenario</h3>
                <p className="text-sm text-green-700 mb-4">
                  Test normal flow: Payment → Confirmed → Funds to merchant
                </p>
                <button
                  onClick={() => handleStartScenario('success')}
                  disabled={isCreating || isCreateLoading || scenario !== null}
                  className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {isCreating || isCreateLoading ? '⏳ Creating...' : '🎯 Test Success'}
                </button>
              </div>

              <div className="border rounded-lg p-6 bg-amber-50">
                <h3 className="text-lg font-bold text-amber-800 mb-2">⚠️ Failure Scenario</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Test failure: Payment → Not confirmed → Refundable after 15min
                </p>
                <button
                  onClick={() => handleStartScenario('failure')}
                  disabled={isCreating || isCreateLoading || scenario !== null}
                  className="w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 font-medium"
                >
                  {isCreating || isCreateLoading ? '⏳ Creating...' : '🎯 Test Failure'}
                </button>
              </div>
            </div>

            {/* Test Backend Button */}
            {scenario === 'success' && testPaymentId && isCreateSuccess && (
              <div className="mt-8">
                <button
                  onClick={handleTestBackend}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-lg"
                >
                  📡 Call Backend API (Test Full Flow)
                </button>
              </div>
            )}

            {/* Reset Button */}
            {scenario && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setScenario(null);
                    setTestPaymentId('');
                    setStatus('');
                    setLogs([]);
                  }}
                  className="w-full py-2 border border-gray-300 rounded hover:bg-gray-100 font-medium"
                >
                  🔄 Reset & Start New Test
                </button>
              </div>
            )}

            {/* Status */}
            {status && (
              <div className="border rounded-lg p-4 bg-gray-50 mt-8">
                <h3 className="font-semibold mb-2">📊 Status</h3>
                <div className="text-sm">
                  {status}
                </div>
              </div>
            )}

            {/* Test Info */}
            {testPaymentId && (
              <div className="border rounded-lg p-4 bg-gray-100 mt-8">
                <h3 className="font-semibold mb-2">🧪 Test Info</h3>
                <div className="text-xs font-mono space-y-1">
                  <div><strong>Payment ID:</strong> {testPaymentId}</div>
                  <div><strong>Order ID Hash:</strong> {keccak256(toHex(testPaymentId))}</div>
                  {createHash && <div><strong>Transaction:</strong> <a href={`https://sepolia.basescan.org/tx/${createHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{createHash}</a></div>}
                </div>
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div className="border rounded-lg bg-gray-900 text-gray-300 mt-8 overflow-hidden">
                <div className="p-4 bg-gray-800 border-b border-gray-700">
                   <h3 className="text-white font-semibold">📝 Test Logs</h3>
                </div>
                <div className="p-4 font-mono text-xs max-h-[400px] overflow-y-auto space-y-1">
                  {logs.map((log, i) => (
                    <div key={i}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-blue-50 mt-8">
              <h3 className="font-semibold mb-4">📖 How to Use</h3>
              
              <div className="mb-6">
                <h4 className="text-green-700 font-medium mb-2">✅ Testing Success Scenario:</h4>
                <ol className="list-decimal list-inside text-sm space-y-1 pl-2">
                  <li>Click "Test Success" to create a payment in escrow</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>Wait for transaction to confirm</li>
                  <li>Click "Call Backend API" to test the full flow</li>
                  <li>Backend will confirm payment and release funds to merchant</li>
                  <li>Check "Internal Transactions" tab to see ETH leaving escrow</li>
                </ol>
              </div>

              <div className="mb-6">
                <h4 className="text-amber-700 font-medium mb-2">⚠️ Testing Failure Scenario:</h4>
                <ol className="list-decimal list-inside text-sm space-y-1 pl-2">
                  <li>Click "Test Failure" to create a payment in escrow</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>Wait for transaction to confirm</li>
                  <li>Payment stays in escrow (backend won't confirm it)</li>
                  <li>Wait 15 minutes</li>
                  <li>Go to <a href="/test-escrow" className="text-blue-600 hover:underline font-medium">Test Escrow page</a></li>
                  <li>Use the Payment ID to trigger a refund</li>
                </ol>
              </div>

              <div className="p-3 bg-amber-100 rounded-md text-sm">
                <strong>💡 Pro Tip:</strong> Use the "Internal Transactions" button to verify:
                <ul className="list-disc list-inside mt-2 pl-2">
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
