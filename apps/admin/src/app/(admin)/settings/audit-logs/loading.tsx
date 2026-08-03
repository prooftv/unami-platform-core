import { PageSkeleton } from '@unami/ui';
export default function Loading() {
  return <PageSkeleton tableColumns={5} tableRows={10} tableColumnWidths={['w-20', 'w-24', 'w-28', 'w-28', 'w-28']} />;
}
