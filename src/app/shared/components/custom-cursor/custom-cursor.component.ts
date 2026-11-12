import { NgStyle } from '@angular/common';
import { Component, HostListener , signal} from '@angular/core';

@Component({
  selector: 'app-custom-cursor',
  imports: [NgStyle],
  templateUrl: './custom-cursor.component.html',
  styleUrls: ['./custom-cursor.component.css'],
})
export class CustomCursorComponent {
  readonly x = signal(0)
  readonly y = signal(0)

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.x.set(event.clientX);
    this.y.set(event.clientY);
  }
}
