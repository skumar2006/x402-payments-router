'use client';

import React, { useState, useReducer, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { SetupView } from '../components/SetupView';
import { MainView } from '../components/MainView';
import { UserWallet, PurchaseState, PaymentResponse } from './types';

// Reducer for Purchase Flow
type Action = 
  | { type: 'RESET' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'START_REQUEST' }
  | { type: 'PAYMENT_REQUIRED'; payload: PaymentResponse }
  | { type: 'SUCCESS'; payload: any }
  | { type: 'ERROR'; payload: string }
  | { type: 'INITIATE_PAYMENT' }
  | { type: 'CONFIRM_TRANSACTION' }
  | { type: 'VERIFYING_PAYMENT' };

const initialState: PurchaseState = {
  status: 'idle',
  statusTitle: '',
  query: '',
};

function purchaseReducer(state: PurchaseState, action: Action): PurchaseState {
  switch (action.type) {
    case 'RESET': 
      return { ...initialState };
    case 'SET_QUERY': 
      return { ...state, query: action.payload };
    case 'START_REQUEST': 
      return { ...state, status: 'pending', statusTitle: 'Looking up product price...', error: undefined };
    case 'PAYMENT_REQUIRED':
      return { 
        ...state, 
        status: 'payment_required', 
        statusTitle: '💳 Payment Required', 
        paymentData: action.payload 
      };
    case 'INITIATE_PAYMENT':
      return { 
        ...state, 
        status: 'pending', 
        statusTitle: '💳 Waiting for Wallet Approval...', 
        statusMessage: 'Please approve the transaction in your wallet' 
      };
    case 'CONFIRM_TRANSACTION':
      return { 
        ...state, 
        status: 'confirming_payment', 
        statusTitle: '⏳ Confirming Transaction...', 
        statusMessage: 'Waiting for on-chain confirmation...' 
      };
    case 'VERIFYING_PAYMENT':
      return { 
        ...state, 
        status: 'verifying_payment', 
        statusTitle: '🔄 Verifying Payment...', 
        statusMessage: 'Confirming transaction on-chain...' 
      };
    case 'SUCCESS':
      return { 
        ...state, 
        status: 'success', 
        statusTitle: '🎉 Agent Workflow Complete!', 
        resultData: action.payload 
      };
    case 'ERROR':
      return { 
        ...state, 
        status: 'error', 
        statusTitle: '❌ Error', 
        error: action.payload 
      };
    default: 
      return state;
  }
}

export default function Home() {
  // User State
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  
  // Purchase State
  const [state, dispatch] = useReducer(purchaseReducer, initialState);
  
  const AGENT_FEE = 0.001;

  // Wagmi Hooks
  const { address, isConnected } = useAccount();
  const { sendTransaction, data: hash, isPending: isWritePending, error: writeError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handlers
  const handleWalletCreated = (wallet: UserWallet) => {
    setUserWallet(wallet);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setUserWallet(null);
  };

  const handlePurchaseRequest = async () => {
    dispatch({ type: 'START_REQUEST' });

    try {
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: state.query,
          },
        }),
      });

      const data = await response.json();

      if (response.status === 402) {
        dispatch({ type: 'PAYMENT_REQUIRED', payload: data });
      } else if (response.ok) {
        dispatch({ type: 'SUCCESS', payload: data });
      } else {
        dispatch({ type: 'ERROR', payload: 'Request failed: ' + data.error });
      }
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: 'Network error: ' + error.message });
    }
  };

  const handleManualPayment = () => {
    if (!isConnected) {
      dispatch({ type: 'ERROR', payload: 'Please connect your wallet first' });
      return;
    }
    if (!userWallet) {
      dispatch({ type: 'ERROR', payload: 'No user wallet found' });
      return;
    }
    if (!state.paymentData?.payment) {
      dispatch({ type: 'ERROR', payload: 'No payment data available' });
      return;
    }

    dispatch({ type: 'INITIATE_PAYMENT' });

    try {
      const amountInWei = parseEther(state.paymentData.payment.amount);
      sendTransaction({
        to: userWallet.address as `0x${string}`,
        value: amountInWei,
      });
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: 'Payment failed: ' + error.message });
    }
  };

  const submitPaymentProof = async (txHash: `0x${string}`) => {
    dispatch({ type: 'VERIFYING_PAYMENT' });

    try {
      const paymentProof = {
        paymentId: state.paymentData!.payment.id,
        transactionHash: txHash,
        from: address!,
        signature: txHash,
      };

      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: state.query,
          },
          paymentProof,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'SUCCESS', payload: data });
      } else {
        dispatch({ type: 'ERROR', payload: 'Payment verification failed: ' + data.error });
      }
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: 'Payment error: ' + error.message });
    }
  };

  // Effects
  useEffect(() => {
    if (writeError) {
      dispatch({ type: 'ERROR', payload: 'Transaction failed: ' + (writeError.message || 'Unknown error') });
    }
  }, [writeError]);

  useEffect(() => {
    if (isConfirming && hash) {
      dispatch({ type: 'CONFIRM_TRANSACTION' });
    }
  }, [isConfirming, hash]);

  useEffect(() => {
    if (isConfirmed && hash) {
      submitPaymentProof(hash);
    }
  }, [isConfirmed, hash]);

  // Render
  if (!userWallet) {
    return <SetupView onWalletCreated={handleWalletCreated} />;
  }

  return (
    <MainView 
      userWallet={userWallet}
      purchaseState={state}
      onQueryChange={(q) => dispatch({ type: 'SET_QUERY', payload: q })}
      onSubmit={handlePurchaseRequest}
      onReset={handleReset}
      onPayNow={handleManualPayment}
      isConnected={isConnected}
      agentFee={AGENT_FEE}
    />
  );
}
