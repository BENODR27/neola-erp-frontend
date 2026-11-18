import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import Swal from 'sweetalert2';
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
    public sharedService: SharedServiceService,
    public authService: AuthService,
  ) {
    this.navbarItems = sharedService.navbarItems;
  }

  @Input() isMobileSidebarOpen = false;
  @Output() mobileClosed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  closeMobileSidebarOnEscape(): void {
    this.isMobileSidebarOpen = false;
    this.mobileClosed.emit();
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
