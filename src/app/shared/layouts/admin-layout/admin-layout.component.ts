import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { APP_CONFIG } from '../../config/app-config';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  readonly appConfig = APP_CONFIG;
}
