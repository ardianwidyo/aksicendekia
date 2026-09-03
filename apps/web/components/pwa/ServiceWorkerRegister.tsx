'use client';

import { useEffect } from 'react';

/**
 * Registers `/sw.js` once the page has loaded. Renders nothing.
 *
 * Skipped outside production so `next dev` isn't served stale assets from a
 * lingering service worker cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('[pwa] service worker registration failed', error);
      });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
