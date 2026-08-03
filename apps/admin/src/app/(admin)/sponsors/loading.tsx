import { PageSkeleton } from '@unami/ui';
export default function Loading() {
  return <PageSkeleton kpis={4} tableColumns={5} tableRows={8} tableColumnWidths={['w-2/5', 'w-20', 'w-24', 'w-20', 'w-32']} />;
}
