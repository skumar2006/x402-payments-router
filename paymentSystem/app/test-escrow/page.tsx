'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther, keccak256, toHex } from 'viem';
import { escrowABI } from '@/lib/escrowABI';
import { getEscrowContractAddress } from '@/lib/escrowUtils';
import { Button } from '@coinbase/cds-web/buttons';
import { TextInput } from '@coinbase/cds-web/controls';
import { Text } from '@coinbase/cds-web/typography';
import { ContentCard, ContentCardBody } from '@coinbase/cds-web/cards';
import { Box, VStack, HStack, Divider } from '@coinbase/cds-web/layout';
import { Banner } from '@coinbase/cds-web/banner/Banner';
import { Link } from '@coinbase/cds-web/typography/Link';

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
    <Box 
      minHeight="100vh" 
      padding={4} 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      background="bg"
    >
      <Box maxWidth="800px" width="100%">
        <ContentCard>
          <ContentCardBody>
            <VStack gap={6}>
              <Box>
                <Link href="/" color="primary">
                  ← Back to Main App
                </Link>
              </Box>
              
              <Box>
                <Text font="display1" as="h1" color="fgPrimary">
                  🧪 Escrow Contract Testing
                </Text>
                <Text font="body" color="fgMuted">
                  Test the X402 escrow contract functions
                </Text>
              </Box>

              {/* Wallet Connection */}
              <HStack justifyContent="center">
                <ConnectButton />
              </HStack>

              {!isConnected ? (
                <Text textAlign="center" color="fgMuted">
                  👆 Connect your wallet to test the escrow contract
                </Text>
              ) : (
                <VStack gap={6}>
                  {/* Contract Info */}
                  <Box 
                    backgroundColor="bgElevation1" 
                    padding={4} 
                    borderRadius="300"
                  >
                    <VStack gap={2}>
                      <Text font="title3" as="h3">📄 Contract Info</Text>
                      <Divider />
                      <VStack gap={1}>
                        <Text><strong>Contract:</strong> {escrowAddress}</Text>
                        <Text><strong>Merchant:</strong> {merchantWallet as string}</Text>
                        <Text><strong>Timeout:</strong> {timeout ? `${timeout.toString()} seconds (15 min)` : 'Loading...'}</Text>
                        <Text><strong>Your Address:</strong> {address}</Text>
                      </VStack>
                    </VStack>
                  </Box>

                  {/* Order ID Input */}
                  <VStack gap={2}>
                    <TextInput
                      label="Order ID (for testing)"
                      value={orderId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderId(e.target.value)}
                      placeholder="e.g., test-123 or payment-abc"
                      helperText="💡 Use a unique ID for each test payment"
                      end={
                        <Button
                          onClick={generateRandomOrderId}
                          variant="secondary"
                          compact
                        >
                          🎲 Random
                        </Button>
                      }
                    />
                  </VStack>

                  {/* Create Payment */}
                  <VStack gap={2}>
                    <TextInput
                      label="Amount (ETH)"
                      value={amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                      placeholder="0.01"
                    />
                    <Button
                      onClick={handleCreatePayment}
                      disabled={isCreating || isCreateLoading || !orderId}
                      variant="primary"
                    >
                      {isCreating || isCreateLoading ? '⏳ Creating Payment...' : '💰 Create Payment (Lock ETH)'}
                    </Button>
                    <Text font="caption" color="fgMuted">
                      This locks your ETH in the escrow contract
                    </Text>
                  </VStack>

                  {/* Action Buttons */}
                  <HStack gap={3} flexWrap="wrap">
                    <Box flexGrow={1} width={{ base: '100%', tablet: 'auto' }}>
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={isConfirming || isConfirmLoading || !orderId}
                        variant="positive"
                        width="100%"
                      >
                        {isConfirming || isConfirmLoading ? '⏳ Confirming...' : '✅ Confirm Payment'}
                      </Button>
                    </Box>
                    
                    <Box flexGrow={1} width={{ base: '100%', tablet: 'auto' }}>
                      <Button
                        onClick={handleRefundPayment}
                        disabled={isRefunding || isRefundLoading || !orderId}
                        variant="secondary" // Negative variant might be too strong, maybe warning color if possible, but secondary is safe
                        width="100%"
                      >
                        {isRefunding || isRefundLoading ? '⏳ Refunding...' : '↩️ Refund (After Timeout)'}
                      </Button>
                    </Box>
                  </HStack>

                  <Button
                    onClick={handleCheckPayment}
                    disabled={!orderId}
                    variant="secondary"
                  >
                    🔍 Check Payment Status
                  </Button>

                  {/* Status */}
                  {status && (
                    <Banner
                      variant={status.includes('Error') ? 'error' : status.includes('✅') ? 'informational' : 'warning'}
                      title="Status"
                      startIcon={status.includes('Error') ? 'error' : status.includes('✅') ? 'checkmark' : 'info'}
                      startIconActive
                      styleVariant="inline"
                    >
                      <VStack gap={2}>
                        <Text>{status}</Text>
                        {lastTxHash && (
                          <Link
                            href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                          >
                            View on BaseScan →
                          </Link>
                        )}
                      </VStack>
                    </Banner>
                  )}

                  {/* Payment Details */}
                  {paymentData && (
                    <Box 
                      backgroundColor="bgElevation1" 
                      padding={4} 
                      borderRadius="300"
                    >
                      <VStack gap={2}>
                        <Text font="title3" as="h3">💳 Payment Details</Text>
                        <Divider />
                        <VStack gap={1}>
                          <Text><strong>Payer:</strong> {paymentData[0]}</Text>
                          <Text><strong>Amount:</strong> {formatEther(paymentData[1])} ETH</Text>
                          <Text><strong>Timestamp:</strong> {new Date(Number(paymentData[2]) * 1000).toLocaleString()}</Text>
                          <Text><strong>Completed:</strong> {paymentData[3] ? '✅ Yes' : '❌ No'}</Text>
                        </VStack>
                        <Banner 
                          variant={paymentData[3] ? 'informational' : 'warning'}
                          startIcon={paymentData[3] ? 'checkmark' : 'clock'}
                          startIconActive
                          styleVariant="inline"
                        >
                          {paymentData[3] ? (
                            '✅ This payment has been completed (confirmed or refunded)'
                          ) : (
                            '⏳ This payment is still in escrow. You can confirm it or wait 15 minutes to refund.'
                          )}
                        </Banner>
                      </VStack>
                    </Box>
                  )}

                  {/* Instructions */}
                  <Box 
                    backgroundColor="bgElevation1" 
                    padding={4} 
                    borderRadius="300"
                  >
                    <VStack gap={2}>
                      <Text font="title3" as="h3">📖 Testing Instructions</Text>
                      <VStack as="ol" gap={2} paddingStart={4}>
                        <Text as="li"><strong>Create Payment:</strong> Enter an order ID and amount, then click "Create Payment" to lock ETH in escrow</Text>
                        <Text as="li"><strong>Confirm Payment:</strong> Click "Confirm Payment" to release funds to the merchant (simulates successful agent completion)</Text>
                        <Text as="li"><strong>Refund:</strong> Wait 15 minutes after creating a payment, then click "Refund" to get your ETH back (simulates timeout)</Text>
                        <Text as="li"><strong>Check Status:</strong> Use "Check Payment Status" to see current payment details</Text>
                      </VStack>
                      <Banner 
                        variant="warning" 
                        title="Note"
                        startIcon="warning"
                        startIconActive
                        styleVariant="inline"
                      >
                        This is for testing only! In production, only your backend should call confirmPayment.
                      </Banner>
                    </VStack>
                  </Box>
                </VStack>
              )}
            </VStack>
          </ContentCardBody>
        </ContentCard>
      </Box>
    </Box>
  );
}
