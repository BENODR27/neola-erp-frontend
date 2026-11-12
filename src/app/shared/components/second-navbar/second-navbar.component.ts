import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-second-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './second-navbar.component.html',
  styleUrl: './second-navbar.component.css',
})
export class SecondNavbarComponent {
  @Input() isExpanded = false;
  constructor(public router: Router) {}

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
