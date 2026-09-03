import type { Metadata, Viewport } from 'next';
import { Quicksand, Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider, I18nProvider } from '@aksicendekia/ui';
import { GuestProgressProvider } from '../lib/context/guest-progress-context';
import { ServiceWorkerRegister } from '../components/pwa/ServiceWorkerRegister';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  applicationName: 'AksiCendekia',
  title: 'AksiCendekia — Matematika SD Interaktif Kelas 1–6',
  description:
    'Belajar Matematika SD Kurikulum Merdeka kelas 1–6 lewat pelajaran interaktif: ilustrasi, animasi, manipulatif, dan latihan bertahap. Bisa langsung dipakai tanpa mendaftar.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AksiCendekia',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0058be',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      data-jenjang="sd"
      className={`${quicksand.variable} ${inter.variable} ${montserrat.variable}`}
    >
      <body className="bg-background text-on-surface font-body antialiased min-h-screen">
        <ThemeProvider defaultGradeLevel="sd">
          <I18nProvider defaultLocale="id">
            <GuestProgressProvider>
              {children}
            </GuestProgressProvider>
            <ServiceWorkerRegister />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
