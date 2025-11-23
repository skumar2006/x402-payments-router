'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet } from 'lucide-react';

export default function TopUpPage() {
  const params = useParams();
  const accountNumber = params.account_number as string;
  
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      setShowSuccess(true);
      console.log(`Top-up request for account ${accountNumber}: $${amount}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
           <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
              <Wallet className="h-6 w-6 text-primary" />
           </div>
           <CardTitle className="text-2xl">Account Top Up</CardTitle>
           <CardDescription className="font-mono text-xs break-all mt-2">
              {accountNumber}
           </CardDescription>
        </CardHeader>
        <CardContent>
            {showSuccess ? (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-800">
                  <p className="font-medium text-lg">✅ Request Sent</p>
                  <p className="text-sm mt-1">Top-up amount: ${amount}</p>
               </div>
            ) : (
               <form onSubmit={handleTopUp} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="amount">Amount (USD)</Label>
                     <Input 
                        id="amount"
                        type="number" 
                        placeholder="Enter amount" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                        required
                        className="text-lg h-12"
                     />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg">
                     Top Up
                  </Button>
               </form>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
