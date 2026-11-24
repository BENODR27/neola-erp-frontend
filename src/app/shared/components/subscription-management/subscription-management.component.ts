import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ADMIN_API_CONSTANTS } from '../../../adminv2/constants/admin-api.constants';

@Component({
  selector: 'app-subscription-management',
  template: `
    <section class="management-message">
      <span>NeoLA Subscription Console</span>
      <h1>Manage your organization’s ERP access</h1>
      <p>
        Plans, approvals, applications, navigation and employee access are managed in the separate
        Subscription Console. Sign in there with your customer-owner or platform account.
      </p>
      @if (portalUrl()) {
        <a [href]="portalUrl()" target="_blank" rel="noopener noreferrer"
          >Open Subscription Console</a
        >
      } @else {
        <p>Ask your platform operator for the console address.</p>
      }
      <p class="detail">ERP employee sign-in and daily work continue here.</p>
    </section>
  `,
  styles: `
    .management-message {
      max-width: 760px;
      margin: 32px auto;
      padding: clamp(24px, 5vw, 56px);
      border: 1px solid var(--app-border);
      border-radius: 20px;
      background: var(--app-surface);
      color: var(--app-text);
    }
    span,
    .detail {
      color: var(--app-muted);
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2.3rem);
      margin: 18px 0;
    }
    p {
      line-height: 1.7;
    }
    a {
      display: inline-block;
      margin: 16px 0;
      padding: 12px 20px;
      border-radius: 10px;
      background: var(--app-primary);
      color: var(--app-on-primary);
      text-decoration: none;
    }
  `,
})
export class SubscriptionManagementComponent {
  readonly portalUrl = signal('');
  constructor() {
    inject(HttpClient)
      .get<{ portalUrl: string | null }>(ADMIN_API_CONSTANTS.API_URL + '/control-settings')
      .subscribe({
        next: (settings) => {
          try {
            const url = new URL(settings.portalUrl || '');
            if (['https:', 'http:'].includes(url.protocol)) this.portalUrl.set(url.href);
          } catch {
            /* Operator has not configured the console URL. */
          }
        },
      });
  }
}
