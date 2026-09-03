import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sedang Offline — AksiCendekia',
  robots: { index: false, follow: false },
};

/**
 * Served by the service worker as the navigation fallback when the network is
 * unreachable and the requested page isn't cached. Kept dependency-free so it
 * renders without any client bundle.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <img src="/icons/icon.svg" alt="" width={96} height={96} className="drop-shadow-sm" />
      <div className="space-y-2">
        <h1 className="text-2xl font-heading font-bold text-on-surface">Kamu sedang offline</h1>
        <p className="text-on-surface-variant">
          Sambungan internet terputus. Halaman yang sudah pernah dibuka tetap bisa diakses. Coba lagi
          setelah kembali online.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-3 font-medium text-on-primary transition-colors hover:bg-primary-container"
      >
        Kembali ke Beranda
      </Link>
    </main>
  );
}
