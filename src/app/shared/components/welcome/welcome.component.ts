import { Component, Input } from '@angular/core';
import { SharedServiceService } from '../../services/shared-service/shared-service.service';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  @Input() title = 'ADMIN ';
  constructor(private sharedService: SharedServiceService) {
    this.sharedService.updateNavbarItems([]);
  }
}
