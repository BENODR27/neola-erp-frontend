import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { APP_CONFIG } from '../../config/app-config';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {
  readonly appConfig = APP_CONFIG;
  private readonly auth = inject(AuthService);
  readonly employeeName = computed(() =>
    String(this.auth.currentUser()?.['employeeName'] || this.auth.currentUser()?.name || ''),
  );
}
