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
      marginTop="24px" 
      padding="16px" 
      borderRadius="large" 
      border="1px solid" 
      borderColor={status === 'error' ? 'negative' : status === 'success' ? 'positive' : 'line'}
      backgroundColor={status === 'error' ? 'negativeMuted' : status === 'success' ? 'positiveMuted' : 'background'}
    >
      <VStack spacing="16px">
        <Text variant="title3" fontWeight="bold">{statusTitle}</Text>
        
        {(status === 'pending' || status === 'confirming_payment' || status === 'verifying_payment') && (
          <Box display="flex" flexDirection="row" alignItems="center" gap="8px">
            <Spinner size="medium" color="foreground" />
            <Text>{statusMessage || 'Processing...'}</Text>
          </Box>
        )}

        {status === 'payment_required' && paymentData && (
          <VStack spacing="16px">
             <Box>
               <Text fontWeight="bold">Payment ID: {paymentData.payment.id}</Text>
               <Text>Product Price: {paymentData.payment.breakdown.productPrice} ETH</Text>
               <Text>Agent Fee: {paymentData.payment.breakdown.agentFee} ETH</Text>
               <Text variant="headline" color="primary">Total: {paymentData.payment.breakdown.total} ETH</Text>
               <Text>Network: Base Sepolia</Text>
             </Box>

             {!isConnected ? (
                <Alert intent="error" title="Wallet Not Connected">
                  Please connect your wallet above to pay
                </Alert>
             ) : (
               <>
                 <Text color="foregroundMuted">
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
          <VStack spacing="16px">
             <Box>
                <Tag intent="positive" size="medium">PAID</Tag>
                <Box marginTop="8px">
                  <Text>Payment ID: {resultData.paymentId}</Text>
                  <Text>Amount: {resultData.amount} USDC</Text>
                </Box>
             </Box>
             
             <Box>
               <Text fontWeight="bold">🤖 Agent Result</Text>
               <Text>Status: {resultData.result.status}</Text>
               <Box marginTop="8px">
                 <ResultDetails result={resultData.result} />
               </Box>
             </Box>
          </VStack>
        )}

        {status === 'error' && (
          <Text color="negative">{error || 'An unknown error occurred'}</Text>
        )}
      </VStack>
    </Box>
  );
};

