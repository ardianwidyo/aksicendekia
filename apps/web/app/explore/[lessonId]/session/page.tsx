import { allLessonIds } from '@/lib/guest-lessons';
import GuestSessionClient from './GuestSessionClient';

/**
 * Feature 011 — every routable lesson id (69 interactive + 3 legacy) plus
 * `preview` gets a static session page, so "Mulai Belajar" never 404s on the
 * static export. Mirrors `explore/[lessonId]/page.tsx`.
 */
export function generateStaticParams() {
  return [...allLessonIds(), 'preview'].map((lessonId) => ({ lessonId }));
}

export default function Page() {
  return <GuestSessionClient />;
}
