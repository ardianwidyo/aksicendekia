import BlockEditorClient from './BlockEditorClient';

export function generateStaticParams() {
  return [{ lessonId: 'preview' }];
}

export default function Page() {
  return <BlockEditorClient />;
}
