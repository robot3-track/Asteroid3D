import type {Metadata} from 'next';
import {Analytics} from '@vercel/analytics/next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Asteroid Simulator',
  description: 'Live data pulled from NASA API for Asteroid simulation',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
