import './globals.css';
import { ReactNode } from 'react';
import SessionWrapper from '../components/SessionWrapper';
import InstallButton from '@/components/InstallButton';

export const metadata = {
  title: 'JPL Pronostiek',
  description: 'Voorspel elke speeldag en strijd met vrienden!',
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <SessionWrapper>
          {children}
          <InstallButton />
        </SessionWrapper>
      </body>
    </html>
  );
}