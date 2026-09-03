import { allLessonIds } from '@/lib/guest-lessons';
import GuestSessionSummaryClient from './GuestSessionSummaryClient';

/** Feature 011 — one static summary page per routable lesson id + `preview`. */
export function generateStaticParams() {
  return [...allLessonIds(), 'preview'].map((lessonId) => ({ lessonId }));
}

export default function Page() {
  return <GuestSessionSummaryClient />;
}
