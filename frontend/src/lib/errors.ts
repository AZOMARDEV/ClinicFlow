import { ApiError } from '@/lib/api';

export type ErrorKind = 'offline' | 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'notFound' | 'conflict' | 'validation' | 'server' | 'unknown';

export interface DescribedError {
  kind: ErrorKind;
  title: string;
  message: string;
  /** Whether trying again can help */
  retryable: boolean;
}

/** Turns any thrown value into a message a clinic user can act on. */
export function describeError(err: unknown): DescribedError {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { kind: 'offline', title: 'You are offline', message: 'Check your internet connection. We will retry when you are back online.', retryable: true };
  }
  if (!(err instanceof ApiError)) {
    return { kind: 'unknown', title: 'Something went wrong', message: err instanceof Error ? err.message : 'An unexpected error occurred.', retryable: true };
  }
  switch (true) {
    case err.code === 'NETWORK_ERROR':
      return { kind: 'network', title: 'Cannot reach the server', message: 'The API is not responding. Make sure it is running, then try again.', retryable: true };
    case err.code === 'TIMEOUT':
      return { kind: 'timeout', title: 'The request timed out', message: 'The server took too long to respond. Try again in a moment.', retryable: true };
    case err.status === 401:
      return { kind: 'unauthorized', title: 'Session expired', message: err.message || 'Please sign in again.', retryable: false };
    case err.status === 403:
      return { kind: 'forbidden', title: 'Not allowed', message: 'Your role does not allow this action. Ask an admin if you need it.', retryable: false };
    case err.status === 404:
      return { kind: 'notFound', title: 'Not found', message: err.message || 'This item does not exist or was deleted.', retryable: false };
    case err.status === 409:
      return { kind: 'conflict', title: 'Conflict', message: err.message, retryable: false };
    case err.status === 400:
      return { kind: 'validation', title: 'Please check the form', message: err.message, retryable: false };
    case err.status >= 500:
      return { kind: 'server', title: 'Server error', message: 'The server hit an unexpected problem. Try again; if it keeps happening, contact support.', retryable: true };
    default:
      return { kind: 'unknown', title: 'Something went wrong', message: err.message, retryable: true };
  }
}

/** Short message for toasts. Conflicts and validation keep the API's own wording (shown verbatim). */
export function errorMessage(err: unknown): string {
  const d = describeError(err);
  return d.kind === 'conflict' || d.kind === 'validation' ? d.message : `${d.title}. ${d.message}`;
}

export const isNetworkError = (err: unknown) => err instanceof ApiError && (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT');
