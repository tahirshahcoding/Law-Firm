import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Client Portal | Rahimullah Advocate',
  description: 'Secure client access to case status and hearing updates — Rahimullah Advocate, Swat.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { LanguageProvider } from '@/lib/LanguageContext';
import NetworkStatus from '@/components/NetworkStatus';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <NetworkStatus />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
