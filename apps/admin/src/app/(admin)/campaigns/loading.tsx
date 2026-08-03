import { PageSkeleton } from '@moments/ui';
export default function Loading() {
  return <PageSkeleton kpis={4} tableColumns={6} tableRows={8} tableColumnWidths={['w-2/5', 'w-20', 'w-20', 'w-20', 'w-28', 'w-20']} />;
}
