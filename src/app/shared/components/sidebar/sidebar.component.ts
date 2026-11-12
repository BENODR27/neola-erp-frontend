import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import Swal from 'sweetalert2';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { SharedServiceService } from '../../services/shared-service/shared-service.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isExpanded = false;
  readonly navbarItems: SharedServiceService['navbarItems'];

  constructor(
    private sharedService: SharedServiceService,
    public authService: AuthService
  ) {
    this.navbarItems = sharedService.navbarItems;
  }
  
  isMobileSidebarOpen = false;

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  @HostListener('document:keydown.escape')
  closeMobileSidebarOnEscape(): void {
    this.isMobileSidebarOpen = false;
  }

  logout() {
    Swal.fire({
      title: 'Do you want to Logout?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      denyButtonText: `No`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.authService.logout();
        Swal.fire('Logout SuccessFully!', '', 'success');
      } else if (result.isDenied) {
      }
    });
  }
}
