import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme/theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme',
  imports: [CommonModule, FormsModule],
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.css',
})
export class ThemeComponent {
  colors: any = {
    primary: '',
    secondary: '',
    background: '',
    bodytextcolor: '',
    sidebartextcolor:''
  };

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.currentColors.subscribe((colors) => {
      if (colors) {
        this.colors = colors;
      }
    });
  }

  updateColor(key: string, value: string): void {
    this.themeService.updateColor(key, value);
  }
}
