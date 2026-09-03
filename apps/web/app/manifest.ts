import type { MetadataRoute } from 'next';

/**
 * Web app manifest, emitted as a static `/manifest.webmanifest` by
 * `next build` (this app is `output: 'export'`). Keeps the installable-PWA
 * metadata in one typed place instead of a hand-maintained JSON file.
 */
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AksiCendekia — Matematika SD Interaktif',
    short_name: 'AksiCendekia',
    description:
      'Belajar Matematika SD Kurikulum Merdeka kelas 1–6 lewat pelajaran interaktif: ilustrasi, animasi, manipulatif, dan latihan bertahap.',
    lang: 'id',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f9ff',
    theme_color: '#0058be',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
