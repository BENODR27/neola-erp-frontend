import { Component } from '@angular/core';
import { APP_CONSTANTS } from '../../config/app-constants';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-second-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './second-navbar.component.html',
  styleUrl: './second-navbar.component.css',
})
export class SecondNavbarComponent {
  readonly routes = APP_CONSTANTS.routes;
}
