import LessonDetailClient from './LessonDetailClient';

export function generateStaticParams() {
  return [{ lessonId: 'preview' }];
}

export default function Page() {
  return <LessonDetailClient />;
}
