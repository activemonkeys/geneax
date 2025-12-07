// src/app/layout.tsx

import type {Metadata} from 'next';
import {GeistSans} from 'geist/font/sans';

import './globals.css';

import {Navigation} from '@/components/navigation';

export const metadata: Metadata = {
  title: 'Geneax - Genealogische Database',
  description: 'Centrale database van Nederlandse genealogische data',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={GeistSans.className}>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
