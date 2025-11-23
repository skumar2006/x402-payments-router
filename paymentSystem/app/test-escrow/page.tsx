'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther, keccak256, toHex } from 'viem';
import { escrowABI } from '@/lib/escrowABI';
import { getEscrowContractAddress } from '@/lib/escrowUtils';

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
        <h1 className="text-2xl font-bold mb-2">🧪 Escrow Contract Testing</h1>
        <p className="text-gray-600 mb-6">
          Test the X402 escrow contract functions
        </p>

        {/* Wallet Connection */}
        <div className="mb-8 flex justify-center">
          <ConnectButton />
        </div>

        {!isConnected ? (
          <p className="text-center text-gray-600">
            👆 Connect your wallet to test the escrow contract
          </p>
        ) : (
          <>
            {/* Contract Info */}
            <div className="border rounded-lg p-4 bg-gray-50 mb-8">
              <h3 className="font-semibold mb-2">📄 Contract Info</h3>
              <div className="text-sm space-y-1">
                <div><strong>Contract:</strong> {escrowAddress}</div>
                <div><strong>Merchant:</strong> {merchantWallet as string}</div>
                <div><strong>Timeout:</strong> {timeout ? `${timeout.toString()} seconds (15 min)` : 'Loading...'}</div>
                <div><strong>Your Address:</strong> {address}</div>
              </div>
            </div>

            {/* Order ID Input */}
            <div className="mb-6 space-y-2">
              <label className="block font-medium">Order ID (for testing)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., test-123 or payment-abc"
                  className="flex-1 p-2 border rounded-md"
                />
                <button
                  onClick={generateRandomOrderId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  🎲 Random
                </button>
              </div>
              <p className="text-sm text-gray-500">
                💡 Use a unique ID for each test payment
              </p>
            </div>

            {/* Create Payment */}
            <div className="mb-6 space-y-2">
              <label className="block font-medium">Amount (ETH)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className="w-full p-2 border rounded-md"
              />
              <button
                onClick={handleCreatePayment}
                disabled={isCreating || isCreateLoading || !orderId}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium mt-2"
              >
                {isCreating || isCreateLoading ? '⏳ Creating Payment...' : '💰 Create Payment (Lock ETH)'}
              </button>
              <p className="text-sm text-gray-500">
                This locks your ETH in the escrow contract
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <button
                onClick={handleConfirmPayment}
                disabled={isConfirming || isConfirmLoading || !orderId}
                className="py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isConfirming || isConfirmLoading ? '⏳ Confirming...' : '✅ Confirm Payment'}
              </button>
              
              <button
                onClick={handleRefundPayment}
                disabled={isRefunding || isRefundLoading || !orderId}
                className="py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 font-medium"
              >
                {isRefunding || isRefundLoading ? '⏳ Refunding...' : '↩️ Refund (After Timeout)'}
              </button>
            </div>

            <button
              onClick={handleCheckPayment}
              disabled={!orderId}
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium mt-4"
            >
              🔍 Check Payment Status
            </button>

            {/* Status */}
            {status && (
              <div className="border rounded-lg p-4 bg-gray-50 mt-8">
                <h3 className="font-semibold mb-2">📊 Status</h3>
                <div className="text-sm break-all">
                  {status}
                </div>
                {lastTxHash && (
                  <div className="mt-2">
                    <a
                      href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on BaseScan →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Payment Details */}
            {paymentData && (
              <div className="border rounded-lg p-4 bg-gray-50 mt-8">
                <h3 className="font-semibold mb-2">💳 Payment Details</h3>
                <div className="text-sm space-y-2">
                  <div><strong>Payer:</strong> {paymentData[0]}</div>
                  <div><strong>Amount:</strong> {formatEther(paymentData[1])} ETH</div>
                  <div><strong>Timestamp:</strong> {new Date(Number(paymentData[2]) * 1000).toLocaleString()}</div>
                  <div><strong>Completed:</strong> {paymentData[3] ? '✅ Yes' : '❌ No'}</div>
                  <div className={`p-4 rounded-md ${paymentData[3] ? 'bg-green-100' : 'bg-amber-100'}`}>
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
            <div className="border rounded-lg p-4 bg-blue-50 mt-8">
              <h3 className="font-semibold mb-2">📖 Testing Instructions</h3>
              <ol className="list-decimal list-inside text-sm space-y-2 text-gray-700">
                <li><strong>Create Payment:</strong> Enter an order ID and amount, then click "Create Payment" to lock ETH in escrow</li>
                <li><strong>Confirm Payment:</strong> Click "Confirm Payment" to release funds to the merchant (simulates successful agent completion)</li>
                <li><strong>Refund:</strong> Wait 15 minutes after creating a payment, then click "Refund" to get your ETH back (simulates timeout)</li>
                <li><strong>Check Status:</strong> Use "Check Payment Status" to see current payment details</li>
              </ol>
              <div className="p-3 bg-amber-100 rounded-md mt-4 text-sm">
                <strong>⚠️ Note:</strong> This is for testing only! In production, only your backend should call confirmPayment.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
