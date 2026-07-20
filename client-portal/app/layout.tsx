import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Client Portal | Rahimullah Advocate',
  description: 'Secure client access to case status and hearing updates — Rahimullah Advocate, Swat.',
};

import { LanguageProvider } from '@/lib/LanguageContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
