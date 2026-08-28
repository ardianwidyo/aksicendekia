import ConsentApprovalClient from './ConsentApprovalClient';

export function generateStaticParams() {
  return [{ token: 'preview' }];
}

export default function Page() {
  return <ConsentApprovalClient />;
}
