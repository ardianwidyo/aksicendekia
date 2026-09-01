import LessonDetailClient from './LessonDetailClient';
import { allLessonIds } from '@/lib/guest-lessons';

/**
 * Feature 010 / FR-031a — params come from the content-kit catalog and include
 * the 3 legacy ids, so old routes keep resolving instead of 404-ing.
 */
export function generateStaticParams() {
  return [...allLessonIds(), 'preview'].map((lessonId) => ({ lessonId }));
}

export default function Page() {
  return <LessonDetailClient />;
}
