import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import { MotionProvider } from '@/src/components/MotionProvider';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TERRAIN — Réserve ton terrain de football au Bénin',
  description:
    'Trouve et réserve les meilleurs terrains de football à Cotonou et au Bénin. Choisis ton créneau, invite ton équipe et profite du jeu.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TERRAIN',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'TERRAIN — Réserve ton terrain de football au Bénin',
    description:
      'Trouve et réserve les meilleurs terrains de football à Cotonou et au Bénin. Choisis ton créneau, invite ton équipe et profite du jeu.',
    type: 'website',
    locale: 'fr_BJ',
  },
  twitter: {
    card: 'summary',
    title: 'TERRAIN — Bénin',
    description:
      'Trouve et réserve les meilleurs terrains de football à Cotonou et au Bénin.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#123D2B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} ${manrope.variable} scroll-smooth`}
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
      <body className="min-h-screen bg-[#F8FAF7] text-[#17231D] antialiased overflow-x-hidden">
        <MotionProvider>
          <OfflineBanner />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
