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
      backgroundColor="bgAlternate" 
      borderRadius="large" 
      padding={4}
    >
      <VStack gap={2}>
        <Text font="title3">💰 Payment Structure</Text>
        
        <HStack justifyContent="space-between">
          <Text color="fgMuted">Agent Service Fee (fixed)</Text>
          <Text>{agentFee.toFixed(2)} USDC</Text>
        </HStack>

        <HStack justifyContent="space-between">
          <Text color="fgMuted">Product Cost</Text>
          <Text>Your input below</Text>
        </HStack>

        <Divider />

        <HStack justifyContent="space-between">
          <Text font="label1">Total x402 Payment</Text>
          <Text font="label1">Agent Fee + Product Cost</Text>
        </HStack>
      </VStack>
    </Box>
  );
};

