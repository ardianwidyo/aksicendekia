import ActiveSessionClient from './ActiveSessionClient';

export function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function Page() {
  return <ActiveSessionClient />;
}
