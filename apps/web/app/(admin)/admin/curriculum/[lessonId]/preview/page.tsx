import PreviewClient from './PreviewClient';

export function generateStaticParams() {
  return [{ lessonId: 'preview' }];
}

export default function Page() {
  return <PreviewClient />;
}
