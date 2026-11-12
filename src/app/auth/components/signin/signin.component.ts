import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthSession } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../../shared/services/http/http.service';
import { environment } from '../../../shared/environments/environment';
import { APP_CONFIG } from '../../../shared/config/app-config';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import Swal from 'sweetalert2';

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
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  readonly appConfig = APP_CONFIG;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);

  readonly facility = 'Digital Transformation';

  readonly form = this.formBuilder.nonNullable.group({
    employeeCode: ['', Validators.required],
    authCode: ['', Validators.required],
  });

  submit(): void {
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) return;

    const credentials = this.form.getRawValue();
    credentials.employeeCode = credentials.employeeCode.replace(/^0+/, '');
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
          const roles = (result as { roles?: unknown[] }).roles ?? [];
          const userRoles = roles
            .map((role) => (typeof role === 'string' ? role : (role as { name?: unknown }).name))
            .filter((role): role is string => Boolean(role));
          const userPermissions = roles.flatMap((role) =>
            typeof role === 'string'
              ? []
              : ((role as { permissions?: unknown[] }).permissions ?? [])
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
          const employeeId = (result as { id?: string | number }).id;
          const user = {
            ...result,
            roles: userRoles,
            permissions: userPermissions,
          };

          this.localStorageService.setItem('loginvia', '/auth/signin');
          this.localStorageService.setItem('currentEmpName', employeeName);
          this.localStorageService.setItem('currentEmpId', credentials.employeeCode);
          this.localStorageService.setItem('selectedFacility', this.facility);
          this.localStorageService.setItem('username', credentials.employeeCode);
          this.localStorageService.setItem('userId', employeeId);
          this.localStorageService.setItem('token', accessToken);
          this.localStorageService.setItem('roles', JSON.stringify(userRoles));
          this.localStorageService.setItem('permissions', JSON.stringify(userPermissions));

          this.authService.setSession({
            accessToken,
            refreshToken: payload.refreshToken,
            user,
          });

          void Swal.fire({
            title: 'Success',
            timer: 1000,
            text: `Welcome to ADMIN ${employeeName}`,
            icon: 'success',
            showConfirmButton: false,
          });
          void this.router.navigate(['/adminv2/welcome']);
        },
        error: (error: { error?: LoginResponse; message?: string }) => {
          this.errorMessage.set(
            error.error?.message ??
              error.message ??
              'Unable to sign in. Check your credentials and try again.',
          );
        },
      });
  }
}
