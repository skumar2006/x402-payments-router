import React from 'react';
import { Box } from '@coinbase/cds-web/layout/Box';
import { Text } from '@coinbase/cds-web/typography/Text';
import { VStack } from '@coinbase/cds-web/layout/VStack';

export const ResultDetails: React.FC<{ result: any }> = ({ result }) => {
  if (result.orderId) {
    return (
      <VStack spacing="4px">
        <Text>Order ID: {result.orderId}</Text>
        <Text>Product: {result.product.name}</Text>
        <Text>Price: {result.product.price}</Text>
        <Text>Message: {result.message}</Text>
      </VStack>
    );
  }

  if (result.results) {
    return (
      <VStack spacing="4px">
        <Text>Found {result.resultsCount} products:</Text>
        {result.results.map((r: any, i: number) => (
          <Text key={i}>
            • {r.name} - {r.price} (⭐ {r.rating})
          </Text>
        ))}
      </VStack>
    );
  }

  if (result.comparison) {
    return (
      <VStack spacing="4px">
        <Text>
          Recommendation: {result.recommendation}
        </Text>
        {result.comparison.map((c: any, i: number) => (
          <Text key={i}>
            • {c.vendor}: {c.price} + {c.shipping} shipping
          </Text>
        ))}
      </VStack>
    );
  }

  return null;
};

