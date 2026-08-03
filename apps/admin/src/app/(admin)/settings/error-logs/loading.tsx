import { PageSkeleton } from '@moments/ui';
export default function Loading() {
  return <PageSkeleton tableColumns={4} tableRows={10} tableColumnWidths={['w-20', 'w-28', 'w-2/5', 'w-28']} />;
}
