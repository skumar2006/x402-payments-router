'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@coinbase/cds-web/buttons';
import { TextInput } from '@coinbase/cds-web/controls';
import { Text } from '@coinbase/cds-web/typography';
import { ContentCard, ContentCardBody } from '@coinbase/cds-web/cards';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Banner } from '@coinbase/cds-web/banner/Banner';

export default function TopUpPage() {
  const params = useParams();
  const accountNumber = params.account_number as string;
  
  const [amount, setAmount] = useState('10'); // Default 10
  const [submittedAmount, setSubmittedAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTopUp = () => {
    if (amount && parseFloat(amount) > 0) {
      setSubmittedAmount(amount);
      setShowSuccess(true);
      console.log(`Top-up request for account ${accountNumber}: $${amount}`);
    }
  };

  return (
    <Box 
      minHeight="100vh" 
      padding={4} 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      backgroundColor="bg"
    >
      <Box maxWidth="500px" width="100%">
        <ContentCard>
          <ContentCardBody>
            <VStack gap={6} alignItems="center" textAlign="center">
              <VStack gap={1} alignItems="center">
                <Text font="display1" as="h1" color="fgPrimary">
                  Account
                </Text>
                <Text font="headline" color="fgMuted" style={{ wordBreak: 'break-all' }}>
                  {accountNumber}
                </Text>
              </VStack>
              
              <VStack gap={4} width="100%">
                <TextInput
                  label="Amount (USD)"
                  type="number"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  placeholder="10"
                />

                <Button
                  onClick={handleTopUp}
                  variant="primary"
                  width="100%"
                >
                  Top Up
                </Button>
              </VStack>

              {showSuccess && (
                <Banner 
                  variant="informational"
                  startIcon="checkmark"
                  startIconActive
                  styleVariant="inline"
                >
                  <Text fontWeight="bold">
                    ✅ Top-up request: ${submittedAmount}
                  </Text>
                </Banner>
              )}
            </VStack>
          </ContentCardBody>
        </ContentCard>
      </Box>
    </Box>
  );
}
