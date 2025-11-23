'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import { escrowABI } from '@/lib/escrowABI';
import { generateOrderId, getEscrowContractAddress } from '@/lib/escrowUtils';

import { Button } from '@coinbase/cds-web/buttons';
import { TextInput } from '@coinbase/cds-web/controls';
import { Text } from '@coinbase/cds-web/typography';
import { ContentCard, ContentCardBody } from '@coinbase/cds-web/cards';
import { Box, VStack, HStack, Divider } from '@coinbase/cds-web/layout';
import { Spinner } from '@coinbase/cds-web/loaders';
import { Banner } from '@coinbase/cds-web/banner/Banner';

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
  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
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

    if (!currentPaymentId) {
      showError('No payment ID available');
      return;
    }

    setStatus('pending');
    setStatusTitle('💳 Waiting for Wallet Approval...');
    setStatusContent({ processing: true, message: 'Please approve the transaction in your wallet' });

    try {
      const amountInWei = parseEther(amount);
      const orderId = generateOrderId(currentPaymentId);
      const escrowAddress = getEscrowContractAddress();

      console.log('📤 Creating escrow payment...');
      console.log('   Order ID:', orderId);
      console.log('   Amount:', amount, 'ETH');
      console.log('   Escrow Contract:', escrowAddress);

      writeContract({
        address: escrowAddress,
        abi: escrowABI,
        functionName: 'createPayment',
        args: [orderId],
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
      <Box 
        minHeight="100vh" 
        padding={4} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        backgroundColor="bg"
      >
        <Box maxWidth="800px" width="100%">
          <ContentCard>
            <ContentCardBody>
              <VStack gap={4}>
                <Box>
                  <Text font="display1" as="h1" color="fgPrimary">
                    🤖 x402 Purchasing Agent
                  </Text>
                  <Text font="body" color="fgMuted">
                    Enter your phone number to get started
                  </Text>
                </Box>

                <form onSubmit={handlePhoneSubmit}>
                  <VStack gap={4}>
                    <TextInput
                      label="Phone Number"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                      helperText="💡 We'll create a secure wallet for you using Coinbase CDP. Your wallet will be linked to this phone number."
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSettingUp}
                    >
                      {isSettingUp ? 'Creating Wallet...' : 'Continue'}
                    </Button>
                  </VStack>
                </form>
              </VStack>
            </ContentCardBody>
          </ContentCard>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      minHeight="100vh" 
      padding={4} 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      backgroundColor="bg"
    >
      <Box maxWidth="800px" width="100%">
        <ContentCard>
          <ContentCardBody>
            <VStack gap={6}>
              {/* Header */}
              <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={4}>
                <VStack>
                  <Text font="display1" as="h1" color="fgPrimary">
                    🤖 x402 Purchasing Agent
                  </Text>
                  <Text font="body" color="fgMuted">
                    Real USDC payments on Base Sepolia
                  </Text>
                  <Text font="caption" color="fgMuted" marginTop={1}>
                    📱 Wallet: {userWallet.address.slice(0, 6)}...{userWallet.address.slice(-4)}
                  </Text>
                </VStack>
                <ConnectButton />
              </HStack>

              {/* Pricing Info */}
              <Box 
                backgroundColor="bgElevation1" 
                padding={4} 
                borderRadius="400"
                borderLeftWidth="300"
                borderColor="bgPrimary"
              >
                <VStack gap={3}>
                  <Text font="title3" as="h3">💰 Payment Structure</Text>
                  
                  <HStack justifyContent="space-between">
                    <Text color="fgMuted">Agent Service Fee (fixed)</Text>
                    <Text font="headline" color="fgPrimary">{AGENT_FEE.toFixed(2)} USDC</Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between">
                    <Text color="fgMuted">Product Cost</Text>
                    <Text font="headline" color="fgPrimary">Your input below</Text>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justifyContent="space-between">
                    <Text font="headline" fontWeight="bold">Total x402 Payment</Text>
                    <Text font="headline" fontWeight="bold">Agent Fee + Product Cost</Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <VStack gap={4}>
                  <TextInput
                    label="What would you like to buy?"
                    placeholder="e.g., USB-C charger, headphones, laptop..."
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    helperText="💡 The agent will automatically look up the price for you!"
                  />

                  <HStack gap={3}>
                    <Button type="submit" variant="primary" flexGrow={1}>
                      Request Agent Service
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      flexGrow={1}
                      onClick={() => {
                        resetForm();
                        setUserWallet(null);
                        setPhoneNumber('');
                      }}
                    >
                      Change Phone Number
                    </Button>
                  </HStack>
                </VStack>
              </form>

              {/* Status Panel */}
              {status !== 'idle' && (
                <Banner
                  variant={status === 'error' ? 'error' : status === 'success' ? 'informational' : 'warning'}
                  title={statusTitle}
                  startIcon={status === 'pending' ? 'info' : status === 'success' ? 'checkmark' : 'error'}
                  startIconActive
                  styleVariant="inline"
                >
                   <Box marginTop={2}>
                    <StatusContent 
                      status={status} 
                      content={statusContent}
                      onPayNow={handleManualPayment}
                    />
                   </Box>
                </Banner>
              )}
            </VStack>
          </ContentCardBody>
        </ContentCard>
      </Box>
    </Box>
  );
}

