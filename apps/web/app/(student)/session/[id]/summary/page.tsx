import SessionSummaryClient from './SessionSummaryClient';

export function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function Page() {
  return <SessionSummaryClient />;
}
