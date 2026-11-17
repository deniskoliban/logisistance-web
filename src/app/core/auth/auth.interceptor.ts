import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Attaches the JWT to every API call and drops the session when the API rejects it.
 *
 * Without the 401 handling a stale token (expired, or issued against a database that was
 * reset) would leave the UI looking signed in while every request fails.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (!token || !request.url.startsWith('/api/')) {
    return next(request);
  }

  const isAuthCall = request.url.includes('/auth/');

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthCall) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
