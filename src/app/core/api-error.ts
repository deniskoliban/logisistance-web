import { HttpErrorResponse } from '@angular/common/http';

/** Turn a FastAPI error response into something a driver can actually read. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Cannot reach the API. Is the backend running on http://127.0.0.1:8000?';
    }

    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : 'value';
        return `${field}: ${item?.msg ?? 'invalid'}`;
      });
      if (messages.length > 0) {
        return messages.join(' · ');
      }
    }
    return error.message || fallback;
  }

  return fallback;
}
