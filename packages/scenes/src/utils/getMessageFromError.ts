import { isFetchError } from '@grafana/runtime';

export function getMessageFromError(err: unknown): string {
  if (typeof err === 'string') {
    return err;
  }

  if (err) {
    if (err instanceof Error) {
      return err.message;
    } else if (isFetchError(err)) {
      if (err.data && err.data.message) {
        return err.data.message;
      } else if (err.statusText) {
        return err.statusText;
      }
    } else if (err.hasOwnProperty('message')) {
      // @ts-expect-error
      return err.message;
    }
  }

  return JSON.stringify(err);
}
