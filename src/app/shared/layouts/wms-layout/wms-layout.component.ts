import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wms-layout',
  imports: [RouterOutlet, SidebarComponent, RouterModule, CommonModule],
  templateUrl: './wms-layout.component.html',
  styleUrl: './wms-layout.component.css',
})
export class WmsLayoutComponent {
  constructor(public authService: AuthService) {}
  logout() {
    this.authService.logout();
  }
}
