'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { publishNoticeAction, closeNoticeAction } from '../../_actions';

interface Props {
  id: string;
  canPublish: boolean;
  canClose: boolean;
  isStatutory: boolean;
  hasDeadline: boolean;
}

export function NoticeStatusActions({ id, canPublish, canClose, isStatutory, hasDeadline }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function publish() {
    if (isStatutory && !hasDeadline) {
      alert('A comment deadline is required before publishing a statutory notice.');
      return;
    }
    startTransition(async () => {
      await publishNoticeAction(id);
      router.refresh();
    });
  }

  function close() {
    startTransition(async () => {
      await closeNoticeAction(id);
      router.refresh();
    });
  }

  if (!canPublish && !canClose) return null;

  return (
    <div className="flex gap-2 pt-1">
      {canPublish && (
        <Button size="sm" onClick={publish} disabled={pending}>
          {isStatutory ? 'Open for comment' : 'Publish'}
        </Button>
      )}
      {canClose && (
        <Button size="sm" variant="outline" onClick={close} disabled={pending}>
          Close
        </Button>
      )}
    </div>
  );
}
