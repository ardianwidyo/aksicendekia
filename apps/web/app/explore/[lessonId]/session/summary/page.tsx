import GuestSessionSummaryClient from './GuestSessionSummaryClient';

export function generateStaticParams() {
  return [{ lessonId: 'preview' }];
}

export default function Page() {
  return <GuestSessionSummaryClient />;
}
