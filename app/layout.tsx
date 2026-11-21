import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { MotionProvider } from '@/src/components/MotionProvider';
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
  title: 'Élite Sport Godomey — Terrain de football 24h/24 à Cotonou',
  description:
    'Terrain synthétique à Godomey, Cotonou. Réservez un créneau d’une heure, 24h/24, avec blocage de 15 minutes et confirmation par WhatsApp.',
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
    title: 'Élite Sport Godomey — Terrain de football 24h/24 à Cotonou',
    description:
      'Terrain synthétique à Godomey, Cotonou. Réservez un créneau d’une heure, 24h/24, avec blocage de 15 minutes et confirmation par WhatsApp.',
    type: 'website',
    locale: 'fr_BJ',
  },
  twitter: {
    card: 'summary',
    title: 'Élite Sport Godomey',
    description:
      'Terrain synthétique à Godomey, Cotonou. Réservez un créneau d’une heure, 24h/24.',
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
      className={`${barlow.variable} ${barlowCondensed.variable} scroll-smooth`}
    >
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}

        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-[#f8f7f2] text-[#16231b] antialiased overflow-x-hidden">
        <MotionProvider>
          <OfflineBanner />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
