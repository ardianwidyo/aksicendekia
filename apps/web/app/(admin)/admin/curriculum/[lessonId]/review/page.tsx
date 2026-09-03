import ReviewClient from './ReviewClient';

export function generateStaticParams() {
  return [{ lessonId: 'preview' }];
}

export default function Page() {
  return <ReviewClient />;
}
