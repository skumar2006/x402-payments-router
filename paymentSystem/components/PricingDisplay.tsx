import React from 'react';
import { Box } from '@coinbase/cds-web/layout/Box';
import { Text } from '@coinbase/cds-web/typography/Text';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { Divider } from '@coinbase/cds-web/layout/Divider';

interface PricingDisplayProps {
  agentFee: number;
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({ agentFee }) => {
  return (
    <Box 
      backgroundColor="backgroundAlternate" 
      borderRadius="large" 
      padding="16px"
    >
      <VStack spacing="8px">
        <Text variant="title3" fontWeight="bold">💰 Payment Structure</Text>
        
        <HStack justifyContent="space-between">
          <Text color="foregroundMuted">Agent Service Fee (fixed)</Text>
          <Text>{agentFee.toFixed(2)} USDC</Text>
        </HStack>

        <HStack justifyContent="space-between">
          <Text color="foregroundMuted">Product Cost</Text>
          <Text>Your input below</Text>
        </HStack>

        <Divider />

        <HStack justifyContent="space-between">
          <Text fontWeight="bold">Total x402 Payment</Text>
          <Text fontWeight="bold">Agent Fee + Product Cost</Text>
        </HStack>
      </VStack>
    </Box>
  );
};

