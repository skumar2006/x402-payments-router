'use client';

import { useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [statusTitle, setStatusTitle] = useState('');
  const [statusContent, setStatusContent] = useState<any>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);

  const AGENT_FEE = 2.00; // Fixed agent fee in USDC

  const resetForm = () => {
    setQuery('');
    setProductPrice('');
    setStatus('idle');
    setStatusTitle('');
    setStatusContent(null);
    setCurrentPaymentId(null);
    setCurrentPaymentData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePurchaseRequest();
  };

  const handlePurchaseRequest = async () => {
    // Validate product price
    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid product price');
      return;
    }

    setStatus('pending');
    setStatusTitle('Requesting Agent Service...');
    setStatusContent({ loading: true });

    try {
      // Step 1: Request agent service (will get 402)
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: query,
            productPrice: price,
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
    });
  };

  const handleManualPayment = () => {
    simulatePayment();
  };

  const simulatePayment = async () => {
    setStatus('pending');
    setStatusTitle('🔄 Processing Payment...');
    setStatusContent({ processing: true });

    try {
      // Simulate payment proof
      const paymentProof = {
        paymentId: currentPaymentId!,
        signature: '0x' + Array(130).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join(''),
        transactionHash: '0x' + Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join(''),
      };

      // Submit payment and execute agent workflow
      const price = parseFloat(productPrice);
      const response = await fetch('/api/agent/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            query: query,
            productPrice: price,
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🤖 x402 Purchasing Agent</h1>
        <p className={styles.subtitle}>
          Test the x402 payment protocol with a mock purchasing agent
        </p>

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
              placeholder="e.g., Buy me the cheapest USB-C charger available on Amazon"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="productPrice">Expected Product Price (USDC)</label>
            <input
              type="number"
              id="productPrice"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="e.g., 15.99"
              step="0.01"
              min="0.01"
              required
              className={styles.priceInput}
            />
            <p className={styles.helperText}>
              Total payment will be: <strong>{AGENT_FEE.toFixed(2)} USDC</strong> (agent fee) + <strong>{productPrice || '0.00'} USDC</strong> (product) = <strong>{(AGENT_FEE + parseFloat(productPrice || '0')).toFixed(2)} USDC</strong>
            </p>
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.btnPrimary}>
              Request Agent Service
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={resetForm}
            >
              Reset
            </button>
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
        <p>Verifying payment with facilitator...</p>
      </>
    );
  }

  if (content.payment && content.waitingForPayment) {
    return (
      <>
        <div className={styles.paymentDetails}>
          <strong>Payment ID:</strong> {content.payment.id}
          <br />
          <strong>Product Price:</strong> {content.payment.breakdown.productPrice} USDC
          <br />
          <strong>Agent Fee:</strong> {content.payment.breakdown.agentFee} USDC
          <br />
          <strong>Total Amount:</strong> <span style={{ color: '#667eea', fontSize: '18px', fontWeight: 'bold' }}>{content.payment.breakdown.total} USDC</span>
          <br />
          <strong>Network:</strong> base
        </div>
        <p style={{ marginTop: '15px', color: '#666', marginBottom: '15px' }}>
          In a real implementation, your wallet (Coinbase Wallet, MetaMask, etc.) would pop up here to sign the payment authorization.
        </p>
        <button 
          onClick={onPayNow}
          className={styles.btnPayNow}
        >
          💳 Simulate Payment (Demo)
        </button>
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

