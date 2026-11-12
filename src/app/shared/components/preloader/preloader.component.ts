import { Component , signal} from '@angular/core';
import { LoadingService } from '../../services/Loading/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preloader',
  imports: [CommonModule],
  templateUrl: './preloader.component.html',
  styleUrl: './preloader.component.css',
})
export class PreloaderComponent {
  readonly isLoading = signal<boolean>(false)

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    // Subscribe to the loading observable to track the loading state
    this.loadingService.isLoading$.subscribe((loading: boolean) => {
      this.isLoading.set(loading);
    });
  }
}
