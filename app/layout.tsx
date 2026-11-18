import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import './globals.css';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Élite Sport Godomey — Réservation de terrain 24h/24',
  description:
    'Réservez votre créneau d’une heure au terrain de football Élite Sport Godomey à Cotonou, Bénin. Ouvert 24h/24.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Élite Sport',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Élite Sport Godomey — Réservation de terrain 24h/24',
    description:
      'Réservez votre créneau d’une heure au terrain de football Élite Sport Godomey à Cotonou, Bénin.',
    type: 'website',
    locale: 'fr_BJ',
  },
  twitter: {
    card: 'summary',
    title: 'Élite Sport Godomey',
    description:
      'Réservation en ligne 24h/24 du terrain de football Élite Sport Godomey à Cotonou.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f5d3a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
    >
      <body className="min-h-screen bg-[#f8f7f2] text-[#16231b] antialiased overflow-x-hidden">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
