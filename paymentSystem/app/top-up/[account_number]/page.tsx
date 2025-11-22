'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TopUpPage() {
  const params = useParams();
  const accountNumber = params.account_number as string;
  
  const [amount, setAmount] = useState('');
  const [showAmount, setShowAmount] = useState(false);

  const handleTopUp = () => {
    const inputAmount = prompt('Enter amount to top up (USD):', '10');
    
    if (inputAmount && parseFloat(inputAmount) > 0) {
      setAmount(inputAmount);
      setShowAmount(true);
      console.log(`Top-up request for account ${accountNumber}: $${inputAmount}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%',
        padding: '40px 30px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 700,
          color: '#333',
          marginBottom: '10px',
        }}>
          Account
        </h1>
        <p style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: '#666',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          marginBottom: '40px',
        }}>
          {accountNumber}
        </p>
        
        <button
          onClick={handleTopUp}
          style={{
            width: '100%',
            fontSize: 'clamp(20px, 5vw, 32px)',
            fontWeight: 600,
            padding: '25px',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          Top Up
        </button>

        {showAmount && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#d4edda',
            borderRadius: '10px',
            borderLeft: '4px solid #28a745',
          }}>
            <p style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              color: '#155724',
              fontWeight: 600,
              margin: 0,
            }}>
              ✅ Top-up request: ${amount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
