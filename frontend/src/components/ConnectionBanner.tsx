import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CloudOffIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isNetworkError } from '@/lib/errors';

/**
 * Sticky banner shown when the browser is offline or the API stops answering.
 * It watches the query cache: a network failure shows it, the next successful request hides it.
 */
export function ConnectionBanner() {
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [apiDown, setApiDown] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOffline(false);
      queryClient.refetchQueries({ type: 'active' });
    };
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [queryClient]);

  const apiDownRef = useRef(false);
  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== 'updated') return;
        const { status, error } = event.query.state;
        if (status === 'error' && isNetworkError(error)) {
          apiDownRef.current = true;
          setApiDown(true);
        }
        if (status === 'success' && apiDownRef.current) {
          // Server is back: reload everything that failed while it was down
          apiDownRef.current = false;
          setApiDown(false);
          queryClient.refetchQueries({ predicate: (q) => q.state.status === 'error' });
        }
      }),
    [queryClient],
  );

  if (!offline && !apiDown) return null;

  const retry = async () => {
    setRetrying(true);
    await queryClient.refetchQueries({ type: 'active' }).finally(() => setRetrying(false));
  };

  return (
    <div role="status" className="sticky top-0 z-40 flex items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      {offline ? <WifiOffIcon className="size-4 shrink-0" aria-hidden /> : <CloudOffIcon className="size-4 shrink-0" aria-hidden />}
      <span>{offline ? 'You are offline. Changes cannot be saved until you reconnect.' : 'Cannot reach the ClinicFlow server. Data shown may be out of date.'}</span>
      {!offline && (
        <Button size="sm" variant="ghost" className="h-7 text-amber-900 hover:bg-amber-100" onClick={retry} disabled={retrying}>
          <RefreshCwIcon className={retrying ? 'animate-spin' : undefined} /> Retry
        </Button>
      )}
    </div>
  );
}
