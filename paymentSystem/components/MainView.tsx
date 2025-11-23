import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@coinbase/cds-web/buttons/Button';
import { TextInput } from '@coinbase/cds-web/controls/TextInput';
import { ContentCard } from '@coinbase/cds-web/cards/ContentCard';
import { Box } from '@coinbase/cds-web/layout/Box';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { Text } from '@coinbase/cds-web/typography/Text';
import { PricingDisplay } from './PricingDisplay';
import { StatusDisplay } from './StatusDisplay';
import { UserWallet, PurchaseState } from '../app/types';

interface MainViewProps {
  userWallet: UserWallet;
  purchaseState: PurchaseState;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  onPayNow: () => void;
  isConnected: boolean;
  agentFee: number;
}

export const MainView: React.FC<MainViewProps> = ({
  userWallet,
  purchaseState,
  onQueryChange,
  onSubmit,
  onReset,
  onPayNow,
  isConnected,
  agentFee,
}) => {
  return (
    <Box display="flex" justifyContent="center" padding={4} minHeight="100vh">
      <ContentCard width="100%" maxWidth="600px">
        <Box padding={6}>
          <VStack gap={6}>
            {/* Header */}
            <HStack justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Text font="headline">🤖 x402 Purchasing Agent</Text>
                <Text color="fgMuted">Real USDC payments on Base Sepolia</Text>
                <Text font="label2" color="fgMuted" marginTop={1}>
                  📱 Wallet: {userWallet.address.slice(0, 6)}...{userWallet.address.slice(-4)}
                </Text>
              </Box>
              <ConnectButton />
            </HStack>

            {/* Pricing Info */}
            <PricingDisplay agentFee={agentFee} />

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
              <VStack gap={4}>
                <Box>
                  <TextInput
                    label="What would you like to buy?"
                    value={purchaseState.query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="e.g., USB-C charger, headphones, laptop..."
                    disabled={purchaseState.status !== 'idle' && purchaseState.status !== 'error'}
                    // multiline={true} // Assuming this prop exists or use NativeTextArea
                  />
                  <Text font="label2" color="fgMuted" marginTop={2}>
                    💡 The agent will automatically look up the price for you!
                  </Text>
                </Box>

                <HStack gap={4}>
                   <Box flex={1}>
                     <Button 
                       type="submit" 
                       variant="primary" 
                       width="100%"
                       disabled={purchaseState.status !== 'idle' && purchaseState.status !== 'error'}
                     >
                       Request Agent Service
                     </Button>
                   </Box>
                   <Box flex={1}>
                     <Button
                       type="button"
                       variant="secondary"
                       width="100%"
                       onClick={onReset}
                     >
                       Change Phone Number
                     </Button>
                   </Box>
                </HStack>
              </VStack>
            </form>

            {/* Status Panel */}
            <StatusDisplay 
              state={purchaseState} 
              onPayNow={onPayNow} 
              isConnected={isConnected} 
            />
          </VStack>
        </Box>
      </ContentCard>
    </Box>
  );
};

