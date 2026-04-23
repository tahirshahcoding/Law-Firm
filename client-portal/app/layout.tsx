import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Client Portal | EagleNest Legal',
  description: 'Secure client access to case status and hearing updates — EagleNest Legal, Swat.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
