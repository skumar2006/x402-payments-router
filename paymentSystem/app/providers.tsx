'use client';

import '@rainbow-me/rainbowkit/styles.css';
// Coinbase CDS Styles
import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/globalStyles';
import '@coinbase/cds-web/defaultFontStyles';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ThemeProvider, MediaQueryProvider } from '@coinbase/cds-web/system';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import { config } from '@/lib/wagmiConfig';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MediaQueryProvider>
            <ThemeProvider theme={defaultTheme} activeColorScheme="light">
              {children}
            </ThemeProvider>
          </MediaQueryProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
