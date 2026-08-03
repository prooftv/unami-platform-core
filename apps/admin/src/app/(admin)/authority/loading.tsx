import { PageSkeleton } from '@unami/ui';
export default function Loading() {
  return <PageSkeleton kpis={4} tableColumns={6} tableRows={8} tableColumnWidths={['w-28', 'w-24', 'w-24', 'w-20', 'w-24', 'w-20']} />;
}
