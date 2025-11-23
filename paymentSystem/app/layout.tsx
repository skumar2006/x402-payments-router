import type { Metadata } from 'next';
import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/globalStyles';
import '@coinbase/cds-web/defaultFontStyles';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'x402 Purchasing Agent',
  description: 'Test the x402 payment protocol with a mock purchasing agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

