import CaseDetailClient from './CaseDetailClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <CaseDetailClient />;
}
