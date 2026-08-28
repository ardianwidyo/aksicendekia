import GuestSessionClient from './GuestSessionClient';

export function generateStaticParams() {
  return [{ lessonId: 'preview' }];
}

export default function Page() {
  return <GuestSessionClient />;
}
