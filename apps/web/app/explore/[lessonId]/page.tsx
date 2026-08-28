import LessonDetailClient from './LessonDetailClient';

export function generateStaticParams() {
  return [
    { lessonId: 'lesson_m1' },
    { lessonId: 'lesson_m2' },
    { lessonId: 'lesson_i1' },
    { lessonId: 'preview' },
  ];
}

export default function Page() {
  return <LessonDetailClient />;
}
