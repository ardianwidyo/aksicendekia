import type { Metadata } from 'next';
import { Quicksand, Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider, I18nProvider } from '@aksicendekia/ui';
import { GuestProgressProvider } from '../lib/context/guest-progress-context';

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
  title: 'AksiCendekia — Matematika SD Interaktif Kelas 1–6',
  description:
    'Belajar Matematika SD Kurikulum Merdeka kelas 1–6 lewat pelajaran interaktif: ilustrasi, animasi, manipulatif, dan latihan bertahap. Bisa langsung dipakai tanpa mendaftar.',
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
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
