#!/usr/bin/env node
/**
 * Feature 010 / T090 (FR-030b). `next build` always produces the production
 * static export for this app — there is no separate "dev build" — so the content
 * preview switch must never be on here. Fails the build loudly instead of
 * silently shipping REVIEW-status content to production.
 */
if (process.env.NEXT_PUBLIC_CONTENT_PREVIEW === 'true') {
  console.error(
    '\n[FR-030b] Build aborted: NEXT_PUBLIC_CONTENT_PREVIEW=true is set.\n' +
      'This switch must never be on for a production build — unset it and rebuild.\n',
  );
  process.exit(1);
}
