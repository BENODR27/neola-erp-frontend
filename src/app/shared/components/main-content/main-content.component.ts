import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SecondNavbarComponent } from "../second-navbar/second-navbar.component";

@Component({
  selector: 'app-main-content',
  imports: [CommonModule, RouterOutlet, SecondNavbarComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.css',
})
export class MainContentComponent {
  @Input() isExpanded = false;
}
