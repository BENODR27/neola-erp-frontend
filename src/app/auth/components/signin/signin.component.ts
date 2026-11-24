import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthSession } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../../shared/services/http/http.service';
import { environment } from '../../../shared/environments/environment';
import { APP_CONFIG } from '../../../shared/config/app-config';
import { APP_CONSTANTS } from '../../../shared/config/app-constants';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';

interface LoginResponse {
  status?: number;
  message?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: AuthSession['user'];
  result?: AuthSession['user'] & {
    roles?: Array<{ name?: string; permissions?: Array<{ name?: string }> }>;
  };
  data?: LoginResponse;
}

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  readonly appConfig = APP_CONFIG;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);

  readonly facility = 'Digital Transformation';

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  submit(): void {
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) return;
    this.showPassword.set(false);

    const { username, password, rememberMe } = this.form.getRawValue();
    // Keep the existing IAM contract; the UI uses familiar login terminology.
    const credentials = { employeeCode: username.trim(), authCode: password };
    this.isSubmitting.set(true);

    this.http
      .post<LoginResponse>(`${environment.authv2ApiUrl}/api/auth/users/login`, credentials)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const payload = response.data ?? response;
          const accessToken = payload.accessToken ?? payload.token;
          if (!accessToken) {
            this.errorMessage.set(
              payload.message ?? 'The sign-in response did not include an access token.',
            );
            return;
          }

          const result = payload.result ?? payload.user ?? {};
          const roles = ((result as { roles?: unknown[] }).roles ?? []).filter(
            (role) => typeof role === 'string' || (role as { enabled?: boolean }).enabled !== false,
          );
          const userRoles = roles
            .map((role) => (typeof role === 'string' ? role : (role as { name?: unknown }).name))
            .filter((role): role is string => Boolean(role));
          const userPermissions = roles.flatMap((role) =>
            typeof role === 'string'
              ? []
              : ((role as { permissions?: unknown[] }).permissions ?? [])
                  .filter(
                    (permission) =>
                      typeof permission === 'string' ||
                      (permission as { enabled?: boolean }).enabled !== false,
                  )
                  .map((permission) =>
                    typeof permission === 'string'
                      ? permission
                      : (permission as { name?: unknown }).name,
                  )
                  .filter((permission): permission is string => Boolean(permission)),
          );
          const employeeName =
            (result as { employeeName?: string; name?: string }).employeeName ??
            (result as { name?: string }).name ??
            '';
          const user = {
            ...result,
            username: credentials.employeeCode,
            name: employeeName,
            roles: userRoles,
            permissions: userPermissions,
          };

          try {
            this.authService.setSession(
              { accessToken, refreshToken: payload.refreshToken, user },
              rememberMe,
            );
            this.localStorageService.setItem('selectedFacility', this.facility);
          } catch {
            this.errorMessage.set(
              'Your browser could not save the session. Allow site storage and try again.',
            );
            return;
          }
          void this.router.navigateByUrl(APP_CONSTANTS.routes.home);
        },
        error: (error: { status?: number; error?: LoginResponse; message?: string }) => {
          this.errorMessage.set(
            error.status === 401
              ? 'Incorrect username or password.'
              : (error.error?.message ??
                  error.message ??
                  'Unable to sign in. Check your credentials and try again.'),
          );
        },
      });
  }
}
