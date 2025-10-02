import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccessCodeService } from '../services/access-code.service';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const accessCodeInterceptor: HttpInterceptorFn = (req, next) => {
  const svc = inject(AccessCodeService);
  const code = svc.code();

  const withHeader = code ? req.clone({ setHeaders: { 'X-Access-Code': code } }) : req;

  return next(withHeader).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      return from(svc.waitForCode()).pipe(
        switchMap((fresh) => {
          const retry = req.clone({ setHeaders: { 'X-Access-Code': fresh } });
          return next(retry);
        })
      );
    })
  );
};
