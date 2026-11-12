import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CONFIG } from '../../../shared/config/app-config';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  @Input() title = APP_CONFIG.name;
}
