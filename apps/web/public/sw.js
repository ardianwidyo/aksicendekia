/*
 * AksiCendekia service worker — hand-rolled, no build step.
 *
 * Goals: make the app installable and usable on flaky/no connections.
 *  - App shell + core icons are precached on install.
 *  - Navigations: network-first, fall back to the cached page, then /offline.html.
 *  - Immutable build assets (/_next/static, /assets, /icons): stale-while-revalidate.
 *
 * Bump CACHE_VERSION whenever the precache list or strategy changes so the
 * activate handler can drop stale caches.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `aksicendekia-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

const RUNTIME_CACHE_PREFIXES = ['/_next/static/', '/assets/', '/icons/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Best-effort: a single 404 in the list must not abort the whole install.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isRuntimeAsset(url) {
  return RUNTIME_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isRuntimeAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