function StatusContent({ status, content, onPayNow }: { status: string; content: any; onPayNow?: () => void }) {
  if (!content) return null;

  if (content.loading) {
    return (
      <HStack justifyContent="center" padding={4}>
        <Spinner size={2} />
      </HStack>
    );
  }

  if (content.processing) {
    return (
      <VStack alignItems="center" gap={2}>
        <Spinner size={2} />
        <Text>{content.message || 'Processing...'}</Text>
      </VStack>
    );
  }

  if (content.payment && content.waitingForPayment) {
    return (
      <VStack gap={4}>
        <Box 
          backgroundColor="bg" 
          padding={3} 
          borderRadius="200" 
          borderWidth="100" 
          borderColor="bgLine"
        >
          <VStack gap={1}>
            <Text><strong>Payment ID:</strong> {content.payment.id}</Text>
            <Text><strong>Product Price:</strong> {content.payment.breakdown.productPrice} ETH</Text>
            <Text><strong>Agent Fee:</strong> {content.payment.breakdown.agentFee} ETH</Text>
            <Text><strong>Total Amount:</strong> <Text as="span" color="fgPrimary" font="headline">{content.payment.breakdown.total} ETH</Text></Text>
            <Text><strong>Network:</strong> Base Sepolia</Text>
            <Text><strong>Your Wallet:</strong> {content.userWalletAddress ? `${content.userWalletAddress.slice(0, 6)}...${content.userWalletAddress.slice(-4)}` : 'N/A'}</Text>
          </VStack>
        </Box>

        {!content.isConnected ? (
          <Text color="fgNegative" fontWeight="bold">
            ⚠️ Please connect your wallet above to pay
          </Text>
        ) : (
          <VStack gap={3}>
            <Text color="fgMuted">
              Send {content.payment.breakdown.total} ETH to your CDP wallet.
              Funds will be held in your secure wallet linked to your phone number.
            </Text>
            <Button 
              onClick={onPayNow}
              variant="primary"
            >
              💳 Pay {content.payment.breakdown.total} ETH
            </Button>
          </VStack>
        )}
      </VStack>
    );
  }

  if (content.success) {
    return (
      <VStack gap={4}>
        <Box backgroundColor="bg" padding={3} borderRadius="200">
          <VStack gap={2}>
            <Text font="headline" color="fgPrimary">✅ Payment Confirmed</Text>
            <Text>Payment ID: {content.paymentId}</Text>
            <Text>Amount: {content.amount} ETH</Text>
            <Box>
              <Text backgroundColor="bgPositive" color="fgInverse" paddingX={2} paddingY={1} borderRadius="100" as="span">PAID</Text>
            </Box>
          </VStack>
        </Box>
        
        <Box backgroundColor="bg" padding={3} borderRadius="200">
          <VStack gap={2}>
            <Text font="headline" color="fgPrimary">🤖 Agent Result</Text>
            <Text>Status: {content.result.status}</Text>
            <ResultDetails result={content.result} />
          </VStack>
        </Box>
      </VStack>
    );
  }

  if (content.error) {
    return <Text color="fgNegative">{content.error}</Text>;
  }

  return <pre>{JSON.stringify(content, null, 2)}</pre>;
}

function ResultDetails({ result }: { result: any }) {
  if (result.orderId) {
    return (
      <VStack gap={1}>
        <Text>Order ID: {result.orderId}</Text>
        <Text>Product: {result.product.name}</Text>
        <Text>Price: {result.product.price}</Text>
        <Text>Message: {result.message}</Text>
      </VStack>
    );
  }

  if (result.results) {
    return (
      <VStack gap={1}>
        <Text>Found {result.resultsCount} products:</Text>
        {result.results.map((r: any, i: number) => (
          <Text key={i}>
            • {r.name} - {r.price} (⭐ {r.rating})
          </Text>
        ))}
      </VStack>
    );
  }

  if (result.comparison) {
    return (
      <VStack gap={1}>
        <Text>
          Recommendation: {result.recommendation}
        </Text>
        {result.comparison.map((c: any, i: number) => (
          <Text key={i}>
            • {c.vendor}: {c.price} + {c.shipping} shipping
          </Text>
        ))}
      </VStack>
    );
  }

  return null;
}
