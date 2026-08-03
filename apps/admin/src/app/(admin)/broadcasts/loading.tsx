import { PageSkeleton } from '@unami/ui';
export default function Loading() {
  return <PageSkeleton tableColumns={5} tableRows={8} tableColumnWidths={['w-2/5', 'w-20', 'w-24', 'w-24', 'w-28']} />;
}
