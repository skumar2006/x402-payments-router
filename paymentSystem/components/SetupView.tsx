import React, { useState } from 'react';
import { Button } from '@coinbase/cds-web/buttons/Button';
import { TextInput } from '@coinbase/cds-web/controls/TextInput';
import { ContentCard } from '@coinbase/cds-web/cards/ContentCard';
import { Text } from '@coinbase/cds-web/typography/Text';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { Box } from '@coinbase/cds-web/layout/Box';
import { UserWallet } from '../app/types';

interface SetupViewProps {
  onWalletCreated: (wallet: UserWallet) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onWalletCreated }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handlePhoneSubmit = async () => {
    if (!phoneNumber) return;
    
    setIsSettingUp(true);

    try {
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        onWalletCreated({
          address: data.wallet.address,
          walletId: data.wallet.walletId,
        });
        console.log('✅ User wallet loaded:', data.wallet.address);
      } else {
        alert('Error: ' + data.error); // Consider replacing with CDS Alert or Toast later
      }
    } catch (error: any) {
      alert('Failed to create wallet: ' + error.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" padding={4}>
      <ContentCard width="100%" maxWidth="480px">
        <Box padding={6}>
          <VStack gap={4}>
            <Box>
              <Text font="headline">🤖 x402 Purchasing Agent</Text>
              <Text font="body" color="fgMuted">
                Enter your phone number to get started
              </Text>
            </Box>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePhoneSubmit();
              }}
            >
              <VStack gap={4}>
                <TextInput
                  label="Phone Number"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  disabled={isSettingUp}
                  type="tel"
                />
                <Text font="label2" color="fgMuted">
                  💡 We'll create a secure wallet for you using Coinbase CDP.
                  Your wallet will be linked to this phone number.
                </Text>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSettingUp}
                  loading={isSettingUp}
                >
                  {isSettingUp ? 'Creating Wallet...' : 'Continue'}
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </ContentCard>
    </Box>
  );
};
