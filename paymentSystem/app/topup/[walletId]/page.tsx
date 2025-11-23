'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import { Loader2, Wallet, CreditCard, ArrowLeft, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface WalletInfo {
  address: string;
  walletId: string;
  phoneNumber?: string;
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
          phoneNumber: data.phoneNumber || 'N/A'
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
           <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="text-muted-foreground">Loading wallet information...</p>
           </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !walletInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
             <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Error
             </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg font-medium">{error || 'Wallet not found'}</p>
            <p className="text-muted-foreground">The wallet ID in this link is invalid or doesn't exist.</p>
            <Button onClick={() => router.push('/')} variant="secondary">
               <ArrowLeft className="mr-2 h-4 w-4" /> Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show top-up interface
  return (
    <div className="min-h-screen p-4 bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" /> Top Up Wallet
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
               <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          <CardDescription>Add funds to your x402 agent wallet</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="bg-secondary/30 p-4 rounded-lg space-y-3 border">
            <h3 className="font-medium text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Your Wallet
            </h3>
            <div className="grid gap-1">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Address</span>
                 <span className="font-mono text-xs truncate max-w-[200px]" title={walletInfo.address}>{walletInfo.address}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Phone</span>
                 <span className="font-medium">{walletInfo.phoneNumber}</span>
               </div>
            </div>
          </div>

          {/* Balance Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <h3 className="font-medium text-sm">Current Balance</h3>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 text-xs"
                 onClick={handleRefreshBalance}
                 disabled={loadingBalance}
               >
                 <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance ? 'animate-spin' : ''}`} />
                 Refresh
               </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {loadingBalance ? (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-2">Loading...</div>
                ) : Object.keys(balance).length > 0 ? (
                    Object.entries(balance).map(([asset, amount]) => (
                        <div key={asset} className="bg-card border rounded p-2 text-center">
                            <div className="text-xs text-muted-foreground">{asset}</div>
                            <div className="font-mono font-medium">{parseFloat(amount).toFixed(4)}</div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-2 border border-dashed rounded">
                        No balance yet
                    </div>
                )}
            </div>
          </div>

          <Separator />

          {/* Method Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-lg">
            <Button 
                variant={!showExternalWallet ? "default" : "ghost"}
                onClick={() => setShowExternalWallet(false)}
                className="w-full"
                size="sm"
            >
                Apple Pay
            </Button>
            <Button 
                variant={showExternalWallet ? "default" : "ghost"}
                onClick={() => setShowExternalWallet(true)}
                className="w-full"
                size="sm"
            >
                Ext. Wallet
            </Button>
          </div>

          {!showApplePay && !showExternalWallet ? (
            <form onSubmit={handleTopUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  📧 Required for payment verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max="500"
                  step="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  💵 Minimum: $10 | Maximum: $500
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Order...
                    </>
                ) : (
                    'Pay with Apple Pay'
                )}
              </Button>
            </form>
          ) : showExternalWallet ? (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center space-y-4 py-4">
                   <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-blue-600" />
                   </div>
                   <div>
                       <h4 className="font-medium">Connect External Wallet</h4>
                       <p className="text-sm text-muted-foreground mt-1">
                         Send funds from MetaMask, Rainbow, or Coinbase Wallet
                       </p>
                   </div>
                   <div className="flex justify-center">
                        <ConnectButton />
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-secondary/30 p-3 rounded text-sm space-y-2 border">
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">From:</span>
                         <span className="font-mono text-xs truncate w-32">{externalAddress}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">To:</span>
                         <span className="font-mono text-xs truncate w-32">{walletInfo.address}</span>
                      </div>
                   </div>

                   <div className="space-y-2">
                        <Label htmlFor="externalAmount">Amount (ETH)</Label>
                        <Input
                            type="number"
                            id="externalAmount"
                            value={externalWalletAmount}
                            onChange={(e) => setExternalWalletAmount(e.target.value)}
                            min="0.001"
                            step="0.001"
                        />
                        <p className="text-xs text-muted-foreground">
                            💰 Available in your connected wallet
                        </p>
                    </div>

                    {status && (
                        <Alert>
                            <AlertTitle>Status</AlertTitle>
                            <AlertDescription>{status}</AlertDescription>
                        </Alert>
                    )}

                    <Button 
                        onClick={handleExternalWalletTopUp} 
                        className="w-full"
                        disabled={isSending || isConfirming}
                    >
                        {isSending || isConfirming ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                            `Send ${externalWalletAmount} ETH`
                        )}
                    </Button>
                </div>
              )}
            </div>
          ) : showApplePay ? (
            <div className="space-y-4">
                <div className="text-center space-y-2">
                    <h3 className="font-medium">Complete Payment</h3>
                    {status && <p className="text-sm text-muted-foreground">{status}</p>}
                </div>

                <div className="w-full h-[60px] border rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                     <iframe
                        ref={iframeRef}
                        src={paymentLinkUrl}
                        className="w-full h-full border-0"
                        allow="payment"
                        title="Apple Pay"
                    />
                </div>

                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                        setShowApplePay(false);
                        setPaymentLinkUrl('');
                        setStatus('');
                    }}
                >
                    Cancel
                </Button>
            </div>
          ) : null}
        </CardContent>
        
        <CardFooter className="flex-col gap-4 bg-muted/20 border-t pt-4">
            <div className="text-xs text-muted-foreground space-y-1 w-full">
                <p className="font-medium">ℹ️ About Apple Pay Top-Up</p>
                <ul className="list-disc list-inside pl-1 space-y-0.5">
                    <li>Fast and secure payments</li>
                    <li>Supports debit cards</li>
                    <li>Funds arrive within minutes</li>
                </ul>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
