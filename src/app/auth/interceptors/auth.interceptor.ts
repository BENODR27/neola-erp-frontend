import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).getToken();
  const isPublicAuthRequest = /\/api\/auth\/(users\/(login|register|generate-token)|token\/need-token|version)(?:[/?]|$)/.test(
    request.url,
  );

  const applicationName = request.url.includes('/mmms') ? 'MMMS' : request.url.includes('/adminv2') ? 'IAM' : 'Admin';
  if (!token || isPublicAuthRequest) return next(request.clone({ setHeaders: { 'x-application-name': applicationName } }));

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}`, 'x-application-name': applicationName } }));
};
