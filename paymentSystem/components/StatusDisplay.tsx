import React from 'react';
import { Box } from '@coinbase/cds-web/layout/Box';
import { Text } from '@coinbase/cds-web/typography/Text';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { Button } from '@coinbase/cds-web/buttons/Button';
import { Spinner } from '@coinbase/cds-web/loaders/Spinner';
import { Tag } from '@coinbase/cds-web/tag/Tag';
import { Alert } from '@coinbase/cds-web/overlays/Alert';
import { ResultDetails } from './ResultDetails';
import { PurchaseState } from '../app/types';

interface StatusDisplayProps {
  state: PurchaseState;
  onPayNow: () => void;
  isConnected: boolean;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ state, onPayNow, isConnected }) => {
  const { status, statusTitle, statusMessage, paymentData, resultData, error } = state;

  if (status === 'idle') return null;

  return (
    <Box 
      marginTop={6} 
      padding={4} 
      borderRadius="large" 
      border="1px solid" 
      borderColor={status === 'error' ? 'fgNegative' : status === 'success' ? 'fgPositive' : 'bgLine'}
      backgroundColor={status === 'error' ? 'bgNegativeWash' : status === 'success' ? 'bgPositiveWash' : 'bg'}
    >
      <VStack gap={4}>
        <Text font="title3">{statusTitle}</Text>
        
        {(status === 'pending' || status === 'confirming_payment' || status === 'verifying_payment') && (
          <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
            <Spinner size="medium" color="foreground" />
            <Text>{statusMessage || 'Processing...'}</Text>
          </Box>
        )}

        {status === 'payment_required' && paymentData && (
          <VStack gap={4}>
             <Box>
               <Text font="label1">Payment ID: {paymentData.payment.id}</Text>
               <Text>Product Price: {paymentData.payment.breakdown.productPrice} ETH</Text>
               <Text>Agent Fee: {paymentData.payment.breakdown.agentFee} ETH</Text>
               <Text font="headline" color="fgPrimary">Total: {paymentData.payment.breakdown.total} ETH</Text>
               <Text>Network: Base Sepolia</Text>
             </Box>

             {!isConnected ? (
                <Alert intent="error" title="Wallet Not Connected">
                  Please connect your wallet above to pay
                </Alert>
             ) : (
               <>
                 <Text color="fgMuted">
                   Send {paymentData.payment.breakdown.total} ETH to your CDP wallet.
                   Funds will be held in your secure wallet linked to your phone number.
                 </Text>
                 <Button 
                   onClick={onPayNow}
                   variant="primary"
                   // startIcon="wallet" // Check if startIcon is valid or needs Icon component
                   width="100%"
                 >
                   Pay {paymentData.payment.breakdown.total} ETH
                 </Button>
               </>
             )}
          </VStack>
        )}

        {status === 'success' && resultData && (
          <VStack gap={4}>
             <Box>
                <Tag intent="positive" size="medium">PAID</Tag>
                <Box marginTop={2}>
                  <Text>Payment ID: {resultData.paymentId}</Text>
                  <Text>Amount: {resultData.amount} USDC</Text>
                </Box>
             </Box>
             
             <Box>
               <Text font="label1">🤖 Agent Result</Text>
               <Text>Status: {resultData.result.status}</Text>
               <Box marginTop={2}>
                 <ResultDetails result={resultData.result} />
               </Box>
             </Box>
          </VStack>
        )}

        {status === 'error' && (
          <Text color="fgNegative">{error || 'An unknown error occurred'}</Text>
        )}
      </VStack>
    </Box>
  );
};

