import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EagleNest Legal | Expert Legal Solutions in Swat',
  description: 'Top-tier legal services in Swat Valley — Civil Litigation, Corporate Law, Criminal Defense, and Family Law. Contact EagleNest Legal today.',
  keywords: 'lawyer swat, legal services swat, advocate swat valley, court cases kpk',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
